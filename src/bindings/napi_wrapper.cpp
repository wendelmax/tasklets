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
#include <napi.h>
#include <iostream>
#include <memory>
#include <string>
#include <functional>
#include <thread>
#include <chrono>
#include <sched.h>
#include <pthread.h>

Napi::FunctionReference TaskletsWrapper::constructor;

Napi::Object TaskletsWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "TaskletsWrapper", {
        InstanceMethod("spawnJs", &TaskletsWrapper::SpawnJs),
        InstanceMethod("configure", &TaskletsWrapper::Configure),
        InstanceMethod("getStats", &TaskletsWrapper::GetStats),
        InstanceMethod("getResult", &TaskletsWrapper::GetResult),
        InstanceMethod("hasError", &TaskletsWrapper::HasError),
        InstanceMethod("getError", &TaskletsWrapper::GetError),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("TaskletsWrapper", func);
    return exports;
}

TaskletsWrapper::TaskletsWrapper(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<TaskletsWrapper>(info) {
    // Use singleton instance for memory manager
    std::shared_ptr<tasklets::IMemoryManager> memory_manager(&tasklets::MemoryManager::get_instance(), [](tasklets::IMemoryManager*){});
    thread_pool = std::make_unique<tasklets::NativeThreadPool>(memory_manager);
}

TaskletsWrapper::~TaskletsWrapper() = default;

Napi::Value TaskletsWrapper::Configure(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Configuration object expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    Napi::Object config = info[0].As<Napi::Object>();
    
    if (config.Has("maxTasklets")) {
        // Note: MemoryManager doesn't have set_max_tasklets anymore
        // This would need to be implemented if needed
        (void)config.Get("maxTasklets").As<Napi::Number>().Uint32Value();
    }
    
    if (config.Has("logLevel")) {
        std::string log_level = config.Get("logLevel").As<Napi::String>().Utf8Value();
        // Note: Logger is not available in this context
        // This would need to be implemented if needed
        (void)log_level;
    }

    if (config.Has("memoryLimit")) {
        double memory_limit = config.Get("memoryLimit").As<Napi::Number>().DoubleValue();
        auto& memory_manager = tasklets::MemoryManager::get_instance();
        memory_manager.set_memory_limit_percent(memory_limit);
    }

    return env.Undefined();
}

Napi::Value TaskletsWrapper::SpawnJs(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Function expected as first argument").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    Napi::Function js_function = info[0].As<Napi::Function>();
    
    // Check memory usage through MemoryManager
    auto& memory_manager = tasklets::MemoryManager::get_instance();
    if (!memory_manager.is_memory_usage_acceptable()) {
        Napi::Error::New(env, "System memory usage is above the configured limit, cannot spawn new tasklet").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        auto job_id = thread_pool->spawn_js(js_function, env);
        return Napi::String::New(env, std::to_string(job_id));
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to spawn tasklet: ") + e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value TaskletsWrapper::GetStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    Napi::Object stats = Napi::Object::New(env);
    
    // Get memory statistics from MemoryManager
    auto& memory_manager = tasklets::MemoryManager::get_instance();
    auto memory_stats = memory_manager.get_system_memory_stats();
    
    stats.Set("freeMemoryBytes", Napi::Number::New(env, memory_stats.system_free_memory_bytes));
    stats.Set("totalMemoryBytes", Napi::Number::New(env, memory_stats.system_total_memory_bytes));
    stats.Set("usedMemoryBytes", Napi::Number::New(env, memory_stats.system_used_memory_bytes));
    stats.Set("memoryUsagePercent", Napi::Number::New(env, memory_stats.system_memory_usage_percent));
    
    // Also provide KB values for backward compatibility
    stats.Set("freeMemoryKB", Napi::Number::New(env, memory_stats.system_free_memory_bytes / 1024));
    stats.Set("totalMemoryKB", Napi::Number::New(env, memory_stats.system_total_memory_bytes / 1024));
    stats.Set("usedMemoryKB", Napi::Number::New(env, memory_stats.system_used_memory_bytes / 1024));
    
    auto scheduler_stats = thread_pool->get_stats();
    stats.Set("activeJobs", Napi::Number::New(env, scheduler_stats.active_threads));
    stats.Set("completedJobs", Napi::Number::New(env, scheduler_stats.completed_threads));
    
    return stats;
}

Napi::Value TaskletsWrapper::GetResult(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Job ID string expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string job_id_str = info[0].As<Napi::String>().Utf8Value();
    uint64_t job_id = std::stoull(job_id_str);
    
    try {
        std::string result = thread_pool->get_result(job_id);
        return Napi::String::New(env, result);
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to get result: ") + e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value TaskletsWrapper::HasError(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Job ID string expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string job_id_str = info[0].As<Napi::String>().Utf8Value();
    uint64_t job_id = std::stoull(job_id_str);
    
    try {
        bool has_error = thread_pool->has_error(job_id);
        return Napi::Boolean::New(env, has_error);
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to check error status: ") + e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value TaskletsWrapper::GetError(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Job ID string expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string job_id_str = info[0].As<Napi::String>().Utf8Value();
    uint64_t job_id = std::stoull(job_id_str);
    
    try {
        std::string error = thread_pool->get_error(job_id);
        return Napi::String::New(env, error);
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to get error: ") + e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
} 