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
 * @file microjob.hpp
 * @brief MicroJob structure for libuv thread pool integration
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <uv.h>
#include <functional>
#include <string>
#include <cstdint>
#include <memory> // Added for std::shared_ptr

namespace tasklets {

// Forward declaration
class NativeThreadPool;

/**
 * @brief Micro job for libuv thread pool
 * 
 * This structure represents a micro job that can be queued to the libuv
 * thread pool. It contains all the necessary information to execute a
 * task and handle its completion or error.
 */
struct MicroJob {
    // =====================================================================
    // libuv Integration
    // =====================================================================
    
    /**
     * @brief The MicroJob request
     */
    uv_work_t work;
    
    // =====================================================================
    // Task Information
    // =====================================================================
    
    /**
     * @brief Unique identifier for the tasklet this job belongs to
     */
    uint64_t tasklet_id;
    
    /**
     * @brief The task function to execute
     */
    std::function<void()> task;
    
    /**
     * @brief Callback to call when work completes successfully
     */
    std::function<void(const std::string&)> on_complete;
    
    /**
     * @brief Callback to call when work encounters an error
     */
    std::function<void(const std::string&)> on_error;
    
    // =====================================================================
    // Thread Pool Reference
    // =====================================================================
    
    /**
     * @brief Pointer to the thread pool that owns this job
     */
    NativeThreadPool* thread_pool;
    
    // =====================================================================
    // Result and Error Handling
    // =====================================================================
    
    /**
     * @brief Result string from the task execution
     */
    std::string result;
    
    /**
     * @brief Error message if an error occurred
     */
    std::string error;
    
    /**
     * @brief Flag indicating if an error occurred
     */
    bool has_error;
    
    /**
     * @brief Stores the execution time of the task in milliseconds.
     */
    long long execution_duration;

    // For JS tasks
    std::shared_ptr<std::string> js_result_holder;
    std::shared_ptr<std::string> js_error_holder;
    std::shared_ptr<bool> js_has_error_holder;

    // =====================================================================
    // Constructor
    // =====================================================================
    
    /**
     * @brief Constructs a new MicroJob
     * 
     * Initializes the job with default values and sets up the
     * MicroJob request to point to this structure.
     */
    MicroJob() : 
        tasklet_id(0),
        thread_pool(nullptr),
        has_error(false),
        execution_duration(0) {
        work.data = this;
    }
    
    /**
     * @brief Destructor
     */
    ~MicroJob() = default;
    
    // Non-copyable and non-movable
    MicroJob(const MicroJob&) = delete;
    MicroJob& operator=(const MicroJob&) = delete;
    MicroJob(MicroJob&&) = delete;
    MicroJob& operator=(MicroJob&&) = delete;
    
    // =====================================================================
    // Utility Methods
    // =====================================================================
    
    /**
     * @brief Sets the result of the job execution
     * @param result_str The result string
     */
    void set_result(const std::string& result_str) {
        result = result_str;
        // Don't modify has_error - it should only be set by set_error()
    }
    
    /**
     * @brief Sets an error for this job
     * @param error_msg The error message
     */
    void set_error(const std::string& error_msg) {
        error = error_msg;
        has_error = true;
    }
    
    /**
     * @brief Checks if this job has completed successfully
     * @return true if completed without error, false otherwise
     */
    bool is_successful() const {
        return !has_error;
    }
    
    /**
     * @brief Resets the MicroJob state for reuse in an object pool
     */
    void reset() {
        task = nullptr;
        result.clear();
        error.clear();
        has_error = false;
        tasklet_id = 0;
        thread_pool = nullptr;
        execution_duration = 0;
        js_result_holder.reset();
        js_error_holder.reset();
        js_has_error_holder.reset();
    }
    
    /**
     * @brief Gets a string representation of this job for debugging
     * @return Debug string
     */
    std::string to_string() const {
        std::string str = "MicroJob[tasklet_id=" + std::to_string(tasklet_id) + 
                         ", has_error=" + (has_error ? "true" : "false");
        
        if (!result.empty()) {
            str += ", result=\"" + result + "\"";
        }
        
        if (has_error && !error.empty()) {
            str += ", error=\"" + error + "\"";
        }
        
        str += "]";
        return str;
    }
};

} // namespace tasklets 