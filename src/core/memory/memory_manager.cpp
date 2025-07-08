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
 * @file memory_manager.cpp
 * @brief Implements the MemoryManager logic, including memory pool management, tasklet registration, cleanup, and system memory policy enforcement for the thread pool.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */
 
#include "memory_manager.hpp"
#include "../base/tasklet.hpp"
#include "../base/microjob.hpp"
#include "../base/logger.hpp"
#include <algorithm>
#include <sstream>
#include <fstream>

namespace tasklets {

// ObjectPool Implementation
template<typename T>
ObjectPool<T>::ObjectPool(size_t initial_size, size_t max_size)
    : total_created_(0), in_use_count_(0), max_pool_size_(max_size) {
    
    // Pre-allocate initial objects
    for (size_t i = 0; i < initial_size; ++i) {
        auto obj = create_new_object();
        if (obj) {
            available_objects_.push(std::move(obj));
        }
    }
}

template<typename T>
ObjectPool<T>::~ObjectPool() {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    while (!available_objects_.empty()) {
        available_objects_.pop();
    }
}

template<typename T>
std::unique_ptr<T> ObjectPool<T>::acquire() {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    
    std::unique_ptr<T> obj;
    
    if (!available_objects_.empty()) {
        obj = std::move(available_objects_.front());
        available_objects_.pop();
    } else {
        obj = create_new_object();
    }
    
    if (obj) {
        in_use_count_++;
    }
    
    return obj;
}

template<typename T>
void ObjectPool<T>::release(std::unique_ptr<T> obj) {
    if (!obj) return;
    
    std::lock_guard<std::mutex> lock(pool_mutex_);
    
    in_use_count_--;
    
    if (available_objects_.size() < max_pool_size_) {
        // Reset object state if needed
        // obj->reset(); // Assuming T has a reset() method
        available_objects_.push(std::move(obj));
    }
    // If pool is full, obj will be automatically destroyed
}

template<typename T>
typename ObjectPool<T>::PoolStats ObjectPool<T>::get_stats() const {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    return {
        total_created_.load(),
        available_objects_.size(),
        in_use_count_.load(),
        max_pool_size_
    };
}

template<typename T>
std::unique_ptr<T> ObjectPool<T>::create_new_object() {
    total_created_++;
    return std::make_unique<T>();
}

// Explicit template instantiations
template class ObjectPool<MicroJob>;

// MemoryManager Implementation
MemoryManager& MemoryManager::get_instance() {
    static MemoryManager instance;
    return instance;
}

MemoryManager::MemoryManager() : 
    cleanup_interval_ms_(5000), // Default cleanup interval
    memory_limit_percent_(70.0), // Default memory limit
    total_tasklets_created_(0),
    cleanup_operations_count_(0),
    last_cleanup_time_(std::chrono::steady_clock::now()),
    is_initialized_(false) {
    // Initialization of the object pool can be done here if it doesn't depend on external params
}

MemoryManager::~MemoryManager() {
    if (is_initialized_) {
        shutdown();
    }
}

void MemoryManager::timer_callback(uv_timer_t* handle) {
    MemoryManager* self = static_cast<MemoryManager*>(handle->data);
    Logger::debug("MemoryManager", "Timer callback triggered, performing cleanup");
    self->perform_cleanup();
}

void MemoryManager::initialize(uv_loop_t* loop) {
    if (is_initialized_) {
        return;
    }
    
    Logger::info("MemoryManager", "Initializing Memory Manager with libuv timer");
    
    // Initialize default values
    cleanup_interval_ms_ = 5000; // Default cleanup interval
    total_tasklets_created_ = 0;
    cleanup_operations_count_ = 0;
    last_cleanup_time_ = std::chrono::steady_clock::now();
    
    // Initialize object pools with default values
    microjob_pool_ = std::make_unique<ObjectPool<MicroJob>>(
        20, // Default initial size
        200  // Default max size
    );
    
    // Initialize and start the libuv timer
    uv_timer_init(loop, &cleanup_timer_);
    cleanup_timer_.data = this;
    uv_timer_start(&cleanup_timer_, timer_callback, cleanup_interval_ms_.load(), cleanup_interval_ms_.load());
    
    is_initialized_ = true;
    Logger::info("MemoryManager", "Memory Manager initialized successfully");
}

void MemoryManager::shutdown() {
    if (!is_initialized_) {
        return;
    }
    
    Logger::info("MemoryManager", "Shutting down Memory Manager");
    
    // Stop the timer
    uv_timer_stop(&cleanup_timer_);
    
    // Force final cleanup
    perform_cleanup();
    
    // Reset pools
    microjob_pool_.reset();
    
    is_initialized_ = false;
    Logger::info("MemoryManager", "Memory Manager shutdown complete");
}

void MemoryManager::register_tasklet(uint64_t tasklet_id, std::shared_ptr<Tasklet> tasklet) {
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        
        active_tasklets_[tasklet_id] = tasklet;
        total_tasklets_created_++;
        
        std::stringstream ss;
        ss << "Registered tasklet " << tasklet_id << " (total active: " << active_tasklets_.size() << ")";
        Logger::debug("MemoryManager", ss.str());
    }
}

void MemoryManager::mark_for_cleanup(uint64_t tasklet_id) {
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    
    auto it = active_tasklets_.find(tasklet_id);
    if (it != active_tasklets_.end()) {
        cleanup_queue_.push(tasklet_id);
        std::stringstream ss;
        ss << "Marked tasklet " << tasklet_id << " for cleanup";
        Logger::debug("MemoryManager", ss.str());
    }
}

void MemoryManager::unregister_tasklet(uint64_t tasklet_id) {
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    
    active_tasklets_.erase(tasklet_id);
    std::stringstream ss;
    ss << "Immediately unregistered tasklet " << tasklet_id;
    Logger::debug("MemoryManager", ss.str());
}

std::unique_ptr<MicroJob> MemoryManager::acquire_microjob() {
    if (!microjob_pool_) {
        microjob_pool_ = std::make_unique<ObjectPool<MicroJob>>(
            20, // Default initial size
            200  // Default max size
        );
    }
    return microjob_pool_->acquire();
}

void MemoryManager::release_microjob(std::unique_ptr<MicroJob> job) {
    if (microjob_pool_) {
        microjob_pool_->release(std::move(job));
    }
}

void MemoryManager::force_cleanup() {
    Logger::debug("MemoryManager", "Forcing cleanup of completed tasklets");
    perform_cleanup();
}

MemoryStats MemoryManager::get_memory_stats() const {
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    std::lock_guard<std::mutex> stats_lock(stats_mutex_);
    
    auto microjob_stats = microjob_pool_ ? microjob_pool_->get_stats() : ObjectPool<MicroJob>::PoolStats{0,0,0,0};
    
    // Calculate approximate memory usage
    double memory_mb = 0.0;
    // Note: This only estimates the size of the control blocks, not the Tasklet objects themselves
    memory_mb += active_tasklets_.size() * sizeof(std::weak_ptr<Tasklet>) / (1024.0 * 1024.0);
    memory_mb += cleanup_queue_.size() * sizeof(uint64_t) / (1024.0 * 1024.0);
    memory_mb += microjob_stats.total_created * sizeof(MicroJob) / (1024.0 * 1024.0);
    
    return {
        active_tasklets_.size(),
        cleanup_queue_.size(),
        total_tasklets_created_.load(),
        cleanup_operations_count_.load(),
        std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now() - last_cleanup_time_
        ).count(),
        memory_mb,
        microjob_stats,
        0, // system_total_memory_bytes
        0, // system_free_memory_bytes
        0, // system_used_memory_bytes
        0.0 // system_memory_usage_percent
    };
}



void MemoryManager::perform_cleanup() {
    std::vector<uint64_t> to_cleanup;
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        while (!cleanup_queue_.empty()) {
            to_cleanup.push_back(cleanup_queue_.front());
            cleanup_queue_.pop();
        }
    }

    if (to_cleanup.empty()) {
        return;
    }

    std::stringstream ss;
    ss << "Cleaning up " << to_cleanup.size() << " tasklets.";
    Logger::debug("MemoryManager", ss.str());

    {
        std::unique_lock<std::mutex> lock(tasklets_mutex_);
        for (uint64_t id : to_cleanup) {
            auto it = active_tasklets_.find(id);
            if (it != active_tasklets_.end()) {
                // If the tasklet is finished and no longer needed, erase it
                if (it->second.expired()) {
                    active_tasklets_.erase(it);
                } else {
                    // Otherwise, put it back in the queue for a future check
                    // (This case should be rare if logic is correct)
                    cleanup_queue_.push(id);
                }
            }
        }
    }

    {
        std::lock_guard<std::mutex> stats_lock(stats_mutex_);
        last_cleanup_time_ = std::chrono::steady_clock::now();
        cleanup_operations_count_++;
    }
}

bool MemoryManager::can_allocate_memory() {
#if defined(__linux__)
    std::ifstream meminfo("/proc/meminfo");
    if (!meminfo.is_open()) {
        Logger::warn("MemoryManager", "Could not open /proc/meminfo to check memory.");
        return true; // Failsafe: allow allocation if we can't check.
    }

    std::string line;
    long long mem_total = -1, mem_free = -1, buffers = -1, cached = -1;

    while (std::getline(meminfo, line)) {
        std::stringstream ss(line);
        std::string key;
        long long value;
        ss >> key >> value;

        if (key == "MemTotal:") mem_total = value;
        else if (key == "MemFree:") mem_free = value;
        else if (key == "Buffers:") buffers = value;
        else if (key == "Cached:") cached = value;
    }

    if (mem_total > 0 && mem_free > 0 && buffers > 0 && cached > 0) {
        long long available_memory = mem_free + buffers + cached;
        double free_percentage = static_cast<double>(available_memory) / mem_total;

        if (free_percentage < 0.30) {
            Logger::error("MemoryManager", "Memory usage is too high (" + std::to_string((1.0 - free_percentage) * 100) + "% used). Cannot allocate new tasklet.");
            return false;
        }
    }
#endif
    return true; // Allow allocation on non-Linux systems or if parsing fails
}



MemoryStats MemoryManager::get_system_memory_stats() const {
    MemoryStats stats = get_memory_stats();
    
    // Get system memory information using libuv
    uint64_t total_memory_bytes = uv_get_total_memory();
    uint64_t free_memory_bytes = uv_get_free_memory();
    uint64_t used_memory_bytes = total_memory_bytes - free_memory_bytes;
    double memory_usage_percent = (double)used_memory_bytes / total_memory_bytes * 100.0;
    
    stats.system_total_memory_bytes = total_memory_bytes;
    stats.system_free_memory_bytes = free_memory_bytes;
    stats.system_used_memory_bytes = used_memory_bytes;
    stats.system_memory_usage_percent = memory_usage_percent;
    
    return stats;
}

bool MemoryManager::is_memory_usage_acceptable() const {
    uint64_t total_memory_bytes = uv_get_total_memory();
    uint64_t free_memory_bytes = uv_get_free_memory();
    uint64_t used_memory_bytes = total_memory_bytes - free_memory_bytes;
    double memory_usage_percent = (double)used_memory_bytes / total_memory_bytes * 100.0;
    
    double limit = memory_limit_percent_.load();
    
    if (memory_usage_percent > limit) {
        Logger::warn("MemoryManager", "System memory usage (" + std::to_string(memory_usage_percent) + 
                    "%) exceeds limit (" + std::to_string(limit) + "%)");
        return false;
    }
    
    return true;
}

} // namespace tasklets 