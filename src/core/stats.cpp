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
 * @file stats.cpp
 * @brief Statistics collection system implementation
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "stats.hpp"
#include <thread>

namespace tasklets {

// Helper function to get default worker threads based on CPU cores
inline size_t get_default_worker_threads() {
    const auto hardware_threads = std::thread::hardware_concurrency();
    return hardware_threads > 0 ? hardware_threads : 4;
}

// =====================================================================
// StatsCollector Implementation
// =====================================================================

StatsCollector::StatsCollector() :
    total_threads_created_(0),
    completed_threads_(0),
    failed_threads_(0),
    total_execution_time_(0),
    active_threads_(0),
    worker_thread_count_(get_default_worker_threads()) { // Auto-detect based on CPU cores
}

void StatsCollector::record_thread_created() {
    total_threads_created_.fetch_add(1);
}

void StatsCollector::record_thread_completed(uint64_t execution_time_ms) {
    completed_threads_.fetch_add(1);
    total_execution_time_.fetch_add(execution_time_ms);
}

void StatsCollector::record_thread_failed() {
    failed_threads_.fetch_add(1);
}

void StatsCollector::update_active_threads(size_t count) {
    active_threads_.store(count);
}

void StatsCollector::set_worker_thread_count(size_t count) {
    worker_thread_count_.store(count);
}

SchedulerStats StatsCollector::get_stats() const {
    std::lock_guard<std::mutex> lock(stats_mutex_);
    
    SchedulerStats stats;
    stats.active_threads = active_threads_.load();
    stats.total_threads_created = total_threads_created_.load();
    stats.completed_threads = completed_threads_.load();
    stats.failed_threads = failed_threads_.load();
    stats.worker_threads = worker_thread_count_.load();
    stats.total_execution_time_ms = total_execution_time_.load();
    
    // Initialize worker utilization (placeholder for now)
    stats.worker_utilization.resize(stats.worker_threads, 0);
    
    // Calculate derived statistics
    stats.calculate_derived_stats();
    
    return stats;
}

void StatsCollector::reset() {
    std::lock_guard<std::mutex> lock(stats_mutex_);
    
    total_threads_created_.store(0);
    completed_threads_.store(0);
    failed_threads_.store(0);
    total_execution_time_.store(0);
    active_threads_.store(0);
    // Note: worker_thread_count_ is not reset as it's a configuration value
}

} // namespace tasklets 