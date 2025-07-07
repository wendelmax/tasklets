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
 * @file napi_wrapper.cpp
 * @brief N-API wrapper utilities implementation
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "napi_wrapper.hpp"
#include "../tasklets.hpp"
#include "../core/native_thread_pool.hpp"
#include "../core/logger.hpp"
#include <iostream>
#include <sstream>

namespace tasklets {
namespace napi_wrapper {

// =====================================================================
// Tasklet Management
// =====================================================================

Napi::Value spawn_tasklet(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Validate arguments
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected at least 1 argument").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (!validate_function(env, info[0], "tasklet function")) {
            return env.Null();
        }
        
        // Get the JavaScript function
        Napi::Function js_function = info[0].As<Napi::Function>();
        
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Spawn the tasklet
        uint64_t tasklet_id = thread_pool.spawn_js(js_function, env);
        
        return Napi::Number::New(env, static_cast<double>(tasklet_id));
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value join_tasklet(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Validate arguments
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected tasklet ID").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (!validate_number(env, info[0], "tasklet ID")) {
            return env.Null();
        }
        
        // Get tasklet ID
        uint64_t tasklet_id = static_cast<uint64_t>(info[0].As<Napi::Number>().DoubleValue());
        
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Join the tasklet
        thread_pool.join(tasklet_id);
        
        return env.Undefined();
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value join_all_tasklets(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Join all tasklets
        thread_pool.join_all();
        
        return env.Undefined();
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// =====================================================================
// Result and Error Handling
// =====================================================================

Napi::Value get_tasklet_result(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Validate arguments
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected tasklet ID").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (!validate_number(env, info[0], "tasklet ID")) {
            return env.Null();
        }
        
        // Get tasklet ID
        uint64_t tasklet_id = static_cast<uint64_t>(info[0].As<Napi::Number>().DoubleValue());
        
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Get result
        std::string result = thread_pool.get_result(tasklet_id);
        
        return Napi::String::New(env, result);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value has_tasklet_error(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Validate arguments
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected tasklet ID").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (!validate_number(env, info[0], "tasklet ID")) {
            return env.Null();
        }
        
        // Get tasklet ID
        uint64_t tasklet_id = static_cast<uint64_t>(info[0].As<Napi::Number>().DoubleValue());
        
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Check for error
        bool has_error = thread_pool.has_error(tasklet_id);
        
        return Napi::Boolean::New(env, has_error);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value get_tasklet_error(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Validate arguments
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected tasklet ID").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (!validate_number(env, info[0], "tasklet ID")) {
            return env.Null();
        }
        
        // Get tasklet ID
        uint64_t tasklet_id = static_cast<uint64_t>(info[0].As<Napi::Number>().DoubleValue());
        
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Get error
        std::string error = thread_pool.get_error(tasklet_id);
        
        return Napi::String::New(env, error);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// =====================================================================
// Statistics and Monitoring
// =====================================================================

Napi::Value get_stats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Get statistics
        auto stats = thread_pool.get_stats();
        
        // Convert to JavaScript object
        return stats_to_js_object(env, stats);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// =====================================================================
// Configuration
// =====================================================================

Napi::Value set_worker_thread_count(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Validate arguments
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected thread count").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (!validate_number(env, info[0], "thread count")) {
            return env.Null();
        }
        
        // Get thread count
        size_t thread_count = static_cast<size_t>(info[0].As<Napi::Number>().DoubleValue());
        
        // Validate thread count using dynamic limits
        const size_t max_threads = config::get_max_worker_threads();
        if (thread_count == 0 || thread_count > max_threads) {
            std::string message = "Thread count must be between 1 and " + std::to_string(max_threads);
            Napi::RangeError::New(env, message).ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Set thread count
        thread_pool.set_worker_thread_count(thread_count);
        
        return env.Undefined();
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value get_worker_thread_count(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Get thread pool instance
        auto& thread_pool = get_thread_pool_instance(env);
        
        // Get thread count
        size_t thread_count = thread_pool.get_worker_thread_count();
        
        return Napi::Number::New(env, static_cast<double>(thread_count));
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// =====================================================================
// Logging Configuration
// =====================================================================

Napi::Value set_log_level(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Validate arguments
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected log level").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        if (!validate_number(env, info[0], "log level")) {
            return env.Null();
        }
        
        // Get log level
        int level = static_cast<int>(info[0].As<Napi::Number>().Int32Value());
        
        // Validate log level
        if (level < 0 || level > 5) {
            Napi::RangeError::New(env, "Log level must be between 0 (OFF) and 5 (TRACE)").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Set log level
        tasklets::Logger::set_level(static_cast<tasklets::LogLevel>(level));
        
        return env.Undefined();
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value get_log_level(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Get log level
        int level = static_cast<int>(tasklets::Logger::get_level());
        
        return Napi::Number::New(env, level);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// =====================================================================
// Utility Functions
// =====================================================================

bool validate_function(Napi::Env env, const Napi::Value& value, const char* arg_name) {
    if (!value.IsFunction()) {
        std::string message = std::string("Expected ") + arg_name + " to be a function";
        Napi::TypeError::New(env, message).ThrowAsJavaScriptException();
        return false;
    }
    return true;
}

bool validate_number(Napi::Env env, const Napi::Value& value, const char* arg_name) {
    if (!value.IsNumber()) {
        std::string message = std::string("Expected ") + arg_name + " to be a number";
        Napi::TypeError::New(env, message).ThrowAsJavaScriptException();
        return false;
    }
    return true;
}

Napi::Object stats_to_js_object(Napi::Env env, const SchedulerStats& stats) {
    Napi::Object obj = Napi::Object::New(env);
    
    // Basic counts
    obj.Set("activeTasklets", Napi::Number::New(env, static_cast<double>(stats.active_threads)));
    obj.Set("totalTaskletsCreated", Napi::Number::New(env, static_cast<double>(stats.total_threads_created)));
    obj.Set("completedTasklets", Napi::Number::New(env, static_cast<double>(stats.completed_threads)));
    obj.Set("failedTasklets", Napi::Number::New(env, static_cast<double>(stats.failed_threads)));
    
    // Worker thread info
    obj.Set("workerThreads", Napi::Number::New(env, static_cast<double>(stats.worker_threads)));
    
    // Performance metrics
    obj.Set("totalExecutionTimeMs", Napi::Number::New(env, static_cast<double>(stats.total_execution_time_ms)));
    obj.Set("averageExecutionTimeMs", Napi::Number::New(env, stats.average_execution_time_ms));
    obj.Set("successRate", Napi::Number::New(env, stats.success_rate));
    
    // Worker utilization array
    Napi::Array utilization = Napi::Array::New(env, stats.worker_utilization.size());
    for (size_t i = 0; i < stats.worker_utilization.size(); ++i) {
        utilization.Set(i, Napi::Number::New(env, static_cast<double>(stats.worker_utilization[i])));
    }
    obj.Set("workerUtilization", utilization);
    
    return obj;
}

NativeThreadPool& get_thread_pool_instance(Napi::Env env) {
    try {
        return NativeThreadPool::get_instance();
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to get thread pool instance: ") + e.what()).ThrowAsJavaScriptException();
        // This will never be reached, but needed for return type
        static NativeThreadPool* dummy = nullptr;
        return *dummy;
    }
}

} // namespace napi_wrapper
} // namespace tasklets 