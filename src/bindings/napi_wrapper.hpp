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
 * @file napi_wrapper.hpp
 * @brief N-API wrapper utilities for Node.js integration
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <napi.h>
#include <memory>
#include <string>
#include "../core/stats.hpp"

namespace tasklets {

// Forward declarations
class NativeThreadPool;

/**
 * @brief N-API wrapper functions for the Tasklets library
 * 
 * This module provides clean N-API wrapper functions that handle
 * JavaScript-to-C++ conversions, error handling, and validation.
 */
namespace napi_wrapper {

// =====================================================================
// Tasklet Management
// =====================================================================

/**
 * @brief Spawns a new tasklet with a JavaScript function
 * @param info N-API callback info containing the JS function
 * @return N-API value containing the tasklet ID
 */
Napi::Value spawn_tasklet(const Napi::CallbackInfo& info);

/**
 * @brief Waits for a specific tasklet to complete
 * @param info N-API callback info containing the tasklet ID
 * @return N-API value (undefined)
 */
Napi::Value join_tasklet(const Napi::CallbackInfo& info);

/**
 * @brief Waits for all tasklets to complete
 * @param info N-API callback info (no parameters)
 * @return N-API value (undefined)
 */
Napi::Value join_all_tasklets(const Napi::CallbackInfo& info);

// =====================================================================
// Result and Error Handling
// =====================================================================

/**
 * @brief Gets the result of a completed tasklet
 * @param info N-API callback info containing the tasklet ID
 * @return N-API value containing the result string
 */
Napi::Value get_tasklet_result(const Napi::CallbackInfo& info);

/**
 * @brief Checks if a tasklet has an error
 * @param info N-API callback info containing the tasklet ID
 * @return N-API value containing a boolean
 */
Napi::Value has_tasklet_error(const Napi::CallbackInfo& info);

/**
 * @brief Gets the error message of a failed tasklet
 * @param info N-API callback info containing the tasklet ID
 * @return N-API value containing the error message
 */
Napi::Value get_tasklet_error(const Napi::CallbackInfo& info);

// =====================================================================
// Statistics and Monitoring
// =====================================================================

/**
 * @brief Gets comprehensive statistics about the thread pool
 * @param info N-API callback info (no parameters)
 * @return N-API value containing a statistics object
 */
Napi::Value get_stats(const Napi::CallbackInfo& info);

// =====================================================================
// Configuration
// =====================================================================

/**
 * @brief Sets the number of worker threads
 * @param info N-API callback info containing the thread count
 * @return N-API value (undefined)
 */
Napi::Value set_worker_thread_count(const Napi::CallbackInfo& info);

/**
 * @brief Gets the current number of worker threads
 * @param info N-API callback info (no parameters)
 * @return N-API value containing the thread count
 */
Napi::Value get_worker_thread_count(const Napi::CallbackInfo& info);

// =====================================================================
// Logging Configuration
// =====================================================================

/**
 * @brief Sets the log level for the tasklets library
 * @param info N-API callback info containing the log level (0-5)
 * @return N-API value (undefined)
 */
Napi::Value set_log_level(const Napi::CallbackInfo& info);

/**
 * @brief Gets the current log level
 * @param info N-API callback info (no parameters)
 * @return N-API value containing the log level
 */
Napi::Value get_log_level(const Napi::CallbackInfo& info);

// =====================================================================
// Utility Functions
// =====================================================================

/**
 * @brief Validates that a value is a function
 * @param env N-API environment
 * @param value The value to validate
 * @param arg_name The name of the argument for error messages
 * @return true if valid, false otherwise (throws exception)
 */
bool validate_function(Napi::Env env, const Napi::Value& value, const char* arg_name);

/**
 * @brief Validates that a value is a number
 * @param env N-API environment
 * @param value The value to validate
 * @param arg_name The name of the argument for error messages
 * @return true if valid, false otherwise (throws exception)
 */
bool validate_number(Napi::Env env, const Napi::Value& value, const char* arg_name);

/**
 * @brief Converts a SchedulerStats structure to a JavaScript object
 * @param env N-API environment
 * @param stats The statistics structure to convert
 * @return N-API object containing the statistics
 */
Napi::Object stats_to_js_object(Napi::Env env, const SchedulerStats& stats);

/**
 * @brief Gets the thread pool instance with error handling
 * @param env N-API environment
 * @return Reference to the thread pool instance
 */
NativeThreadPool& get_thread_pool_instance(Napi::Env env);

} // namespace napi_wrapper
} // namespace tasklets 