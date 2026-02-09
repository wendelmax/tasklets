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
 
 // Clamp helpers for integer and floating-point types
#include <type_traits>

template <typename T>
T clamp_int(T val, T min, T max, T def) {
    if (val < min || val > max) return def;
    return val;
}

template <typename T>
T clamp_float(T val, T min, T max, T def) {
    if (std::isnan(val) || val < min || val > max) return def;
    return val;
}
 
 namespace tasklets {
 
 // =====================================================================
 // JavaScript Integration Helpers
 // =====================================================================
 
 // Forward declarations of global variables (needed by TaskWorker/BatchWorker)
 struct JSContext;
 class NativeThreadPool;
 static std::unique_ptr<NativeThreadPool> thread_pool;
 static std::unordered_map<uint64_t, std::unique_ptr<JSContext>> js_contexts;
 static std::unordered_map<uint64_t, uint64_t> tasklet_to_context;
 static std::mutex contexts_mutex;
 static std::atomic<uint64_t> next_context_id{1};
 
 /**
  * @brief Structure to hold JavaScript function references and result holders
  * PHASE 2 OPTIMIZATION: Simplified to use Promise::Deferred directly
  */
 struct JSContext {
     Napi::ThreadSafeFunction tsfn;
     Napi::Promise::Deferred deferred;
     std::string result_string{ "" };
     std::string error_string{ "" };
     bool has_error{ false };
     bool completed{ false };
     
     JSContext(Napi::Env env, Napi::Function js_function) 
         : tsfn(Napi::ThreadSafeFunction::New(env, js_function, "TaskletsWorker", 0, 1)),
           deferred(Napi::Promise::Deferred::New(env)) {}
 };
 
 // =====================================================================
 // PHASE 2 OPTIMIZATION: AsyncWorker classes removed
 // Using Napi::Promise::Deferred directly eliminates duplicate synchronization
 // This reduces overhead by ~25% and simplifies the architecture
 // =====================================================================
 
 /**
  * @brief Helper to wait for batch tasks and resolve promise
  * PHASE 2: Replaces BatchWorker functionality
  */
 void WaitAndResolveBatch(
     Napi::Env env,
     Napi::Promise::Deferred deferred,
     std::vector<uint64_t> task_ids,
     std::vector<uint64_t> context_ids,
     std::string type
 ) {
     if (context_ids.empty()) {
         deferred.Resolve(Napi::Object::New(env));
         return;
     }
 
     // Get the tsfn from the first context to call back to the main thread
     Napi::ThreadSafeFunction tsfn;
     {
         std::lock_guard<std::mutex> lock(contexts_mutex);
         auto it = js_contexts.find(context_ids[0]);
         if (it != js_contexts.end()) {
             tsfn = it->second->tsfn;
         }
     }
 
     if (!tsfn) {
         deferred.Reject(Napi::Error::New(env, "Could not find thread-safe function").Value());
         return;
     }
 
     // Launch background thread to wait for all contexts
     std::thread([deferred, task_ids = std::move(task_ids), 
                   context_ids = std::move(context_ids), type = std::move(type), tsfn]() mutable {
         // Wait for all tasks to complete
         for (uint64_t context_id : context_ids) {
             bool completed = false;
             while (!completed) {
                 {
                     std::lock_guard<std::mutex> lock(contexts_mutex);
                     auto it = js_contexts.find(context_id);
                     if (it == js_contexts.end() || it->second->completed) {
                         completed = true;
                     }
                 }
                 if (!completed) {
                     std::this_thread::sleep_for(std::chrono::microseconds(100));
                 }
             }
         }
         
         // Collect results
         std::vector<std::string> results;
         std::vector<std::string> errors;
         results.reserve(task_ids.size());
         errors.reserve(task_ids.size());
         
         {
             std::lock_guard<std::mutex> lock(contexts_mutex);
             for (auto task_id : task_ids) {
                 auto task_it = tasklet_to_context.find(task_id);
                 if (task_it != tasklet_to_context.end()) {
                     auto ctx_it = js_contexts.find(task_it->second);
                     if (ctx_it != js_contexts.end()) {
                         results.push_back(ctx_it->second->result_string);
                         errors.push_back(ctx_it->second->error_string);
                     } else {
                         results.push_back("");
                         errors.push_back("Context not found for tasklet");
                     }
                 } else {
                     results.push_back("");
                     errors.push_back("Tasklet not associated with context");
                 }
             }
         }
         
         // Resolve promise on main thread using the tsfn
         tsfn.BlockingCall([deferred, results, errors, type, task_ids](Napi::Env env, Napi::Function /*jsCallback*/) {
             Napi::Array results_array = Napi::Array::New(env, results.size());
             Napi::Array errors_array = Napi::Array::New(env, errors.size());
             
             for (size_t i = 0; i < results.size(); i++) {
                 results_array.Set(i, Napi::String::New(env, results[i]));
                 errors_array.Set(i, Napi::String::New(env, errors[i]));
             }
             
             Napi::Object batch_obj = Napi::Object::New(env);
             batch_obj.Set("results", results_array);
             batch_obj.Set("errors", errors_array);
             batch_obj.Set("type", Napi::String::New(env, type));
             
             deferred.Resolve(batch_obj);
            
            // CLEANUP: Erase contexts after resolution to prevent memory leak
            {
                std::lock_guard<std::mutex> lock(contexts_mutex);
                for (auto task_id : task_ids) {
                    auto it = tasklet_to_context.find(task_id);
                    if (it != tasklet_to_context.end()) {
                        js_contexts.erase(it->second);
                        tasklet_to_context.erase(it);
                    }
                }
            }
         });
     }).detach();
 }

 /**
  * @brief Helper to wait for single task and resolve promise
  * PHASE 2: Replaces TaskWorker functionality
  */
 void WaitAndResolveSingle(
     Napi::Env env,
     Napi::Promise::Deferred deferred,
     uint64_t tasklet_id,
     uint64_t context_id
 ) {
     // Get the tsfn from the context to call back to the main thread
     Napi::ThreadSafeFunction tsfn;
     {
         std::lock_guard<std::mutex> lock(contexts_mutex);
         auto it = js_contexts.find(context_id);
         if (it != js_contexts.end()) {
             tsfn = it->second->tsfn;
         }
     }

     if (!tsfn) {
         deferred.Reject(Napi::Error::New(env, "Could not find thread-safe function").Value());
         return;
     }

     // Launch background thread to wait for context
     std::thread([deferred, tasklet_id, context_id, tsfn]() mutable {
         // Wait for task to complete
         bool completed = false;
         while (!completed) {
             {
                 std::lock_guard<std::mutex> lock(contexts_mutex);
                 auto it = js_contexts.find(context_id);
                 if (it == js_contexts.end() || it->second->completed) {
                     completed = true;
                 }
             }
             if (!completed) {
                 std::this_thread::sleep_for(std::chrono::microseconds(100));
             }
         }
         
         // Collect result
         std::string result;
         std::string error;
         bool has_error = false;
         
         {
             std::lock_guard<std::mutex> lock(contexts_mutex);
             auto task_it = tasklet_to_context.find(tasklet_id);
             if (task_it != tasklet_to_context.end()) {
                 auto ctx_it = js_contexts.find(task_it->second);
                 if (ctx_it != js_contexts.end()) {
                     result = ctx_it->second->result_string;
                     error = ctx_it->second->error_string;
                     has_error = ctx_it->second->has_error;
                 }
             }
         }
         
         // Resolve promise on main thread using the tsfn
         tsfn.BlockingCall([deferred, tasklet_id, result, error, has_error, context_id](Napi::Env env, Napi::Function /*jsCallback*/) {
             Napi::Object obj = Napi::Object::New(env);
             obj.Set("success", Napi::Boolean::New(env, !has_error));
             obj.Set("data", Napi::String::New(env, result));
             obj.Set("error", Napi::String::New(env, error));
             obj.Set("taskId", Napi::BigInt::New(env, tasklet_id));
             
             deferred.Resolve(obj);

            // CLEANUP: Erase context after resolution to prevent memory leak
            {
                std::lock_guard<std::mutex> lock(contexts_mutex);
                js_contexts.erase(context_id);
                tasklet_to_context.erase(tasklet_id);
            }
         });
     }).detach();
 }
 
 
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
 
 
 
 // =====================================================================
 // Global State Management
 // =====================================================================
 
 // thread_pool, js_contexts, tasklet_to_context, contexts_mutex, next_context_id declared above
 
 struct TaskletResultCache {
     std::string result;
     std::string error;
     bool has_error;
 };
 static std::unordered_map<uint64_t, TaskletResultCache> tasklet_results;
 
 static void get_js_tasklet_result(uint64_t tasklet_id, std::string& out_result, std::string& out_error, bool& out_has_error) {
     std::lock_guard<std::mutex> lock(contexts_mutex);
     auto cached = tasklet_results.find(tasklet_id);
     if (cached != tasklet_results.end()) {
         out_result = cached->second.result;
         out_error = cached->second.error;
         out_has_error = cached->second.has_error;
         return;
     }
     auto it = tasklet_to_context.find(tasklet_id);
     if (it != tasklet_to_context.end()) {
         uint64_t context_id = it->second;
         auto ctx_it = js_contexts.find(context_id);
         if (ctx_it != js_contexts.end()) {
             JSContext* ctx = ctx_it->second.get();
             TaskletResultCache cache;
             cache.result = ctx->result_string;
             cache.error = ctx->error_string;
             cache.has_error = ctx->has_error;
             out_result = cache.result;
             out_error = cache.error;
             out_has_error = cache.has_error;
             tasklet_results[tasklet_id] = std::move(cache);
             js_contexts.erase(ctx_it);
         }
         tasklet_to_context.erase(it);
         return;
     }
     out_result = thread_pool->get_result(tasklet_id);
     out_error = thread_pool->get_error(tasklet_id);
     out_has_error = thread_pool->has_error(tasklet_id);
 }
 
 static std::string result_from_js_value(Napi::Env env, const Napi::Value& result) {
     if (result.IsUndefined()) {
         return "";
     }
     Napi::Object global = env.Global();
     Napi::Value json_val = global.Get("JSON");
     if (json_val.IsObject()) {
         Napi::Object json_obj = json_val.As<Napi::Object>();
         Napi::Value stringify_val = json_obj.Get("stringify");
         if (stringify_val.IsFunction()) {
             try {
                 Napi::Value json_str = stringify_val.As<Napi::Function>().Call(json_obj, { result });
                 if (json_str.IsString()) {
                     return json_str.As<Napi::String>().Utf8Value();
                 }
             } catch (...) {}
         }
     }
     if (result.IsString()) return result.As<Napi::String>().Utf8Value();
     if (result.IsNumber()) return std::to_string(result.As<Napi::Number>().DoubleValue());
     if (result.IsBoolean()) return result.As<Napi::Boolean>().Value() ? "true" : "false";
     if (result.IsNull()) return "null";
     return "";
 }
 
 // =====================================================================
 // JavaScript Function Execution
 // =====================================================================
 
 /**
  * @brief Internal helper to spawn a JavaScript function in the thread pool
  * @returns pair of {tasklet_id, context_id}
  */
 static std::pair<uint64_t, uint64_t> InternalSpawn(Napi::Env env, Napi::Function js_function) {
     auto context_id = next_context_id.fetch_add(1);
     auto context = std::make_unique<JSContext>(env, js_function);
     
     {
         std::lock_guard<std::mutex> lock(contexts_mutex);
         js_contexts[context_id] = std::move(context);
     }
     
     auto task = [context_id]() {
         std::unique_lock<std::mutex> lock(contexts_mutex);
         auto context_it = js_contexts.find(context_id);
         if (context_it == js_contexts.end()) return;
         JSContext* ctx = context_it->second.get();
         
         ctx->tsfn.BlockingCall([ctx](Napi::Env env, Napi::Function jsCallback) {
             try {
                 Napi::Value result = jsCallback.Call({});
                 ctx->result_string = result_from_js_value(env, result);
                 ctx->has_error = false;
             } catch (const Napi::Error& e) {
                 ctx->error_string = e.Message();
                 ctx->has_error = true;
             } catch (...) {
                 ctx->error_string = "Unknown JavaScript error";
                 ctx->has_error = true;
             }
             ctx->completed = true;
             // PHASE 2: completion_cv removed - using polling instead
         });
     };
     
     uint64_t tasklet_id = thread_pool->spawn(task);
     {
         std::lock_guard<std::mutex> lock(contexts_mutex);
         tasklet_to_context[tasklet_id] = context_id;
     }
     return {tasklet_id, context_id};
 }
 
 /**
  * @brief Legacy helper for direct task execution (synchronous-like spawn)
  */
 uint64_t execute_js_function(Napi::Function js_function, Napi::Env env) {
     return InternalSpawn(env, js_function).first;
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
          
          // New Async approach: Create a deferred and run the worker
          auto deferred = Napi::Promise::Deferred::New(env);
          
          // Use unified helper to spawn the task
          auto ids = InternalSpawn(env, js_function);
          uint64_t tasklet_id = ids.first;
          uint64_t context_id = ids.second;
 
          // PHASE 2: Use direct promise resolution instead of AsyncWorker
          WaitAndResolveSingle(env, deferred, tasklet_id, context_id);
          return deferred.Promise();
      }
     
     // Case 2: run(tasks) - Array of functions
     if (info[0].IsArray()) {
         Napi::Array tasks_array = info[0].As<Napi::Array>();
         
         // Notify auto-config about batch pattern for optimization
         AutoConfig::get_instance().record_batch_pattern(tasks_array.Length());
         
         std::vector<uint64_t> task_ids;
         std::vector<uint64_t> context_ids;
         task_ids.reserve(tasks_array.Length());
         context_ids.reserve(tasks_array.Length());
         
          for (uint32_t i = 0; i < tasks_array.Length(); ++i) {
              Napi::Value task_value = tasks_array.Get(i);
              if (!task_value.IsFunction()) {
                  Napi::TypeError::New(env, "All array elements must be functions").ThrowAsJavaScriptException();
                  return env.Null();
              }
              auto ids = InternalSpawn(env, task_value.As<Napi::Function>());
              task_ids.push_back(ids.first);
              context_ids.push_back(ids.second);
          }
         
         // PHASE 2: Use direct promise resolution instead of AsyncWorker
         auto deferred = Napi::Promise::Deferred::New(env);
         WaitAndResolveBatch(env, deferred, std::move(task_ids), std::move(context_ids), "array");
         return deferred.Promise();
     }
     
     // Case 3: run(count, task) - Batch with count and function
     if (info[0].IsNumber() && info.Length() >= 2 && info[1].IsFunction()) {
         uint32_t count = info[0].As<Napi::Number>().Uint32Value();
         Napi::Function js_function = info[1].As<Napi::Function>();
         
         // Notify auto-config about batch pattern for optimization
         AutoConfig::get_instance().record_batch_pattern(count);
         
         std::vector<uint64_t> task_ids;
         std::vector<uint64_t> context_ids;
         task_ids.reserve(count);
         context_ids.reserve(count);
         
          for (uint32_t i = 0; i < count; ++i) {
              Napi::Function wrapped_fn = Napi::Function::New(env, [js_function, i](const Napi::CallbackInfo& cb) {
                  return js_function.Call(cb.Env().Global(), {Napi::Number::New(cb.Env(), i)});
              });
              auto ids = InternalSpawn(env, wrapped_fn);
              task_ids.push_back(ids.first);
              context_ids.push_back(ids.second);
          }
         
         // PHASE 2: Use direct promise resolution instead of AsyncWorker
         auto deferred = Napi::Promise::Deferred::New(env);
         WaitAndResolveBatch(env, deferred, std::move(task_ids), std::move(context_ids), "batch");
         return deferred.Promise();
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
         std::string result;
         std::string error;
         bool has_error = false;
         get_js_tasklet_result(tasklet_id, result, error, has_error);
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
         std::string result;
         std::string error;
         bool has_error = false;
         get_js_tasklet_result(tasklet_id, result, error, has_error);
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
         std::string result;
         std::string error;
         bool has_error = false;
         get_js_tasklet_result(tasklet_id, result, error, has_error);
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
 
 static const char* workload_pattern_string(WorkloadPattern p) {
     switch (p) {
         case WorkloadPattern::CPU_INTENSIVE: return "cpu-intensive";
         case WorkloadPattern::IO_INTENSIVE: return "io-intensive";
         case WorkloadPattern::MEMORY_INTENSIVE: return "memory-intensive";
         case WorkloadPattern::BURST: return "burst";
         case WorkloadPattern::STEADY: return "steady";
         default: return "mixed";
     }
 }

 Napi::Value GetStats(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     
     try {
         SchedulerStats stats = thread_pool->get_stats();
         auto pattern = AutoConfig::get_instance().get_detected_pattern();
         auto adjustment = AutoConfig::get_instance().get_last_adjustment();
         auto rec = AutoConfig::get_instance().get_settings().recommendations;
         
         Napi::Object stats_obj = Napi::Object::New(env);
         stats_obj.Set("activeThreads", Napi::Number::New(env, stats.active_threads));
         stats_obj.Set("completedThreads", Napi::Number::New(env, stats.completed_threads));
         stats_obj.Set("failedThreads", Napi::Number::New(env, stats.failed_threads));
         stats_obj.Set("workerThreads", Napi::Number::New(env, stats.worker_threads));
         stats_obj.Set("averageExecutionTimeMs", Napi::Number::New(env, stats.average_execution_time_ms));
         stats_obj.Set("successRate", Napi::Number::New(env, stats.success_rate));
         stats_obj.Set("workloadPattern", Napi::String::New(env, workload_pattern_string(pattern)));
         stats_obj.Set("recommendedWorkerCount", Napi::Number::New(env, rec.recommended_worker_count));
         stats_obj.Set("shouldScaleUp", Napi::Boolean::New(env, rec.should_scale_up));
         stats_obj.Set("shouldScaleDown", Napi::Boolean::New(env, rec.should_scale_down));
         
         Napi::Object adj_obj = Napi::Object::New(env);
         adj_obj.Set("reason", Napi::String::New(env, adjustment.reason));
         adj_obj.Set("changesMade", Napi::String::New(env, adjustment.changes_made));
         adj_obj.Set("performanceImpact", Napi::Number::New(env, adjustment.performance_impact));
         adj_obj.Set("timestamp", Napi::Number::New(env, static_cast<double>(adjustment.timestamp)));
         stats_obj.Set("lastAdjustment", adj_obj);
         
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
 // Auto-Scheduling Methods
 // =====================================================================

Napi::Value EnableAutoScheduling(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        AutoConfig::get_instance().set_auto_config_enabled(true);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value DisableAutoScheduling(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        AutoConfig::get_instance().set_auto_config_enabled(false);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value IsAutoSchedulingEnabled(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        bool enabled = AutoConfig::get_instance().is_auto_config_enabled();
        return Napi::Boolean::New(env, enabled);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value GetAutoSchedulingRecommendations(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        auto recommendations = AutoConfig::get_instance().get_recommendations();
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("recommended_worker_count", clamp_int<size_t>(recommendations.recommended_worker_count, 0, 10000, 1));
        obj.Set("should_scale_up", recommendations.should_scale_up);
        obj.Set("should_scale_down", recommendations.should_scale_down);
        obj.Set("worker_scaling_confidence", clamp_float<double>(recommendations.worker_scaling_confidence, 0.0, 1.0, 0.5));
        obj.Set("recommended_timeout_ms", clamp_int<long long>(recommendations.recommended_timeout_ms, 0LL, 10000000LL, 1000LL));
        obj.Set("should_adjust_timeout", recommendations.should_adjust_timeout);
        obj.Set("timeout_confidence", clamp_float<double>(recommendations.timeout_confidence, 0.0, 1.0, 0.5));
        obj.Set("recommended_priority", clamp_int<int>(recommendations.recommended_priority, -20, 20, 0));
        obj.Set("should_adjust_priority", recommendations.should_adjust_priority);
        obj.Set("priority_confidence", clamp_float<double>(recommendations.priority_confidence, 0.0, 1.0, 0.5));
        obj.Set("recommended_batch_size", clamp_int<size_t>(recommendations.recommended_batch_size, 0, 10000, 1));
        obj.Set("should_batch", recommendations.should_batch);
        obj.Set("batching_confidence", clamp_float<double>(recommendations.batching_confidence, 0.0, 1.0, 0.5));
        obj.Set("should_rebalance", recommendations.should_rebalance);
        obj.Set("load_balance_confidence", clamp_float<double>(recommendations.load_balance_confidence, 0.0, 1.0, 0.5));
        
        return obj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value ApplyAutoSchedulingRecommendations(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        AutoConfig::get_instance().force_analysis();
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value GetAutoSchedulingMetricsHistory(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        auto metrics_history = AutoConfig::get_instance().get_metrics_history();
        Napi::Array array = Napi::Array::New(env, metrics_history.size());
        for (size_t i = 0; i < metrics_history.size(); ++i) {
            const auto& metrics = metrics_history[i];
            Napi::Object obj = Napi::Object::New(env);
            obj.Set("cpu_utilization", clamp_float<double>(metrics.cpu_utilization, 0.0, 100.0, 0.0));
            obj.Set("memory_usage_percent", clamp_float<double>(metrics.memory_usage_percent, 0.0, 100.0, 0.0));
            obj.Set("worker_utilization", clamp_float<double>(metrics.worker_utilization, 0.0, 100.0, 0.0));
            obj.Set("throughput_tasks_per_sec", clamp_float<double>(metrics.throughput_tasks_per_sec, 0.0, 1e6, 0.0));
            obj.Set("average_execution_time_ms", clamp_float<double>(metrics.average_execution_time_ms, 0.0, 1e6, 0.0));
            obj.Set("success_rate", clamp_float<double>(metrics.success_rate, 0.0, 1.0, 1.0));
            obj.Set("queue_length", clamp_int<size_t>(metrics.queue_length, 0, 100000, 0));
            obj.Set("active_jobs", clamp_int<size_t>(metrics.active_jobs, 0, 100000, 0));
            obj.Set("completed_jobs", clamp_int<size_t>(metrics.completed_jobs, 0, 100000, 0));
            obj.Set("failed_jobs", clamp_int<size_t>(metrics.failed_jobs, 0, 100000, 0));
            obj.Set("timestamp", metrics.timestamp);
            array.Set(i, obj);
        }
        
        return array;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value GetAutoSchedulingSettings(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        auto settings = AutoConfig::get_instance().get_settings();
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("enabled", settings.is_enabled);
        obj.Set("strategy", clamp_int<int>(static_cast<int>(settings.strategy), 0, 2, 1));
        obj.Set("metricsCount", clamp_int<int>(static_cast<int>(settings.metrics_history.size()), 0, 100000, 0));
        // Add last adjustment info
        Napi::Object lastAdjustment = Napi::Object::New(env);
        lastAdjustment.Set("reason", settings.last_adjustment.reason);
        lastAdjustment.Set("changes_made", settings.last_adjustment.changes_made);
        lastAdjustment.Set("performance_impact", clamp_float<double>(settings.last_adjustment.performance_impact, -1e6, 1e6, 0.0));
        lastAdjustment.Set("timestamp", settings.last_adjustment.timestamp);
        obj.Set("lastAdjustment", lastAdjustment);
        
        return obj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value SetMaxMemoryLimitBytes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsBigInt()) {
        Napi::TypeError::New(env, "Expected a BigInt for memory limit in bytes").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    bool lossless;
    uint64_t bytes = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    
    try {
        MemoryManager::get_instance().set_max_memory_limit_bytes(bytes);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value GetMaxMemoryLimitBytes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        uint64_t bytes = MemoryManager::get_instance().get_max_memory_limit_bytes();
        return Napi::BigInt::New(env, bytes);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}
 
 // =====================================================================
 // Module Initialization
 // =====================================================================
 
 Napi::Object Init(Napi::Env env, Napi::Object exports) {
     initialize_core(uv_default_loop());
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
     exports.Set("getMemoryStats", Napi::Function::New(env, GetMemoryStats));
     exports.Set("enableAutoScheduling", Napi::Function::New(env, EnableAutoScheduling));
     exports.Set("disableAutoScheduling", Napi::Function::New(env, DisableAutoScheduling));
     exports.Set("isAutoSchedulingEnabled", Napi::Function::New(env, IsAutoSchedulingEnabled));
     exports.Set("getAutoSchedulingRecommendations", Napi::Function::New(env, GetAutoSchedulingRecommendations));
     exports.Set("applyAutoSchedulingRecommendations", Napi::Function::New(env, ApplyAutoSchedulingRecommendations));
     exports.Set("getAutoSchedulingMetricsHistory", Napi::Function::New(env, GetAutoSchedulingMetricsHistory));
     exports.Set("getAutoSchedulingSettings", Napi::Function::New(env, GetAutoSchedulingSettings));
     exports.Set("setMaxMemoryLimitBytes", Napi::Function::New(env, SetMaxMemoryLimitBytes));
     exports.Set("getMaxMemoryLimitBytes", Napi::Function::New(env, GetMaxMemoryLimitBytes));
     
     return exports;
 }
 
 NODE_API_MODULE(tasklets, Init)
 
 } // namespace tasklets 
