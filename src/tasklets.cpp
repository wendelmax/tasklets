/*
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @file tasklets.cpp
 * @brief Tasklets implementation - Node.js N-API bindings
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

 #include <napi.h>
 #include <memory>
 #include <functional>
 #include <string>
 #include <unordered_map>
 #include <mutex>
 #include <future>
 #include <algorithm>
 
 #include "../core/core.hpp"
 
 namespace tasklets {
 
 // =====================================================================
 // JavaScript Integration Helpers
 // =====================================================================
 
 /**
  * @brief Structure to hold JavaScript function references and result holders
  */
 struct JSContext {
     Napi::ThreadSafeFunction tsfn;
     Napi::Reference<Napi::Value> result_ref;
     std::string result_string;
     std::string error_string;
     bool has_error;
     bool completed;
     std::mutex completion_mutex;
     std::condition_variable completion_cv;
     
     JSContext(Napi::Env env, Napi::Function js_function) 
         : tsfn(Napi::ThreadSafeFunction::New(env, js_function, "TaskletsWorker", 0, 1)),
           has_error(false),
           completed(false) {}
 };
 
 /**
  * @brief Helper to create a JavaScript object with consistent structure
  */
 Napi::Object CreateResultObject(Napi::Env env, bool success, const std::string& data = "", const std::string& error = "") {
     Napi::Object obj = Napi::Object::New(env);
     obj.Set("success", Napi::Boolean::New(env, success));
     obj.Set("data", Napi::String::New(env, data));
     obj.Set("error", Napi::String::New(env, error));
     return obj;
 }
 
 /**
  * @brief Helper to create a batch result object
  */
 Napi::Object CreateBatchResultObject(Napi::Env env, const std::vector<uint64_t>& task_ids, 
                                    const std::vector<std::string>& results, 
                                    const std::vector<std::string>& errors) {
     Napi::Object obj = Napi::Object::New(env);
     
     // Convert task IDs to BigInt array
     Napi::Array task_ids_array = Napi::Array::New(env, task_ids.size());
     for (size_t i = 0; i < task_ids.size(); ++i) {
         task_ids_array.Set(i, Napi::BigInt::New(env, task_ids[i]));
     }
     
     // Convert results to string array
     Napi::Array results_array = Napi::Array::New(env, results.size());
     for (size_t i = 0; i < results.size(); ++i) {
         results_array.Set(i, Napi::String::New(env, results[i]));
     }
     
     // Convert errors to string array
     Napi::Array errors_array = Napi::Array::New(env, errors.size());
     for (size_t i = 0; i < errors.size(); ++i) {
         errors_array.Set(i, Napi::String::New(env, errors[i]));
     }
     
     obj.Set("taskIds", task_ids_array);
     obj.Set("results", results_array);
     obj.Set("errors", errors_array);
     obj.Set("count", Napi::Number::New(env, task_ids.size()));
     obj.Set("successCount", Napi::Number::New(env, std::count(errors.begin(), errors.end(), "")));
     obj.Set("errorCount", Napi::Number::New(env, std::count_if(errors.begin(), errors.end(), [](const std::string& s) { return !s.empty(); })));
     
     return obj;
 }
 
 /**
  * @brief Helper to create a promise that resolves with a result object
  */
 Napi::Promise CreatePromise(Napi::Env env, std::function<Napi::Object()> resultFunction) {
     auto deferred = Napi::Promise::Deferred::New(env);
     
     // Execute the function and resolve the promise
     try {
         Napi::Object result = resultFunction();
         deferred.Resolve(result);
     } catch (const std::exception& e) {
         Napi::Object error_obj = CreateResultObject(env, false, "", e.what());
         deferred.Reject(error_obj);
     }
     
     return deferred.Promise();
 }
 
 // =====================================================================
 // Global State Management
 // =====================================================================
 
 static std::unique_ptr<NativeThreadPool> thread_pool;
 static std::unordered_map<uint64_t, std::unique_ptr<JSContext>> js_contexts;
 static std::mutex contexts_mutex;
 static std::atomic<uint64_t> next_context_id{1};
 
 // =====================================================================
 // JavaScript Function Execution
 // =====================================================================
 
 /**
  * @brief Executes a JavaScript function in the thread pool
  */
 uint64_t execute_js_function(Napi::Function js_function, Napi::Env env) {
     auto context_id = next_context_id.fetch_add(1);
     auto context = std::make_unique<JSContext>(env, js_function);
     
     {
         std::lock_guard<std::mutex> lock(contexts_mutex);
         js_contexts[context_id] = std::move(context);
     }
     
     // Create a C++ task that will execute the JavaScript function
     auto task = [context_id]() {
         std::lock_guard<std::mutex> lock(contexts_mutex);
         auto context_it = js_contexts.find(context_id);
         if (context_it == js_contexts.end()) {
             return;
         }
         JSContext* context = context_it->second.get();
         
         // Execute the JavaScript function
         auto status = context->tsfn.BlockingCall([context](Napi::Env env, Napi::Function jsCallback) {
             try {
                 Napi::Value result = jsCallback.Call({});
                 
                 // Store the result
                 if (result.IsString()) {
                     context->result_string = result.As<Napi::String>().Utf8Value();
                 } else if (result.IsNumber()) {
                     context->result_string = std::to_string(result.As<Napi::Number>().DoubleValue());
                 } else if (result.IsBoolean()) {
                     context->result_string = result.As<Napi::Boolean>().Value() ? "true" : "false";
                 } else {
                     context->result_string = "[Object]";
                 }
                 
                 context->has_error = false;
             } catch (const Napi::Error& e) {
                 context->error_string = e.Message();
                 context->has_error = true;
             } catch (...) {
                 context->error_string = "Unknown JavaScript error";
                 context->has_error = true;
             }
             
             context->completed = true;
             context->completion_cv.notify_all();
         });
         
         if (status != napi_ok) {
             context->error_string = "Failed to execute JavaScript function";
             context->has_error = true;
             context->completed = true;
             context->completion_cv.notify_all();
         }
     };
     
     return thread_pool->spawn(task);
 }
 
 // =====================================================================
 // N-API Function Implementations
 // =====================================================================
 
 Napi::Value Spawn(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsFunction()) {
         Napi::TypeError::New(env, "First argument must be a function").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     Napi::Function js_function = info[0].As<Napi::Function>();
     
     try {
         uint64_t tasklet_id = execute_js_function(js_function, env);
         return Napi::BigInt::New(env, tasklet_id);
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value Run(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments. Expected: run(task) or run(tasks) or run(count, task)").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     // Case 1: run(task) - Single function
     if (info[0].IsFunction()) {
         Napi::Function js_function = info[0].As<Napi::Function>();
         
         return CreatePromise(env, [env, js_function]() {
             // Spawn the task
             uint64_t tasklet_id = execute_js_function(js_function, env);
             
             // Wait for completion
             thread_pool->join(tasklet_id);
             
             // Get result
             std::string result = thread_pool->get_result(tasklet_id);
             std::string error = thread_pool->get_error(tasklet_id);
             
             // Create result object
             Napi::Object result_obj = Napi::Object::New(env);
             result_obj.Set("success", Napi::Boolean::New(env, error.empty()));
             result_obj.Set("data", Napi::String::New(env, result));
             result_obj.Set("error", Napi::String::New(env, error));
             result_obj.Set("taskId", Napi::BigInt::New(env, tasklet_id));
             result_obj.Set("type", Napi::String::New(env, "single"));
             
             return result_obj;
         });
     }
     
     // Case 2: run(tasks) - Array of functions
     if (info[0].IsArray()) {
         Napi::Array tasks_array = info[0].As<Napi::Array>();
         
         return CreatePromise(env, [env, tasks_array]() {
             // Notify auto-config about batch pattern for optimization
             AutoConfig::get_instance().record_batch_pattern(tasks_array.Length());
             
             // Check if multiprocessor optimization should be used
             bool use_multiprocessor = tasks_array.Length() > 1000 && Multiprocessor::get_instance().is_enabled();
             
             if (use_multiprocessor) {
                 Logger::debug("Tasklets", "Processing large array batch of " + std::to_string(tasks_array.Length()) + " tasks with multiprocessor optimization");
             }
             
             std::vector<uint64_t> task_ids;
             task_ids.reserve(tasks_array.Length());
             
             // Spawn all tasks
             for (uint32_t i = 0; i < tasks_array.Length(); ++i) {
                 Napi::Value task_value = tasks_array.Get(i);
                 if (!task_value.IsFunction()) {
                     throw std::runtime_error("All array elements must be functions");
                 }
                 
                 Napi::Function js_function = task_value.As<Napi::Function>();
                 
                 auto wrapped_function = [js_function, env, i]() {
                     auto context_id = next_context_id.fetch_add(1);
                     auto context = std::make_unique<JSContext>(env, js_function);
                     
                     {
                         std::lock_guard<std::mutex> lock(contexts_mutex);
                         js_contexts[context_id] = std::move(context);
                     }
                     
                     auto status = context->tsfn.BlockingCall([context = context.get()](Napi::Env env, Napi::Function jsCallback) {
                         try {
                             Napi::Value result = jsCallback.Call({});
                             
                             if (result.IsString()) {
                                 context->result_string = result.As<Napi::String>().Utf8Value();
                             } else if (result.IsNumber()) {
                                 context->result_string = std::to_string(result.As<Napi::Number>().DoubleValue());
                             } else if (result.IsBoolean()) {
                                 context->result_string = result.As<Napi::Boolean>().Value() ? "true" : "false";
                             } else {
                                 context->result_string = "[Object]";
                             }
                             
                             context->has_error = false;
                         } catch (const Napi::Error& e) {
                             context->error_string = e.Message();
                             context->has_error = true;
                         } catch (...) {
                             context->error_string = "Unknown JavaScript error";
                             context->has_error = true;
                         }
                         
                         context->completed = true;
                         context->completion_cv.notify_all();
                     });
                     
                     if (status != napi_ok) {
                         context->error_string = "Failed to execute JavaScript function";
                         context->has_error = true;
                         context->completed = true;
                         context->completion_cv.notify_all();
                     }
                 };
                 
                 task_ids.push_back(thread_pool->spawn(wrapped_function));
             }
             
             // Wait for all tasks to complete
             for (auto task_id : task_ids) {
                 thread_pool->join(task_id);
             }
             
             // Collect results and errors
             std::vector<std::string> results;
             std::vector<std::string> errors;
             results.reserve(task_ids.size());
             errors.reserve(task_ids.size());
             
             for (auto task_id : task_ids) {
                 results.push_back(thread_pool->get_result(task_id));
                 errors.push_back(thread_pool->get_error(task_id));
             }
             
             Napi::Object batch_obj = CreateBatchResultObject(env, task_ids, results, errors);
             batch_obj.Set("type", Napi::String::New(env, "array"));
             
             return batch_obj;
         });
     }
     
     // Case 3: run(count, task) - Batch with count and function
     if (info[0].IsNumber() && info.Length() >= 2 && info[1].IsFunction()) {
         uint32_t count = info[0].As<Napi::Number>().Uint32Value();
         Napi::Function js_function = info[1].As<Napi::Function>();
         
         return CreatePromise(env, [env, count, js_function]() {
             // Notify auto-config about batch pattern for optimization
             AutoConfig::get_instance().record_batch_pattern(count);
             
             // Check if multiprocessor optimization should be used
             bool use_multiprocessor = count > 1000 && Multiprocessor::get_instance().is_enabled();
             
             if (use_multiprocessor) {
                 Logger::debug("Tasklets", "Processing large batch of " + std::to_string(count) + " tasks with multiprocessor optimization");
             }
             
             std::vector<uint64_t> task_ids;
             task_ids.reserve(count);
             
             // Spawn all tasks with multiprocessor optimization for large batches
             if (use_multiprocessor) {
                 // Use multiprocessor for large batches - process in chunks
                 size_t chunk_size = std::max(static_cast<size_t>(100), static_cast<size_t>(count / std::thread::hardware_concurrency()));
                 std::vector<std::future<std::vector<uint64_t>>> chunk_futures;
                 
                 for (size_t chunk_start = 0; chunk_start < count; chunk_start += chunk_size) {
                     size_t chunk_end = std::min(chunk_start + chunk_size, static_cast<size_t>(count));
                     
                     auto chunk_future = std::async(std::launch::async, [&, chunk_start, chunk_end]() {
                         std::vector<uint64_t> chunk_task_ids;
                         chunk_task_ids.reserve(chunk_end - chunk_start);
                         
                         for (size_t i = chunk_start; i < chunk_end; ++i) {
                             auto wrapped_function = [js_function, env, i]() {
                                 auto context_id = next_context_id.fetch_add(1);
                                 auto context = std::make_unique<JSContext>(env, js_function);
                                 
                                 {
                                     std::lock_guard<std::mutex> lock(contexts_mutex);
                                     js_contexts[context_id] = std::move(context);
                                 }
                                 
                                 auto status = context->tsfn.BlockingCall([context = context.get(), i](Napi::Env env, Napi::Function jsCallback) {
                                     try {
                                         Napi::Value result = jsCallback.Call({Napi::Number::New(env, i)});
                                         
                                         if (result.IsString()) {
                                             context->result_string = result.As<Napi::String>().Utf8Value();
                                         } else if (result.IsNumber()) {
                                             context->result_string = std::to_string(result.As<Napi::Number>().DoubleValue());
                                         } else if (result.IsBoolean()) {
                                             context->result_string = result.As<Napi::Boolean>().Value() ? "true" : "false";
                                         } else {
                                             context->result_string = "[Object]";
                                         }
                                         
                                         context->has_error = false;
                                     } catch (const Napi::Error& e) {
                                         context->error_string = e.Message();
                                         context->has_error = true;
                                     } catch (...) {
                                         context->error_string = "Unknown JavaScript error";
                                         context->has_error = true;
                                     }
                                     
                                     context->completed = true;
                                     context->completion_cv.notify_all();
                                 });
                                 
                                 if (status != napi_ok) {
                                     context->error_string = "Failed to execute JavaScript function";
                                     context->has_error = true;
                                     context->completed = true;
                                     context->completion_cv.notify_all();
                                 }
                             };
                             
                             chunk_task_ids.push_back(thread_pool->spawn(wrapped_function));
                         }
                         
                         return chunk_task_ids;
                     });
                     
                     chunk_futures.push_back(std::move(chunk_future));
                 }
                 
                 // Collect all task IDs from chunks
                 for (auto& future : chunk_futures) {
                     auto chunk_ids = future.get();
                     task_ids.insert(task_ids.end(), chunk_ids.begin(), chunk_ids.end());
                 }
             } else {
                 // Standard spawning for smaller batches
                 for (uint32_t i = 0; i < count; ++i) {
                     auto wrapped_function = [js_function, env, i]() {
                         auto context_id = next_context_id.fetch_add(1);
                         auto context = std::make_unique<JSContext>(env, js_function);
                         
                         {
                             std::lock_guard<std::mutex> lock(contexts_mutex);
                             js_contexts[context_id] = std::move(context);
                         }
                         
                         auto status = context->tsfn.BlockingCall([context = context.get(), i](Napi::Env env, Napi::Function jsCallback) {
                             try {
                                 Napi::Value result = jsCallback.Call({Napi::Number::New(env, i)});
                                 
                                 if (result.IsString()) {
                                     context->result_string = result.As<Napi::String>().Utf8Value();
                                 } else if (result.IsNumber()) {
                                     context->result_string = std::to_string(result.As<Napi::Number>().DoubleValue());
                                 } else if (result.IsBoolean()) {
                                     context->result_string = result.As<Napi::Boolean>().Value() ? "true" : "false";
                                 } else {
                                     context->result_string = "[Object]";
                                 }
                                 
                                 context->has_error = false;
                             } catch (const Napi::Error& e) {
                                 context->error_string = e.Message();
                                 context->has_error = true;
                             } catch (...) {
                                 context->error_string = "Unknown JavaScript error";
                                 context->has_error = true;
                             }
                             
                             context->completed = true;
                             context->completion_cv.notify_all();
                         });
                         
                         if (status != napi_ok) {
                             context->error_string = "Failed to execute JavaScript function";
                             context->has_error = true;
                             context->completed = true;
                             context->completion_cv.notify_all();
                         }
                     };
                     
                     task_ids.push_back(thread_pool->spawn(wrapped_function));
                 }
             }
             
             // Wait for all tasks to complete
             for (auto task_id : task_ids) {
                 thread_pool->join(task_id);
             }
             
             // Collect results and errors
             std::vector<std::string> results;
             std::vector<std::string> errors;
             results.reserve(task_ids.size());
             errors.reserve(task_ids.size());
             
             for (auto task_id : task_ids) {
                 results.push_back(thread_pool->get_result(task_id));
                 errors.push_back(thread_pool->get_error(task_id));
             }
             
             Napi::Object batch_obj = CreateBatchResultObject(env, task_ids, results, errors);
             batch_obj.Set("type", Napi::String::New(env, "batch"));
             
             return batch_obj;
         });
     }
     
     Napi::TypeError::New(env, "Invalid arguments. Expected: run(task) or run(tasks) or run(count, task)").ThrowAsJavaScriptException();
     return env.Null();
 }
 
 Napi::Value Join(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsBigInt()) {
         Napi::TypeError::New(env, "First argument must be a BigInt").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     bool lossless;
     uint64_t tasklet_id = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
     
     try {
         thread_pool->join(tasklet_id);
         return env.Undefined();
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value GetResult(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsBigInt()) {
         Napi::TypeError::New(env, "First argument must be a BigInt").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     bool lossless;
     uint64_t tasklet_id = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
     
     try {
         std::string result = thread_pool->get_result(tasklet_id);
         return Napi::String::New(env, result);
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value HasError(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsBigInt()) {
         Napi::TypeError::New(env, "First argument must be a BigInt").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     bool lossless;
     uint64_t tasklet_id = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
     
     try {
         bool has_error = thread_pool->has_error(tasklet_id);
         return Napi::Boolean::New(env, has_error);
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value GetError(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsBigInt()) {
         Napi::TypeError::New(env, "First argument must be a BigInt").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     bool lossless;
     uint64_t tasklet_id = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
     
     try {
         std::string error = thread_pool->get_error(tasklet_id);
         return Napi::String::New(env, error);
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value IsFinished(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsBigInt()) {
         Napi::TypeError::New(env, "First argument must be a BigInt").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     bool lossless;
     uint64_t tasklet_id = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
     
     try {
         bool is_finished = thread_pool->is_finished(tasklet_id);
         return Napi::Boolean::New(env, is_finished);
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value GetStats(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     try {
         SchedulerStats stats = thread_pool->get_stats();
         
         Napi::Object stats_obj = Napi::Object::New(env);
         stats_obj.Set("activeThreads", Napi::Number::New(env, stats.active_threads));
         stats_obj.Set("completedThreads", Napi::Number::New(env, stats.completed_threads));
         stats_obj.Set("failedThreads", Napi::Number::New(env, stats.failed_threads));
         stats_obj.Set("workerThreads", Napi::Number::New(env, stats.worker_threads));
         stats_obj.Set("averageExecutionTimeMs", Napi::Number::New(env, stats.average_execution_time_ms));
         stats_obj.Set("successRate", Napi::Number::New(env, stats.success_rate));
         
         return stats_obj;
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value GetSystemInfo(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     try {
         Napi::Object system_info = Napi::Object::New(env);
         
         // Get thread pool stats
         SchedulerStats thread_stats = thread_pool->get_stats();
         system_info.Set("completedTasks", Napi::Number::New(env, thread_stats.completed_threads));
         system_info.Set("failedTasks", Napi::Number::New(env, thread_stats.failed_threads));
         system_info.Set("averageExecutionTimeMs", Napi::Number::New(env, thread_stats.average_execution_time_ms));
         system_info.Set("workerThreads", Napi::Number::New(env, thread_stats.worker_threads));
         
         // Add system status fields
         system_info.Set("memoryManagerInitialized", Napi::Boolean::New(env, true)); // TODO: Get actual status
         system_info.Set("autoConfigInitialized", Napi::Boolean::New(env, true)); // TODO: Get actual status
         system_info.Set("multiprocessorInitialized", Napi::Boolean::New(env, true)); // TODO: Get actual status
         
         // Get memory stats
         MemoryStats memory_stats = MemoryManager::get_instance().get_memory_stats();
         system_info.Set("totalMemoryMB", Napi::Number::New(env, memory_stats.system_total_memory_bytes / (1024 * 1024)));
         system_info.Set("usedMemoryMB", Napi::Number::New(env, memory_stats.system_used_memory_bytes / (1024 * 1024)));
         system_info.Set("freeMemoryMB", Napi::Number::New(env, memory_stats.system_free_memory_bytes / (1024 * 1024)));
         system_info.Set("memoryUsagePercent", Napi::Number::New(env, memory_stats.system_memory_usage_percent));
         
         // Get auto-config settings
         auto auto_config_settings = AutoConfig::get_instance().get_settings();
         system_info.Set("autoConfigEnabled", Napi::Boolean::New(env, auto_config_settings.is_enabled));
         system_info.Set("autoConfigStrategy", Napi::Number::New(env, static_cast<int>(auto_config_settings.strategy)));
         
         // Get multiprocessor stats
         MultiprocessorStats multiprocessor_stats = Multiprocessor::get_instance().get_stats();
         system_info.Set("multiprocessorEnabled", Napi::Boolean::New(env, multiprocessor_stats.total_operations > 0));
         system_info.Set("parallelOperations", Napi::Number::New(env, multiprocessor_stats.parallel_operations));
         system_info.Set("sequentialOperations", Napi::Number::New(env, multiprocessor_stats.sequential_operations));
         system_info.Set("avgProcessingTime", Napi::Number::New(env, multiprocessor_stats.avg_processing_time.count()));
         system_info.Set("totalProcessingTime", Napi::Number::New(env, multiprocessor_stats.total_processing_time.count()));
         
         return system_info;
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value Batch(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 2) {
         Napi::TypeError::New(env, "Wrong number of arguments. Expected: batch(count, task)").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsNumber()) {
         Napi::TypeError::New(env, "First argument must be a number (count)").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[1].IsFunction()) {
         Napi::TypeError::New(env, "Second argument must be a function (task)").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     uint32_t count = info[0].As<Napi::Number>().Uint32Value();
     Napi::Function js_function = info[1].As<Napi::Function>();
     
     try {
         std::vector<uint64_t> task_ids;
         task_ids.reserve(count);
         
         for (uint32_t i = 0; i < count; ++i) {
             // Create a wrapper function that captures the index
             auto wrapped_function = [js_function, env, i]() {
                 auto context_id = next_context_id.fetch_add(1);
                 auto context = std::make_unique<JSContext>(env, js_function);
                 
                 {
                     std::lock_guard<std::mutex> lock(contexts_mutex);
                     js_contexts[context_id] = std::move(context);
                 }
                 
                 // Execute the JavaScript function with the index
                 auto status = context->tsfn.BlockingCall([context = context.get(), i](Napi::Env env, Napi::Function jsCallback) {
                     try {
                         Napi::Value result = jsCallback.Call({Napi::Number::New(env, i)});
                         
                         // Store the result
                         if (result.IsString()) {
                             context->result_string = result.As<Napi::String>().Utf8Value();
                         } else if (result.IsNumber()) {
                             context->result_string = std::to_string(result.As<Napi::Number>().DoubleValue());
                         } else if (result.IsBoolean()) {
                             context->result_string = result.As<Napi::Boolean>().Value() ? "true" : "false";
                         } else {
                             context->result_string = "[Object]";
                         }
                         
                         context->has_error = false;
                     } catch (const Napi::Error& e) {
                         context->error_string = e.Message();
                         context->has_error = true;
                     } catch (...) {
                         context->error_string = "Unknown JavaScript error";
                         context->has_error = true;
                     }
                     
                     context->completed = true;
                     context->completion_cv.notify_all();
                 });
                 
                 if (status != napi_ok) {
                     context->error_string = "Failed to execute JavaScript function";
                     context->has_error = true;
                     context->completed = true;
                     context->completion_cv.notify_all();
                 }
             };
             
             task_ids.push_back(thread_pool->spawn(wrapped_function));
         }
         
         // Convert to JavaScript array
         Napi::Array result_array = Napi::Array::New(env, task_ids.size());
         for (size_t i = 0; i < task_ids.size(); ++i) {
             result_array.Set(i, Napi::BigInt::New(env, task_ids[i]));
         }
         
         return result_array;
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value JoinBatch(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments. Expected: joinBatch(taskIds)").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     if (!info[0].IsArray()) {
         Napi::TypeError::New(env, "First argument must be an array of task IDs").ThrowAsJavaScriptException();
         return env.Null();
     }
     
     Napi::Array task_ids_array = info[0].As<Napi::Array>();
     
     try {
         for (uint32_t i = 0; i < task_ids_array.Length(); ++i) {
             Napi::Value task_id_value = task_ids_array.Get(i);
             if (!task_id_value.IsBigInt()) {
                 Napi::TypeError::New(env, "Task ID must be a BigInt").ThrowAsJavaScriptException();
                 return env.Null();
             }
             
             bool lossless;
             uint64_t task_id = task_id_value.As<Napi::BigInt>().Uint64Value(&lossless);
             thread_pool->join(task_id);
         }
         
         return env.Undefined();
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 Napi::Value GetMemoryStats(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     try {
         MemoryStats memory_stats = MemoryManager::get_instance().get_memory_stats();
         
         Napi::Object stats_obj = Napi::Object::New(env);
         stats_obj.Set("totalMemoryMB", Napi::Number::New(env, memory_stats.system_total_memory_bytes / (1024 * 1024)));
         stats_obj.Set("usedMemoryMB", Napi::Number::New(env, memory_stats.system_used_memory_bytes / (1024 * 1024)));
         stats_obj.Set("freeMemoryMB", Napi::Number::New(env, memory_stats.system_free_memory_bytes / (1024 * 1024)));
         stats_obj.Set("systemMemoryUsagePercent", Napi::Number::New(env, memory_stats.system_memory_usage_percent));
         stats_obj.Set("activeTasklets", Napi::Number::New(env, memory_stats.active_tasklets));
         stats_obj.Set("timeSinceLastCleanupMs", Napi::Number::New(env, static_cast<double>(memory_stats.time_since_last_cleanup_ms)));
         
         return stats_obj;
     } catch (const std::exception& e) {
         Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
         return env.Null();
     }
 }
 
 // =====================================================================
 // Module Initialization
 // =====================================================================
 
 Napi::Object Init(Napi::Env env, Napi::Object exports) {
     // Initialize the thread pool
     thread_pool = std::make_unique<NativeThreadPool>();
     
     // Export functions
     exports.Set("spawn", Napi::Function::New(env, Spawn));
     exports.Set("run", Napi::Function::New(env, Run));
     exports.Set("join", Napi::Function::New(env, Join));
     exports.Set("getResult", Napi::Function::New(env, GetResult));
     exports.Set("hasError", Napi::Function::New(env, HasError));
     exports.Set("getError", Napi::Function::New(env, GetError));
     exports.Set("isFinished", Napi::Function::New(env, IsFinished));
     exports.Set("getStats", Napi::Function::New(env, GetStats));
     exports.Set("getSystemInfo", Napi::Function::New(env, GetSystemInfo));
     exports.Set("batch", Napi::Function::New(env, Batch));
     exports.Set("joinBatch", Napi::Function::New(env, JoinBatch));
     exports.Set("getMemoryStats", Napi::Function::New(env, GetMemoryStats));
     
     return exports;
 }
 
 NODE_API_MODULE(tasklets, Init)
 
 } // namespace tasklets 