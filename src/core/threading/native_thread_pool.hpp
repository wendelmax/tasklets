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
 * @brief Declares the NativeThreadPool class, which manages the scheduling, execution, and synchronization of tasklets using a libuv-based thread pool, supporting dependency injection and statistics.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <uv.h>
#include <memory>
#include <functional>
#include <queue>
#include <vector>
#include <atomic>
#include <mutex>
#include <condition_variable>
#include <unordered_map>

#include "../base/tasklet.hpp"
#include "../base/microjob.hpp"
#include "../monitoring/stats.hpp"
#include "../automation/auto_scheduler.hpp"

namespace tasklets {

// Forward declarations
class IMemoryManager;

class NativeThreadPool {
public:
    /**
     * @brief Constructor with dependency injection
     * @param memory_manager Memory manager instance (can be nullptr for singleton)
     */
    explicit NativeThreadPool(std::shared_ptr<IMemoryManager> memory_manager = std::shared_ptr<IMemoryManager>());
    ~NativeThreadPool();
    
    NativeThreadPool(const NativeThreadPool&) = delete;
    NativeThreadPool& operator=(const NativeThreadPool&) = delete;
    NativeThreadPool(NativeThreadPool&&) = delete;
    NativeThreadPool& operator=(NativeThreadPool&&) = delete;
    
    // Tasklet Management
    uint64_t spawn(std::function<void()> task);
    
    // Synchronization
    void join(uint64_t tasklet_id);
    void join_all();
    
    // Result and Error Handling
    std::string get_result(uint64_t tasklet_id);
    bool has_error(uint64_t tasklet_id);
    std::string get_error(uint64_t tasklet_id);
    bool is_finished(uint64_t tasklet_id);
    
    bool is_running() const;
    
    // Statistics and Monitoring
    SchedulerStats get_stats() const;
    
    // Worker Thread Management
    void set_worker_thread_count(size_t count);
    size_t get_worker_thread_count() const { return worker_thread_count_.load(); }
    
    // Memory Management Integration
    void initialize_memory_management();
    void shutdown_memory_management();
    
    // Dependency Injection
    void set_memory_manager(std::shared_ptr<IMemoryManager> memory_manager);
    
    // Singleton Pattern (for backward compatibility)
    static NativeThreadPool& get_instance();
    
    std::shared_ptr<Tasklet> find_tasklet(uint64_t id);

private:
    // libuv Callbacks
    static void work_callback(uv_work_t* req);
    static void after_work_callback_internal(uv_work_t* req, int status);
    void after_work_callback(std::unique_ptr<MicroJob> job, int status);
    
    // Internal helpers
    void cleanup_tasklet(uint64_t tasklet_id);
    uint64_t next_tasklet_id();
    
    // Member variables
    std::shared_ptr<IMemoryManager> memory_manager_;
    std::atomic<size_t> worker_thread_count_;
    std::unique_ptr<StatsCollector> stats_collector_;
    std::atomic<uint64_t> next_id_;
    
    // Tasklet storage
    std::unordered_map<uint64_t, std::shared_ptr<Tasklet>> tasklets_;
    mutable std::mutex tasklets_mutex_;
    
    // Singleton
    static std::unique_ptr<NativeThreadPool> instance_;
    static std::mutex instance_mutex_;
};

} // namespace tasklets 