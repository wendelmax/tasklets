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
 * @file tasklets_api.cpp
 * @brief Main API implementation for Node.js tasklets module
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include <node_api.h>
#include "napi_wrapper.hpp"

/**
 * @brief Main entry point for the Tasklets N-API module
 * 
 * This function initializes the module and exports all the tasklets
 * functions to JavaScript.
 */
Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    // Tasklet management functions
    exports.Set("spawn", Napi::Function::New(env, tasklets::napi_wrapper::spawn_tasklet));
    exports.Set("join", Napi::Function::New(env, tasklets::napi_wrapper::join_tasklet));
    exports.Set("joinAll", Napi::Function::New(env, tasklets::napi_wrapper::join_all_tasklets));
    
    // Result and error handling functions
    exports.Set("getResult", Napi::Function::New(env, tasklets::napi_wrapper::get_tasklet_result));
    exports.Set("hasError", Napi::Function::New(env, tasklets::napi_wrapper::has_tasklet_error));
    exports.Set("getError", Napi::Function::New(env, tasklets::napi_wrapper::get_tasklet_error));
    
    // Statistics and monitoring functions
    exports.Set("getStats", Napi::Function::New(env, tasklets::napi_wrapper::get_stats));
    
    // Configuration functions
    exports.Set("setWorkerThreadCount", Napi::Function::New(env, tasklets::napi_wrapper::set_worker_thread_count));
    exports.Set("getWorkerThreadCount", Napi::Function::New(env, tasklets::napi_wrapper::get_worker_thread_count));
    
    // Logging functions
    exports.Set("setLogLevel", Napi::Function::New(env, tasklets::napi_wrapper::set_log_level));
    exports.Set("getLogLevel", Napi::Function::New(env, tasklets::napi_wrapper::get_log_level));
    
    return exports;
}

// Register the module with Node.js
NODE_API_MODULE(tasklets, InitModule) 