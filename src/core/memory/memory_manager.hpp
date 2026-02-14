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
 * @file memory_manager.hpp
 * @brief Declares the MemoryManager class and IMemoryManager interface, responsible for memory pool management, tasklet lifecycle, and system memory policy for the thread pool.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */
 
#pragma once

#include <memory>
#include <unordered_map>
#include <chrono>
#include <mutex>
#include <queue>
#include <vector>
#include <atomic>
#include <uv.h> // Include libuv header
#include "../automation/auto_config.hpp"

namespace tasklets {

// Forward declarations
class Tasklet;
struct MicroJob;

/**
 * @brief Memory pool for object reuse to reduce allocation overhead
 * @tparam T The type of objects to pool
 */
template<typename T>
class ObjectPool {
public:
    ObjectPool(size_t initial_size = 10, size_t max_size = 100);
    ~ObjectPool();
    
    /**
     * @brief Get an object from the pool or create a new one
     * @return Unique pointer to the object
     */
    std::unique_ptr<T> acquire();
    
    /**
     * @brief Return an object to the pool for reuse
     * @param obj The object to return
     */
    void release(std::unique_ptr<T> obj);
    
    /**
     * @brief Get current pool statistics
     */
    struct PoolStats {
        size_t total_created;
        size_t available_in_pool;
        size_t in_use;
        size_t max_pool_size;
    };
    
    PoolStats get_stats() const;
    
private:
    mutable std::mutex pool_mutex_;
    std::queue<std::unique_ptr<T>> available_objects_;
    std::atomic<size_t> total_created_;
    std::atomic<size_t> in_use_count_;
    const size_t max_pool_size_;
    
    std::unique_ptr<T> create_new_object();
};

/**
 * @brief Memory statistics structure
 */
struct MemoryStats {
    size_t active_tasklets;
    size_t pending_cleanup;
    uint64_t total_tasklets_created;
    uint64_t cleanup_operations_count;
    long long time_since_last_cleanup_ms;
    double memory_usage_mb;
    typename ObjectPool<MicroJob>::PoolStats microjob_pool_stats;
    
    // System memory information
    uint64_t system_total_memory_bytes;
    uint64_t system_free_memory_bytes;
    uint64_t system_used_memory_bytes;
    double system_memory_usage_percent;
};

/**
 * @brief Interface for memory management operations
 * This enables dependency injection and better testability
 */
class IMemoryManager {
public:
    virtual ~IMemoryManager() = default;
    
    virtual void initialize(uv_loop_t* loop) = 0;
    virtual void shutdown() = 0;
    virtual void register_tasklet(uint64_t tasklet_id, std::shared_ptr<Tasklet> tasklet) = 0;
    virtual void mark_for_cleanup(uint64_t tasklet_id) = 0;
    virtual void unregister_tasklet(uint64_t tasklet_id) = 0;
    virtual std::unique_ptr<MicroJob> acquire_microjob() = 0;
    virtual void release_microjob(std::unique_ptr<MicroJob> job) = 0;
    virtual void force_cleanup() = 0;
    virtual bool can_allocate_memory() = 0;
    virtual bool is_memory_usage_acceptable() const = 0;

    virtual MemoryStats get_memory_stats() const = 0;
    virtual MemoryStats get_system_memory_stats() const = 0;
    
    virtual void set_max_memory_limit_bytes(uint64_t bytes) = 0;
    virtual uint64_t get_max_memory_limit_bytes() const = 0;
};

/**
 * @brief Manages memory lifecycle and cleanup for tasklets
 */
class MemoryManager : public IMemoryManager {
public:
    /**
     * @brief Get singleton instance
     * @return Reference to the MemoryManager instance
     */
    static MemoryManager& get_instance();

    /**
     * @brief Initialize the memory manager and start background cleanup
     * @param loop The libuv loop to attach the timer to
     */
    void initialize(uv_loop_t* loop) override;

    /**
     * @brief Shutdown the memory manager and stop background cleanup
     */
    void shutdown() override;
    
    /**
     * @brief Register a tasklet for memory management
     * @param tasklet_id The ID of the tasklet
     * @param tasklet The tasklet pointer
     */
    void register_tasklet(uint64_t tasklet_id, std::shared_ptr<Tasklet> tasklet) override;
    
    /**
     * @brief Mark a tasklet as completed and schedule for cleanup
     * @param tasklet_id The ID of the tasklet
     */
    void mark_for_cleanup(uint64_t tasklet_id) override;
    
    /**
     * @brief Unregister a tasklet (immediate cleanup)
     * @param tasklet_id The ID of the tasklet
     */
    void unregister_tasklet(uint64_t tasklet_id) override;
    
    /**
     * @brief Get a MicroJob from the pool
     * @return Unique pointer to a MicroJob
     */
    std::unique_ptr<MicroJob> acquire_microjob() override;
    
    /**
     * @brief Return a MicroJob to the pool
     * @param job The MicroJob to return
     */
    void release_microjob(std::unique_ptr<MicroJob> job) override;
    
    /**
     * @brief Force garbage collection of completed tasklets
     */
    void force_cleanup() override;
    
    /**
     * @brief Checks if there is enough system memory to create a new tasklet.
     * @return True if memory is available, false otherwise.
     */
    bool can_allocate_memory() override;
    
    MemoryStats get_memory_stats() const override;
    

    
    /**
     * @brief Get system memory information using libuv.
     * @return MemoryStats with system memory information.
     */
    MemoryStats get_system_memory_stats() const override;
    
    /**
     * @brief Check if system memory usage is below the configured limit.
     * @return True if memory usage is acceptable, false otherwise.
     */
    bool is_memory_usage_acceptable() const override;
    
    /**
     * @brief Set the maximum memory limit in bytes.
     * @param bytes The maximum memory limit in bytes (0 for auto/disabled).
     */
    void set_max_memory_limit_bytes(uint64_t bytes) override;
    
    /**
     * @brief Get the maximum memory limit in bytes.
     * @return The maximum memory limit in bytes.
     */
    uint64_t get_max_memory_limit_bytes() const override;
    
private:
    MemoryManager();
    ~MemoryManager();
    MemoryManager(const MemoryManager&) = delete;
    MemoryManager& operator=(const MemoryManager&) = delete;

    /**
     * @brief The core cleanup function, called by the timer
     */
    void perform_cleanup();

    // Static callback for libuv timer
    static void timer_callback(uv_timer_t* handle);

    // Pools for object reuse
    std::unique_ptr<ObjectPool<MicroJob>> microjob_pool_;

    // Tasklet tracking
    std::unordered_map<uint64_t, std::weak_ptr<Tasklet>> active_tasklets_;
    std::queue<uint64_t> cleanup_queue_;
    mutable std::mutex tasklets_mutex_;

    // Configuration
    std::atomic<uint32_t> cleanup_interval_ms_;
    std::atomic<double> memory_limit_percent_;
    std::atomic<uint64_t> max_memory_bytes_;

    // State
    uv_timer_t cleanup_timer_;
    bool is_initialized_ = false;

    // Statistics
    std::atomic<uint64_t> total_tasklets_created_;
    std::atomic<uint64_t> cleanup_operations_count_;
    std::chrono::steady_clock::time_point last_cleanup_time_;
    mutable std::mutex stats_mutex_;
};

} // namespace tasklets 