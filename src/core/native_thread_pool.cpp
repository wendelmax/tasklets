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
 * @file native_thread_pool.cpp
 * @brief Native thread pool implementation
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "native_thread_pool.hpp"
#include "logger.hpp"
#include <iostream>
#include <chrono>
#include <sstream>
#include <thread>

namespace tasklets {

// =====================================================================
// Helper Functions
// =====================================================================

/// Get maximum worker threads based on system capabilities
inline size_t get_max_worker_threads() {
    const auto hardware_threads = std::thread::hardware_concurrency();
    return hardware_threads > 0 ? std::min(static_cast<size_t>(hardware_threads * 4), static_cast<size_t>(512)) : 128;
}

// =====================================================================
// NativeThreadPool Implementation
// =====================================================================

std::unique_ptr<NativeThreadPool> NativeThreadPool::instance_;
std::mutex NativeThreadPool::instance_mutex_;

NativeThreadPool::NativeThreadPool()
    : worker_thread_count_([]() { 
        const auto hardware_threads = std::thread::hardware_concurrency();
        return hardware_threads > 0 ? hardware_threads : 4;
      }()), // Auto-detect based on CPU cores
      stats_collector_(std::make_unique<StatsCollector>()),
      next_id_(1) {
    
    // Set thread pool size with adaptive buffer
    const auto max_threads = get_max_worker_threads();
    const auto buffer_size = (max_threads >= 1000) ? 8 : (max_threads >= 100) ? 6 : (max_threads >= 10) ? 4 : 3;
    std::vector<char> thread_count_str(buffer_size);
    snprintf(thread_count_str.data(), buffer_size, "%zu", worker_thread_count_);
    uv_os_setenv("UV_THREADPOOL_SIZE", thread_count_str.data());
    
    // Configure stats collector
    stats_collector_->set_worker_thread_count(worker_thread_count_);
    
    Logger::info("NativeThreadPool", "Initialized with " + std::to_string(worker_thread_count_) + " worker threads");
}

NativeThreadPool::~NativeThreadPool() {
    join_all();
}

NativeThreadPool& NativeThreadPool::get_instance() {
    std::lock_guard<std::mutex> lock(instance_mutex_);
    if (!instance_) {
        instance_ = std::make_unique<NativeThreadPool>();
    }
    return *instance_;
}

uint64_t NativeThreadPool::next_tasklet_id() {
    return next_id_.fetch_add(1);
}

// =====================================================================
// Tasklet Management
// =====================================================================

uint64_t NativeThreadPool::spawn(std::function<void()> task) {
    auto tasklet_id = next_tasklet_id();
    auto tasklet = std::make_shared<Tasklet>(tasklet_id, task);
    
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        tasklets_[tasklet_id] = tasklet;
    }
    
    // Create micro job
    auto job = new MicroJob();
    job->tasklet_id = tasklet_id;
    job->thread_pool = this;
    job->task = [tasklet, task]() {
        try {
            tasklet->mark_running();
            task();
            tasklet->mark_finished();
        } catch (const std::exception& e) {
            tasklet->set_error(e.what());
            tasklet->mark_finished();
        } catch (...) {
            tasklet->set_error("Unknown error occurred");
            tasklet->mark_finished();
        }
    };
    
    // Queue work to thread pool
    int result = uv_queue_work(uv_default_loop(), &job->work, work_callback, after_work_callback);
    if (result != 0) {
        delete job;
        Logger::error("NativeThreadPool", "Failed to queue work to thread pool");
        throw std::runtime_error("Failed to queue work to thread pool");
    }
    
    // Update statistics
    stats_collector_->record_thread_created();
    
    Logger::debug("NativeThreadPool", "Spawned Tasklet[#" + std::to_string(tasklet_id) + "] on MicroJob");
    
    return tasklet_id;
}

uint64_t NativeThreadPool::spawn_js(Napi::Function js_function, Napi::Env env) {
    // Create a shared pointer to store the result
    auto result_holder = std::make_shared<std::string>();
    auto error_holder = std::make_shared<std::string>();
    auto has_error_holder = std::make_shared<bool>(false);
    auto completed_holder = std::make_shared<bool>(false);
    auto completion_mutex = std::make_shared<std::mutex>();
    auto completion_cv = std::make_shared<std::condition_variable>();
    
    Logger::debug("NativeThreadPool", "Creating ThreadSafeFunction for JS task");
    
    // Create a ThreadSafeFunction for calling JS from worker thread
    auto tsfn = Napi::ThreadSafeFunction::New(
        env,
        js_function,
        "Tasklet",
        0, // max queue size (unlimited)
        1  // initial thread count
    );
    
    auto task = [tsfn, result_holder, error_holder, has_error_holder, completed_holder, completion_mutex, completion_cv]() {
        Logger::debug("NativeThreadPool", "Starting JS task execution");
        
        // Call JavaScript function from worker thread and capture result
        auto status = tsfn.BlockingCall([result_holder, error_holder, has_error_holder, completed_holder, completion_mutex, completion_cv](Napi::Env env, Napi::Function jsCallback) {
            Logger::debug("NativeThreadPool", "Inside ThreadSafeFunction callback - about to call JS function");
            
            try {
                Napi::Value result = jsCallback.Call({});
                
                Logger::debug("NativeThreadPool", "JS function returned successfully - processing result type");
                
                // Convert the result to string based on its type
                if (result.IsUndefined() || result.IsNull()) {
                    *result_holder = "";
                    Logger::debug("NativeThreadPool", "Result is null/undefined - set empty string");
                } else if (result.IsString()) {
                    *result_holder = result.As<Napi::String>().Utf8Value();
                    Logger::debug("NativeThreadPool", "Result is string: " + *result_holder);
                } else if (result.IsNumber()) {
                    double num = result.As<Napi::Number>().DoubleValue();
                    *result_holder = std::to_string(num);
                    Logger::debug("NativeThreadPool", "Result is number: " + *result_holder);
                } else if (result.IsBoolean()) {
                    bool val = result.As<Napi::Boolean>().Value();
                    *result_holder = val ? "true" : "false";
                    Logger::debug("NativeThreadPool", "Result is boolean: " + *result_holder);
                } else if (result.IsObject()) {
                    // Try to stringify objects
                    Napi::Object global = env.Global();
                    Napi::Object json = global.Get("JSON").As<Napi::Object>();
                    Napi::Function stringify = json.Get("stringify").As<Napi::Function>();
                    Napi::Value stringified = stringify.Call(json, { result });
                    *result_holder = stringified.As<Napi::String>().Utf8Value();
                    Logger::debug("NativeThreadPool", "Result is object: " + *result_holder);
                } else {
                    // Fallback: convert to string
                    Napi::Value str_result = result.ToString();
                    *result_holder = str_result.As<Napi::String>().Utf8Value();
                    Logger::debug("NativeThreadPool", "Result fallback to string: " + *result_holder);
                }
                
                *has_error_holder = false;
                Logger::debug("NativeThreadPool", "Final result stored in holder: " + *result_holder);
                
            } catch (const Napi::Error& e) {
                *error_holder = e.Message();
                *has_error_holder = true;
                Logger::error("NativeThreadPool", std::string("JS function error: ") + e.Message());
            } catch (const std::exception& e) {
                *error_holder = e.what();
                *has_error_holder = true;
                Logger::error("NativeThreadPool", std::string("JS function error: ") + e.what());
            }
            
            // Signal that the JS function has completed
            {
                std::lock_guard<std::mutex> lock(*completion_mutex);
                *completed_holder = true;
            }
            completion_cv->notify_one();
        });
        
        Logger::debug("NativeThreadPool", "ThreadSafeFunction BlockingCall completed with status: " + std::to_string(status));
        
        if (status != napi_ok) {
            *error_holder = "Failed to call JS function from worker thread";
            *has_error_holder = true;
            Logger::error("NativeThreadPool", "Failed to call JS function from worker thread");
            
            // Signal completion even on error
            {
                std::lock_guard<std::mutex> lock(*completion_mutex);
                *completed_holder = true;
            }
            completion_cv->notify_one();
        } else {
            // Wait for the JavaScript function to actually complete
            std::unique_lock<std::mutex> lock(*completion_mutex);
            completion_cv->wait(lock, [&]() { return *completed_holder; });
            Logger::debug("NativeThreadPool", "JS function execution confirmed complete - proceeding");
        }
        
        Logger::debug("NativeThreadPool", "Before tsfn.Release() - result_holder contains: " + *result_holder);
        tsfn.Release();
        Logger::debug("NativeThreadPool", "After tsfn.Release() - task lambda completed");
    };
    
    // Create the microjob with a custom work callback that uses the captured result
    auto tasklet_id = next_tasklet_id();
    auto tasklet = std::make_shared<Tasklet>(tasklet_id, task);
    
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        tasklets_[tasklet_id] = tasklet;
    }
    
    stats_collector_->record_thread_created();
    Logger::debug("NativeThreadPool", "Spawned Tasklet #" + std::to_string(tasklet_id));
    
    auto job = new MicroJob();
    job->tasklet_id = tasklet_id;
    job->thread_pool = this;
    job->task = [task, result_holder, error_holder, has_error_holder, job]() {
        Logger::debug("NativeThreadPool", "Starting MicroJob task execution");
        
        // Execute the JavaScript task (this will block until JS function completes)
        task();
        
        Logger::debug("NativeThreadPool", "JS task completed - checking results");
        Logger::debug("NativeThreadPool", "result_holder contains: " + *result_holder);
        Logger::debug("NativeThreadPool", "has_error_holder: " + std::string(*has_error_holder ? "true" : "false"));
        
        // Now the result/error should be properly set in the shared pointers
        if (*has_error_holder) {
            job->set_error(*error_holder);
            Logger::debug("NativeThreadPool", "Set job error: " + *error_holder);
        } else {
            job->set_result(*result_holder);
            Logger::debug("NativeThreadPool", "Set job result: " + *result_holder);
        }
    };
    
    int status = uv_queue_work(uv_default_loop(), &job->work, work_callback, after_work_callback);
    if (status != 0) {
        delete job;
        throw std::runtime_error("Failed to queue work to thread pool");
    }
    
    return tasklet_id;
}

// =====================================================================
// Thread Pool Callbacks
// =====================================================================

void NativeThreadPool::work_callback(uv_work_t* req) {
    // This runs in the thread pool (worker thread)
    auto job = static_cast<MicroJob*>(req->data);
    
    auto start_time = std::chrono::high_resolution_clock::now();
    auto start_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        start_time.time_since_epoch()).count();
    
    Logger::trace("MicroJob", "Tasklet[#" + std::to_string(job->tasklet_id) + "] started - Time: " + std::to_string(start_ms));
    
    try {
        // Execute the task (which now properly sets the result)
        job->task();
        // Note: result is now set within the task function, not here
    } catch (const std::exception& e) {
        job->set_error(e.what());
    } catch (...) {
        job->set_error("Unknown error occurred in worker thread");
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    auto end_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        end_time.time_since_epoch()).count();
    auto duration = end_ms - start_ms;
    
    Logger::trace("MicroJob", "Tasklet[#" + std::to_string(job->tasklet_id) + "] finished - Time: " + std::to_string(end_ms) + ", Duration: " + std::to_string(duration) + "ms");
}

void NativeThreadPool::after_work_callback(uv_work_t* req, int status) {
    // This runs back on the main thread (event loop)
    auto job = static_cast<MicroJob*>(req->data);
    auto thread_pool = job->thread_pool;
    
    if (status == 0) {
        thread_pool->on_work_complete(job);
    } else {
        thread_pool->on_work_error(job);
    }
    
    delete job;
}

void NativeThreadPool::on_work_complete(MicroJob* job) {
    auto tasklet = find_tasklet(job->tasklet_id);
    if (tasklet) {
        if (job->has_error) {
            tasklet->set_error(job->error);
            stats_collector_->record_thread_failed();
        } else {
            tasklet->set_result(job->result);
            stats_collector_->record_thread_completed(0); // TODO: track actual execution time
        }
        tasklet->mark_finished();
    }
    
    Logger::debug("Tasklet", "#" + std::to_string(job->tasklet_id) + " completed successfully");
}

void NativeThreadPool::on_work_error(MicroJob* job) {
    auto tasklet = find_tasklet(job->tasklet_id);
    if (tasklet) {
        tasklet->set_error("MicroJob error");
        tasklet->mark_finished();
        stats_collector_->record_thread_failed();
    }
    
    Logger::debug("Tasklet", "#" + std::to_string(job->tasklet_id) + " failed with error");
}

// =====================================================================
// Synchronization
// =====================================================================

void NativeThreadPool::join(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    if (!tasklet) {
        throw std::runtime_error("Tasklet not found: " + std::to_string(tasklet_id));
    }
    
    // Poll until tasklet is finished with adaptive interval
    const auto hardware_threads = std::thread::hardware_concurrency();
    const auto poll_interval = (hardware_threads >= 16) ? 1 : (hardware_threads >= 8) ? 2 : (hardware_threads >= 4) ? 3 : 5;
    while (!tasklet->is_finished()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(poll_interval));
        
        // Process pending events
        uv_run(uv_default_loop(), UV_RUN_NOWAIT);
    }
}

void NativeThreadPool::join_all() {
    std::vector<uint64_t> tasklet_ids;
    
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        for (const auto& pair : tasklets_) {
            tasklet_ids.push_back(pair.first);
        }
    }
    
    for (uint64_t tasklet_id : tasklet_ids) {
        try {
            join(tasklet_id);
        } catch (const std::exception& e) {
            Logger::error("NativeThreadPool", "Error joining tasklet " + std::to_string(tasklet_id) + ": " + e.what());
        }
    }
    
    cleanup_finished_tasklets();
}

// =====================================================================
// Result and Error Handling
// =====================================================================

std::string NativeThreadPool::get_result(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    if (!tasklet) {
        throw std::runtime_error("Tasklet not found: " + std::to_string(tasklet_id));
    }
    return tasklet->get_result();
}

bool NativeThreadPool::has_error(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    if (!tasklet) {
        throw std::runtime_error("Tasklet not found: " + std::to_string(tasklet_id));
    }
    return tasklet->has_error();
}

std::string NativeThreadPool::get_error(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    if (!tasklet) {
        throw std::runtime_error("Tasklet not found: " + std::to_string(tasklet_id));
    }
    return tasklet->get_error();
}

bool NativeThreadPool::is_finished(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    if (!tasklet) {
        throw std::runtime_error("Tasklet not found: " + std::to_string(tasklet_id));
    }
    return tasklet->is_finished();
}

// =====================================================================
// Statistics and Monitoring
// =====================================================================

SchedulerStats NativeThreadPool::get_stats() const {
    // Update active tasklet count
    size_t active_count = 0;
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        for (const auto& pair : tasklets_) {
            if (!pair.second->is_finished()) {
                active_count++;
            }
        }
    }
    
    stats_collector_->update_active_threads(active_count);
    return stats_collector_->get_stats();
}

// =====================================================================
// Configuration
// =====================================================================

void NativeThreadPool::set_worker_thread_count(size_t count) {
    worker_thread_count_ = count;
    stats_collector_->set_worker_thread_count(count);
    
    // Set thread pool size with adaptive buffer
    const auto max_threads = get_max_worker_threads();
    const auto buffer_size = (max_threads >= 1000) ? 8 : (max_threads >= 100) ? 6 : (max_threads >= 10) ? 4 : 3;
    std::vector<char> thread_count_str(buffer_size);
    snprintf(thread_count_str.data(), buffer_size, "%zu", count);
    uv_os_setenv("UV_THREADPOOL_SIZE", thread_count_str.data());
    
    Logger::info("NativeThreadPool", "Worker thread count set to " + std::to_string(count));
}

// =====================================================================
// Internal Tasklet Management
// =====================================================================

std::shared_ptr<Tasklet> NativeThreadPool::find_tasklet(uint64_t id) {
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    auto it = tasklets_.find(id);
    return (it != tasklets_.end()) ? it->second : nullptr;
}

void NativeThreadPool::cleanup_finished_tasklets() {
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    auto it = tasklets_.begin();
    while (it != tasklets_.end()) {
        if (it->second->is_finished()) {
            it = tasklets_.erase(it);
        } else {
            ++it;
        }
    }
}

} // namespace tasklets 