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
 * @file tasklets.hpp
 * @brief Tasklets API Node.js N-API bindings
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#ifndef TASKLETS_HPP
#define TASKLETS_HPP

#include <napi.h>

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
    
    JSContext(Napi::Env env, Napi::Function js_function);
};

/**
 * @brief Helper to create a JavaScript object with consistent structure
 */
Napi::Object CreateResultObject(Napi::Env env, bool success, const std::string& data = "", const std::string& error = "");

/**
 * @brief Helper to create a batch result object
 */
Napi::Object CreateBatchResultObject(Napi::Env env, const std::vector<uint64_t>& task_ids, 
                                   const std::vector<std::string>& results, 
                                   const std::vector<std::string>& errors);



/**
 * @brief Executes a JavaScript function in the thread pool
 */
uint64_t execute_js_function(Napi::Function js_function, Napi::Env env);

// =====================================================================
// Core API Functions
// =====================================================================

Napi::Value Spawn(const Napi::CallbackInfo& info);
Napi::Value Run(const Napi::CallbackInfo& info);
Napi::Value Join(const Napi::CallbackInfo& info);
Napi::Value GetResult(const Napi::CallbackInfo& info);
Napi::Value HasError(const Napi::CallbackInfo& info);
Napi::Value GetError(const Napi::CallbackInfo& info);
Napi::Value IsFinished(const Napi::CallbackInfo& info);
Napi::Value GetStats(const Napi::CallbackInfo& info);
Napi::Value GetAutoConfigSettings(const Napi::CallbackInfo& info);

// =====================================================================
// User-Friendly Promise-Based APIs
// =====================================================================

Napi::Value GetSystemInfo(const Napi::CallbackInfo& info);

// =====================================================================
// Advanced Configuration and Monitoring APIs
// =====================================================================

Napi::Value GetAutoConfigRecommendations(const Napi::CallbackInfo& info);
Napi::Value GetAutoSchedulerRecommendations(const Napi::CallbackInfo& info);
Napi::Value ForceOptimization(const Napi::CallbackInfo& info);
Napi::Value GetPerformanceMetrics(const Napi::CallbackInfo& info);
Napi::Value GetWorkloadPattern(const Napi::CallbackInfo& info);
Napi::Value GetMultiprocessorStats(const Napi::CallbackInfo& info);

// =====================================================================
// Batch Processing Methods
// =====================================================================

Napi::Value Batch(const Napi::CallbackInfo& info);
Napi::Value JoinBatch(const Napi::CallbackInfo& info);
Napi::Value BatchFinished(const Napi::CallbackInfo& info);
Napi::Value BatchHasError(const Napi::CallbackInfo& info);
Napi::Value GetBatchResults(const Napi::CallbackInfo& info);
Napi::Value GetBatchErrors(const Napi::CallbackInfo& info);

// =====================================================================
// System Monitoring Methods
// =====================================================================

Napi::Value GetSystemStatus(const Napi::CallbackInfo& info);
Napi::Value GetMemoryStats(const Napi::CallbackInfo& info);
Napi::Value SetMaxMemoryLimitBytes(const Napi::CallbackInfo& info);
Napi::Value GetMaxMemoryLimitBytes(const Napi::CallbackInfo& info);

// =====================================================================
// Auto-Configuration Methods
// =====================================================================

Napi::Value SetAutoConfigEnabled(const Napi::CallbackInfo& info);
Napi::Value IsAutoConfigEnabled(const Napi::CallbackInfo& info);
Napi::Value ForceAutoConfigAnalysis(const Napi::CallbackInfo& info);
Napi::Value GetAutoConfigMetrics(const Napi::CallbackInfo& info);
Napi::Value GetAutoConfigLastAdjustment(const Napi::CallbackInfo& info);

// =====================================================================
// Auto-Scheduler Methods
// =====================================================================

Napi::Value GetAutoSchedulingMetricsHistory(const Napi::CallbackInfo& info);

// =====================================================================
// Module Initialization
// =====================================================================

Napi::Object Init(Napi::Env env, Napi::Object exports);

} // namespace tasklets

#endif 