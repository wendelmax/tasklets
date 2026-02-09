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
 * @file native_thread_pool.cpp
 * @brief Implements the NativeThreadPool class logic, including tasklet scheduling, execution, synchronization, statistics, and integration with the memory manager and libuv thread pool.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "native_thread_pool.hpp"
#include "../memory/memory_manager.hpp"
#include "../base/logger.hpp"
#include "../automation/auto_config.hpp"
#include <iostream>
#include <chrono>
#include <sstream>
#include <thread>
#include <atomic>
#include <cstring>
#include <pthread.h>

namespace tasklets {

// =====================================================================
// Helper Functions
// =====================================================================

inline size_t get_max_worker_threads() {
    const auto hardware_threads = std::thread::hardware_concurrency();
    return hardware_threads > 0 ? std::min(static_cast<size_t>(hardware_threads * 4), static_cast<size_t>(512)) : 128;
}

// =====================================================================
// NativeThreadPool Implementation
// =====================================================================

std::unique_ptr<NativeThreadPool> NativeThreadPool::instance_;
std::mutex NativeThreadPool::instance_mutex_;

NativeThreadPool::NativeThreadPool(std::shared_ptr<IMemoryManager> memory_manager)
    : worker_thread_count_([]() { 
        const auto hardware_threads = std::thread::hardware_concurrency();
        return hardware_threads > 0 ? hardware_threads : 4;
      }()),
      stats_collector_(std::make_unique<StatsCollector>()),
      next_id_(1) {
    // Use singleton if not provided
    if (memory_manager) {
        memory_manager_ = memory_manager;
    } else {
        memory_manager_ = std::shared_ptr<IMemoryManager>(&MemoryManager::get_instance(), [](IMemoryManager*){});
    }
    
    const auto max_threads = get_max_worker_threads();
    const auto buffer_size = (max_threads >= 1000) ? 8 : (max_threads >= 100) ? 6 : (max_threads >= 10) ? 4 : 3;
    std::vector<char> thread_count_str(buffer_size);
    snprintf(thread_count_str.data(), buffer_size, "%zu", worker_thread_count_.load());
    uv_os_setenv("UV_THREADPOOL_SIZE", thread_count_str.data());
    
    // stats_collector_->set_worker_thread_count(worker_thread_count_); // Removed - no public method
    
    std::stringstream ss;
    ss << "Initialized with " << worker_thread_count_ << " worker threads";
    Logger::info("NativeThreadPool", ss.str());
}

NativeThreadPool::~NativeThreadPool() {
    join_all();
}

NativeThreadPool& NativeThreadPool::get_instance() {
    std::lock_guard<std::mutex> lock(instance_mutex_);
    if (!instance_) {
        instance_ = std::make_unique<NativeThreadPool>(
            std::shared_ptr<IMemoryManager>(&MemoryManager::get_instance(), [](IMemoryManager*){})
        );
    }
    return *instance_;
}

uint64_t NativeThreadPool::next_tasklet_id() {
    return next_id_.fetch_add(1);
}

// =====================================================================
// Tasklet Management
// =====================================================================

uint64_t NativeThreadPool::spawn(std::function<void()> task) {
    if (!memory_manager_->can_allocate_memory()) {
        Logger::warn("NativeThreadPool", "Cannot spawn tasklet: Low system memory.");
        throw std::runtime_error("Not enough system memory to spawn a new tasklet.");
    }

    auto tasklet_id = next_tasklet_id();
    auto tasklet = std::make_shared<Tasklet>(tasklet_id, task);
    
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        tasklets_[tasklet_id] = tasklet;
    }
    
    memory_manager_->register_tasklet(tasklet_id, tasklet);
    
    auto work_callback_lambda = [tasklet, task]() {
        try {
            tasklet->mark_running();
            task();
            tasklet->mark_finished();
        } catch (const std::exception& e) {
            tasklet->set_error(e.what());
            tasklet->mark_finished();
        } catch (...) {
            tasklet->set_error("Unknown error occurred");
            tasklet->mark_finished();
        }
    };
    
    auto job = memory_manager_->acquire_microjob();
    if (!job) {
        throw std::runtime_error("Failed to acquire MicroJob from pool");
    }
    
    job->tasklet_id = tasklet_id;
    job->thread_pool = this;
    job->task = work_callback_lambda;
    
    // Mark job as enqueued for timing
    job->mark_enqueued();
    
    uv_work_t* req = &job->work;
    req->data = job.release();

    int result = uv_queue_work(uv_default_loop(), req, work_callback, after_work_callback_internal);
    if (result != 0) {
        std::unique_ptr<MicroJob> reclaimed_job(static_cast<MicroJob*>(req->data));
        memory_manager_->release_microjob(std::move(reclaimed_job));
        
        Logger::error("NativeThreadPool", "Failed to queue work to thread pool");
        throw std::runtime_error("Failed to queue work to thread pool");
    }
    
    stats_collector_->record_thread_created();
    
    std::stringstream ss;
    ss << "Spawned Tasklet[#" << tasklet_id << "] on MicroJob";
    Logger::debug("NativeThreadPool", ss.str());
    
    return tasklet_id;
}

// =====================================================================
// libuv Callbacks
// =====================================================================

void NativeThreadPool::work_callback(uv_work_t* req) {
    #if defined(__linux__)
        static std::atomic<int> next_cpu_core = 0;
        int num_cores = std::thread::hardware_concurrency();
        if (num_cores > 0) {
            int core_to_use = next_cpu_core.fetch_add(1) % num_cores;
            cpu_set_t cpuset;
            CPU_ZERO(&cpuset);
            CPU_SET(core_to_use, &cpuset);
            if (pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset) != 0) {
                Logger::warn("NativeThreadPool", "Failed to set CPU affinity.");
            }
        }
    #endif
    
    MicroJob* job = static_cast<MicroJob*>(req->data);
    
    // Mark job as started for timing
    job->mark_started();
    
    job->task();
    
    // Mark job as completed for timing
    job->mark_completed();
    
    // Record job metrics for auto-scheduling and auto-config
    auto job_ptr = std::shared_ptr<MicroJob>(job, [](MicroJob*){}); // non-owning
    AutoScheduler::get_instance().record_job_metrics(job_ptr);
    AutoConfig::get_instance().record_job_metrics(job_ptr);
}

void NativeThreadPool::after_work_callback_internal(uv_work_t* req, int status) {
    std::unique_ptr<MicroJob> job(static_cast<MicroJob*>(req->data));
    if (job && job->thread_pool) {
        job->thread_pool->after_work_callback(std::move(job), status);
    }
}

void NativeThreadPool::after_work_callback(std::unique_ptr<MicroJob> job, int status) {
    auto tasklet = find_tasklet(job->tasklet_id);
    
    if (tasklet) {
        if (status != 0) {
            tasklet->set_error("Task cancelled or failed in libuv queue.");
            stats_collector_->record_thread_failed();
        } else {
            stats_collector_->record_thread_completed(job->execution_duration);
            AutoConfig::get_instance().notify_job_completed();
        }
        tasklet->mark_finished();
        tasklet->notify_completion();
        // Note: We need to access the memory manager through the thread pool instance
        // This is a limitation of the static callback approach
        if (job->thread_pool) {
            job->thread_pool->memory_manager_->mark_for_cleanup(job->tasklet_id);
        }
    } else {
        stats_collector_->record_thread_failed();
    }
    
    // Note: We need to access the memory manager through the thread pool instance
    if (job->thread_pool) {
        job->thread_pool->memory_manager_->release_microjob(std::move(job));
    }
}


// =====================================================================
// Synchronization
// =====================================================================

void NativeThreadPool::join(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    if (tasklet) {
        tasklet->wait_for_completion();
    }
}

void NativeThreadPool::join_all() {
    std::vector<std::shared_ptr<Tasklet>> all_tasklets;
    {
        std::lock_guard<std::mutex> lock(tasklets_mutex_);
        for (const auto& pair : tasklets_) {
            all_tasklets.push_back(pair.second);
        }
    }
    
    for (const auto& tasklet : all_tasklets) {
        if (tasklet) {
            tasklet->wait_for_completion();
        }
    }
    
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    tasklets_.clear();
}

// =====================================================================
// Result and Error Handling
// =====================================================================

std::string NativeThreadPool::get_result(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    return tasklet ? tasklet->get_result() : "";
}

bool NativeThreadPool::has_error(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    return tasklet ? tasklet->has_error() : false;
}

std::string NativeThreadPool::get_error(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    return tasklet ? tasklet->get_error() : "Tasklet not found.";
}

bool NativeThreadPool::is_finished(uint64_t tasklet_id) {
    auto tasklet = find_tasklet(tasklet_id);
    return tasklet ? tasklet->is_finished() : true;
}



// =====================================================================
// Statistics and Monitoring
// =====================================================================

SchedulerStats NativeThreadPool::get_stats() const {
    return stats_collector_->get_stats();
}

bool NativeThreadPool::is_running() const {
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    return !tasklets_.empty();
}

// =====================================================================
// Configuration
// =====================================================================

void NativeThreadPool::set_worker_thread_count(size_t count) {
    if (count == 0) {
        Logger::warn("NativeThreadPool", "Cannot set worker thread count to 0");
        return;
    }
    
    size_t old_count = worker_thread_count_.load();
    if (old_count == count) {
        return; // No change needed
    }
    
    // Update the worker thread count
    worker_thread_count_.store(count);
    
    // Update libuv thread pool size
    // Use a larger buffer to accommodate any reasonable thread count (up to 20 digits)
    const auto buffer_size = 32;
    std::vector<char> thread_count_str(buffer_size);
    snprintf(thread_count_str.data(), buffer_size, "%zu", count);
    uv_os_setenv("UV_THREADPOOL_SIZE", thread_count_str.data());
    
    // Update stats collector
    if (stats_collector_) {
        // Note: StatsCollector doesn't have a set_worker_thread_count method yet
        // This would need to be added if we want to track the change
    }
    
    Logger::info("NativeThreadPool", "Worker thread count changed from " + 
                std::to_string(old_count) + " to " + std::to_string(count));
}

// =====================================================================
// Singleton and Internal Helpers
// =====================================================================

void NativeThreadPool::initialize_memory_management() {
    memory_manager_->initialize(uv_default_loop());
}

void NativeThreadPool::shutdown_memory_management() {
    memory_manager_->shutdown();
}

std::shared_ptr<Tasklet> NativeThreadPool::find_tasklet(uint64_t id) {
    std::lock_guard<std::mutex> lock(tasklets_mutex_);
    auto it = tasklets_.find(id);
    if (it != tasklets_.end()) {
        return it->second;
    }
    return nullptr;
}

void NativeThreadPool::set_memory_manager(std::shared_ptr<IMemoryManager> memory_manager) {
    if (memory_manager) {
        memory_manager_ = memory_manager;
        Logger::info("NativeThreadPool", "Memory manager updated via dependency injection");
    }
}



} // namespace tasklets 