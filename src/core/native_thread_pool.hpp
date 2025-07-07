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
 * @file native_thread_pool.hpp
 * @brief Native thread pool using libuv for tasklet execution
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <napi.h>
#include <uv.h>
#include <memory>
#include <functional>
#include <queue>
#include <vector>
#include <atomic>
#include <mutex>
#include <condition_variable>
#include <unordered_map>

// Include our new components
#include "tasklet.hpp"
#include "microjob.hpp"
#include "stats.hpp"

namespace tasklets {

/**
 * @brief Native thread pool using libuv
 * 
 * The NativeThreadPool is responsible for managing tasklets and
 * coordinating their execution using the libuv thread pool. It provides
 * a high-level interface for spawning, managing, and monitoring tasklets.
 */
class NativeThreadPool {
public:
    /**
     * @brief Constructs a new NativeThreadPool
     */
    NativeThreadPool();
    
    /**
     * @brief Destructor
     */
    ~NativeThreadPool();
    
    // Non-copyable and non-movable
    NativeThreadPool(const NativeThreadPool&) = delete;
    NativeThreadPool& operator=(const NativeThreadPool&) = delete;
    NativeThreadPool(NativeThreadPool&&) = delete;
    NativeThreadPool& operator=(NativeThreadPool&&) = delete;
    
    // =====================================================================
    // Tasklet Management
    // =====================================================================
    
    /**
     * @brief Spawns a new tasklet with a C++ function
     * @param task The function to execute
     * @return Unique tasklet ID
     */
    uint64_t spawn(std::function<void()> task);
    
    /**
     * @brief Spawns a new tasklet with a JavaScript function
     * @param js_function The JavaScript function to execute
     * @param env The N-API environment
     * @return Unique tasklet ID
     */
    uint64_t spawn_js(Napi::Function js_function, Napi::Env env);
    
    // =====================================================================
    // Synchronization
    // =====================================================================
    
    /**
     * @brief Waits for a specific tasklet to complete
     * @param tasklet_id The ID of the tasklet to wait for
     */
    void join(uint64_t tasklet_id);
    
    /**
     * @brief Waits for all tasklets to complete
     */
    void join_all();
    
    // =====================================================================
    // Result and Error Handling
    // =====================================================================
    
    /**
     * @brief Gets the result of a completed tasklet
     * @param tasklet_id The tasklet ID
     * @return The result string
     */
    std::string get_result(uint64_t tasklet_id);
    
    /**
     * @brief Checks if a tasklet has an error
     * @param tasklet_id The tasklet ID
     * @return true if the tasklet has an error, false otherwise
     */
    bool has_error(uint64_t tasklet_id);
    
    /**
     * @brief Gets the error message of a failed tasklet
     * @param tasklet_id The tasklet ID
     * @return The error message
     */
    std::string get_error(uint64_t tasklet_id);
    
    /**
     * @brief Checks if a tasklet has finished execution
     * @param tasklet_id The tasklet ID
     * @return true if the tasklet is finished, false otherwise
     */
    bool is_finished(uint64_t tasklet_id);
    
    // =====================================================================
    // Statistics and Monitoring
    // =====================================================================
    
    /**
     * @brief Gets comprehensive statistics about the thread pool
     * @return SchedulerStats structure with current statistics
     */
    SchedulerStats get_stats() const;
    
    // =====================================================================
    // Configuration
    // =====================================================================
    
    /**
     * @brief Sets the number of worker threads
     * @param count The number of worker threads
     */
    void set_worker_thread_count(size_t count);
    
    /**
     * @brief Gets the current number of worker threads
     * @return The number of worker threads
     */
    size_t get_worker_thread_count() const { return worker_thread_count_; }
    
    // =====================================================================
    // Singleton Pattern
    // =====================================================================
    
    /**
     * @brief Gets the singleton instance of the thread pool
     * @return Reference to the thread pool instance
     */
    static NativeThreadPool& get_instance();
    
    // =====================================================================
    // Internal Callbacks (called by libuv)
    // =====================================================================
    
    /**
     * @brief Called when work completes successfully
     * @param job The job that completed
     */
    void on_work_complete(MicroJob* job);
    
    /**
     * @brief Called when work encounters an error
     * @param job The job that failed
     */
    void on_work_error(MicroJob* job);

private:
    // =====================================================================
    // libuv Callbacks
    // =====================================================================
    
    /**
     * @brief MicroJob callback (runs in worker thread)
     * @param req The work request
     */
    static void work_callback(uv_work_t* req);
    
    /**
     * @brief libuv after work callback (runs in main thread)
     * @param req The work request
     * @param status The completion status
     */
    static void after_work_callback(uv_work_t* req, int status);
    
    // =====================================================================
    // Internal Tasklet Management
    // =====================================================================
    
    /**
     * @brief Finds a tasklet by its ID
     * @param id The tasklet ID to find
     * @return Shared pointer to the tasklet, or nullptr if not found
     */
    std::shared_ptr<Tasklet> find_tasklet(uint64_t id);
    
    /**
     * @brief Cleans up finished tasklets to free memory
     */
    void cleanup_finished_tasklets();
    
    /**
     * @brief Generates the next unique tasklet ID
     * @return A unique tasklet ID
     */
    uint64_t next_tasklet_id();
    
    // =====================================================================
    // Tasklet Storage
    // =====================================================================
    
    /**
     * @brief Mutex for protecting tasklet storage
     */
    mutable std::mutex tasklets_mutex_;
    
    /**
     * @brief Map of active tasklets
     */
    std::unordered_map<uint64_t, std::shared_ptr<Tasklet>> tasklets_;
    
    /**
     * @brief Queue of pending tasklets
     */
    std::queue<std::shared_ptr<Tasklet>> pending_tasklets_;
    
    // =====================================================================
    // Configuration
    // =====================================================================
    
    /**
     * @brief Number of worker threads in the pool
     */
    size_t worker_thread_count_;
    
    // =====================================================================
    // Statistics
    // =====================================================================
    
    /**
     * @brief Statistics collector
     */
    std::unique_ptr<StatsCollector> stats_collector_;
    
    // =====================================================================
    // ID Generation
    // =====================================================================
    
    /**
     * @brief Atomic counter for generating unique tasklet IDs
     */
    std::atomic<uint64_t> next_id_;
    
    // =====================================================================
    // Singleton
    // =====================================================================
    
    /**
     * @brief Singleton instance
     */
    static std::unique_ptr<NativeThreadPool> instance_;
    
    /**
     * @brief Mutex for protecting singleton creation
     */
    static std::mutex instance_mutex_;
};

} // namespace tasklets 