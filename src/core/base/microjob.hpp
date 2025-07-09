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
 * @brief Declares the MicroJob class and related structures, representing a unit of work that can be executed by the thread pool, including state management, timing, priority, and result handling.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <uv.h>
#include <functional>
#include <string>
#include <mutex>
#include <atomic>
#include <chrono>
#include <memory>
#include "common_types.hpp"

namespace tasklets {

class NativeThreadPool;

/**
 * @brief Enumeration of possible job states
 */
enum class JobState {
    PENDING,    // Job is queued but not yet started
    RUNNING,    // Job is currently executing
    COMPLETED,  // Job completed successfully
    FAILED,     // Job failed with an error
    CANCELLED   // Job was cancelled
};

/**
 * @brief Represents a unit of work that can be executed by the thread pool
 * 
 * This class encapsulates all the information needed to execute a
 * task and handle its completion, error, cancellation, and timeout.
 */
struct MicroJob {
    // =====================================================================
    // libuv Integration
    // =====================================================================
    
    /**
     * @brief The MicroJob request
     */
    uv_work_t work;
    
    /**
     * @brief Timeout timer for job execution
     */
    uv_timer_t timeout_timer;
    
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
    // State Management
    // =====================================================================
    
    /**
     * @brief Current state of the job
     */
    JobState state;
    
    /**
     * @brief Mutex for thread-safe state access
     */
    mutable std::mutex state_mutex;
    
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
     * @brief Stores the execution time of the task in milliseconds
     */
    long long execution_duration;

    // =====================================================================
    // Timeout and Priority
    // =====================================================================
    
    /**
     * @brief Timeout duration in milliseconds (0 = no timeout)
     */
    long long timeout_duration;
    
    /**
     * @brief Job priority (higher number = higher priority)
     */
    int priority;
    
    // =====================================================================
    // Timestamps for Profiling
    // =====================================================================
    
    /**
     * @brief When the job was added to the queue (nanoseconds)
     */
    uint64_t enqueue_time;
    
    /**
     * @brief When the job started execution (nanoseconds)
     */
    uint64_t start_time;
    
    /**
     * @brief When the job completed (nanoseconds)
     */
    uint64_t completion_time;
    
    // =====================================================================
    // Constructor
    // =====================================================================
    
    /**
     * @brief Constructs a new MicroJob
     * 
     * Initializes the job with default values and sets up the
     * MicroJob request to point to this structure.
     */
    MicroJob();
    
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
    // State Management Methods
    // =====================================================================
    
    /**
     * @brief Marks the job as cancelled
     */
    void cancel();
    
    /**
     * @brief Checks if the job is cancelled
     * @return true if cancelled, false otherwise
     */
    bool is_cancelled() const;
    
    /**
     * @brief Gets the current job state
     * @return Current state
     */
    JobState get_state() const;
    
    // =====================================================================
    // Timeout Management
    // =====================================================================
    

    
    // =====================================================================
    // Priority Management
    // =====================================================================
    
    /**
     * @brief Sets job priority
     * @param prio Priority level (higher = more important)
     */
    void set_priority(int prio);
    
    /**
     * @brief Gets job priority
     * @return Priority level
     */
    int get_priority() const { return priority; }
    
    // =====================================================================
    // Timing Methods
    // =====================================================================
    
    /**
     * @brief Records enqueue time (call when adding to pool)
     */
    void mark_enqueued();
    
    /**
     * @brief Records start time (call when execution begins)
     */
    void mark_started();
    
    /**
     * @brief Records completion time and calculates duration
     */
    void mark_completed();
    
    /**
     * @brief Gets the time spent waiting in queue (ms)
     * @return Queue wait time in milliseconds
     */
    long long get_queue_wait_time() const;
    
    /**
     * @brief Gets the total time from enqueue to completion (ms)
     * @return Total time in milliseconds
     */
    long long get_total_time() const;
    
    // =====================================================================
    // Result and Error Handling
    // =====================================================================
    
    /**
     * @brief Sets the result of the job execution
     * @param result_str The result string
     */
    void set_result(const std::string& result_str);
    
    /**
     * @brief Sets an error for this job
     * @param error_msg The error message
     */
    void set_error(const std::string& error_msg);
    
    /**
     * @brief Gets the result of the job execution
     * @return The result string
     */
    std::string get_result() const;
    
    /**
     * @brief Gets the error message if any
     * @return The error message
     */
    std::string get_error() const;
    
    /**
     * @brief Checks if this job has completed successfully
     * @return true if completed without error, false otherwise
     */
    bool is_successful() const;
    
    /**
     * @brief Checks if this job has failed
     * @return true if failed, false otherwise
     */
    bool has_failed() const;
    
    /**
     * @brief Checks if this job is finished (completed, failed, or cancelled)
     * @return true if finished, false otherwise
     */
    bool is_finished() const;
    
    // =====================================================================
    // Utility Methods
    // =====================================================================
    
    /**
     * @brief Resets the MicroJob state for reuse in an object pool
     */
    void reset();
    
    /**
     * @brief Gets a string representation of this job for debugging
     * @return Debug string
     */
    std::string to_string() const;

    // =====================================================================
    // Auto-Scheduling Integration
    // =====================================================================

    /**
     * @brief Apply auto-scheduling recommendations to this job
     * @param timeout_ms Recommended timeout
     * @param priority Recommended priority
     */
    void apply_auto_scheduling_recommendations(long long timeout_ms, int priority);

    /**
     * @brief Get job complexity estimation
     * @return Estimated complexity based on execution time
     */
    JobComplexity get_estimated_complexity() const;

    /**
     * @brief Check if job should be batched based on complexity
     * @return True if job is suitable for batching
     */
    bool is_suitable_for_batching() const;
};

} // namespace tasklets 