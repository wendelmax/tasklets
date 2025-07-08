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
 * @file multiprocessor.cpp
 * @brief Implementation of the internal multiprocessing system for core functions
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "multiprocessor.hpp"
#include <sstream>
#include <thread>

namespace tasklets {

// =====================================================================
// Static Member Initialization
// =====================================================================

std::unique_ptr<Multiprocessor> Multiprocessor::instance_;
std::mutex Multiprocessor::instance_mutex_;

// =====================================================================
// Multiprocessor Implementation
// =====================================================================

Multiprocessor::Multiprocessor()
    : enabled_(true)
    , initialized_(false)
    , optimal_thread_count_(std::thread::hardware_concurrency()) {
    
    if (optimal_thread_count_ == 0) {
        optimal_thread_count_ = 4; // Fallback to 4 threads
    }
    
    Logger::info("Multiprocessor", "Initialized with " + std::to_string(optimal_thread_count_) + " optimal threads");
}

Multiprocessor::~Multiprocessor() {
    shutdown();
}

Multiprocessor& Multiprocessor::get_instance() {
    std::lock_guard<std::mutex> lock(instance_mutex_);
    if (!instance_) {
        instance_ = std::make_unique<Multiprocessor>();
    }
    return *instance_;
}

void Multiprocessor::initialize() {
    if (initialized_.load()) {
        return;
    }
    
    // Set optimal thread count based on system capabilities
    size_t hw_threads = std::thread::hardware_concurrency();
    if (hw_threads > 0) {
        optimal_thread_count_ = hw_threads;
    } else {
        optimal_thread_count_ = 4; // Conservative fallback
    }
    
    initialized_.store(true);
    
    std::stringstream ss;
    ss << "Multiprocessor initialized with " << optimal_thread_count_ << " optimal threads";
    Logger::info("Multiprocessor", ss.str());
}

void Multiprocessor::shutdown() {
    if (!initialized_.load()) {
        return;
    }
    
    enabled_.store(false);
    initialized_.store(false);
    
    Logger::info("Multiprocessor", "Multiprocessor shutdown completed");
}

size_t Multiprocessor::get_optimal_thread_count() const {
    return optimal_thread_count_.load();
}

size_t Multiprocessor::calculate_optimal_chunk_size(size_t total_size) const {
    if (total_size == 0) {
        return 1;
    }
    
    size_t thread_count = optimal_thread_count_.load();
    
    // Ensure each thread gets at least one chunk
    size_t min_chunk_size = std::max(static_cast<size_t>(1), total_size / thread_count);
    
    // For very large datasets, limit chunk size to avoid memory issues
    size_t max_chunk_size = std::min(static_cast<size_t>(10000), total_size);
    
    // For small datasets, use smaller chunks for better load balancing
    if (total_size < thread_count * 10) {
        return std::max(static_cast<size_t>(1), total_size / thread_count);
    }
    
    return std::min(max_chunk_size, std::max(min_chunk_size, static_cast<size_t>(100)));
}

void Multiprocessor::record_operation(InternalOperationType type, 
                                     std::chrono::milliseconds duration, 
                                     bool success) {
    if (!enabled_.load()) {
        return;
    }
    
    std::lock_guard<std::mutex> lock(stats_mutex_);
    
    stats_.total_operations++;
    stats_.parallel_operations++;
    
    if (!success) {
        stats_.failed_operations++;
    }
    
    stats_.total_processing_time += duration;
    
    // Update per-operation statistics
    stats_.operation_counts[type]++;
    stats_.operation_times[type] += duration;
    
    // Calculate average processing time
    if (stats_.total_operations > 0) {
        stats_.avg_processing_time = std::chrono::milliseconds(
            stats_.total_processing_time.count() / stats_.total_operations
        );
    }
    
    // Calculate parallelization efficiency (simplified)
    if (stats_.parallel_operations > 0) {
        size_t thread_count = optimal_thread_count_.load();
        double theoretical_speedup = static_cast<double>(thread_count);
        double actual_speedup = static_cast<double>(stats_.total_operations) / 
                               static_cast<double>(stats_.parallel_operations);
        stats_.parallelization_efficiency = actual_speedup / theoretical_speedup;
    }
}

MultiprocessorStats Multiprocessor::get_stats() const {
    std::lock_guard<std::mutex> lock(stats_mutex_);
    return stats_;
}

} // namespace tasklets 