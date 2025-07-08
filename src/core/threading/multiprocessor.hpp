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
 * @file multiprocessor.hpp
 * @brief Internal multiprocessing system for core functions that benefit from parallel processing
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <atomic>
#include <chrono>
#include <deque>
#include <future>
#include <mutex>
#include <thread>
#include <vector>
#include <functional>
#include <unordered_map>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <memory>
#include "../base/logger.hpp"

namespace tasklets {

/**
 * @brief Types of internal operations that can be parallelized
 */
enum class InternalOperationType {
    METRICS_ANALYSIS,           // Analysis of performance metrics
    STATISTICS_PROCESSING,      // Statistical calculations
    PATTERN_DETECTION,          // Workload pattern analysis
    COMPLEXITY_ESTIMATION,      // Job complexity estimation
    RECOMMENDATION_GENERATION,  // Configuration recommendations
    HISTORICAL_ANALYSIS,        // Historical data analysis
    LOAD_BALANCING_CALC,        // Load balancing calculations
    MEMORY_ANALYSIS,            // Memory usage analysis
    THROUGHPUT_CALCULATION,     // Throughput calculations
    UTILIZATION_ANALYSIS        // Resource utilization analysis
};

/**
 * @brief Internal operation task structure
 */
struct InternalTask {
    InternalOperationType type;
    std::function<void()> task;
    std::chrono::steady_clock::time_point created_at;
    std::chrono::steady_clock::time_point started_at;
    std::chrono::steady_clock::time_point completed_at;
    bool is_completed;
    std::string error_message;
    
    InternalTask(InternalOperationType op_type, std::function<void()> task_func)
        : type(op_type), task(std::move(task_func)), created_at(std::chrono::steady_clock::now()),
          is_completed(false) {}
};

/**
 * @brief Parallel processing result
 */
template<typename T>
struct ParallelResult {
    std::vector<T> results;
    std::chrono::milliseconds processing_time;
    size_t items_processed;
    bool success;
    std::string error_message;
    
    ParallelResult() : processing_time(0), items_processed(0), success(false) {}
};

/**
 * @brief Multiprocessor statistics
 */
struct MultiprocessorStats {
    size_t total_operations;
    size_t parallel_operations;
    size_t sequential_operations;
    size_t failed_operations;
    std::chrono::milliseconds total_processing_time;
    std::chrono::milliseconds avg_processing_time;
    double parallelization_efficiency;
    
    // Per-operation type statistics
    std::unordered_map<InternalOperationType, size_t> operation_counts;
    std::unordered_map<InternalOperationType, std::chrono::milliseconds> operation_times;
    
    MultiprocessorStats() : total_operations(0), parallel_operations(0), 
                           sequential_operations(0), failed_operations(0),
                           total_processing_time(0), avg_processing_time(0),
                           parallelization_efficiency(0.0) {}
};

/**
 * @brief Internal multiprocessing system
 * 
 * This system provides parallel processing capabilities for internal core functions
 * that can benefit from multiprocessing, such as:
 * - Metrics analysis and pattern detection
 * - Statistical calculations
 * - Historical data processing
 * - Load balancing calculations
 * - Memory usage analysis
 * - Throughput calculations
 */
class Multiprocessor {
public:
    Multiprocessor();
    ~Multiprocessor();
    /**
     * @brief Get singleton instance
     * @return Reference to the Multiprocessor instance
     */
    static Multiprocessor& get_instance();
    
    /**
     * @brief Initialize multiprocessor with optimal thread count
     */
    void initialize();
    
    /**
     * @brief Shutdown multiprocessor
     */
    void shutdown();
    
    /**
     * @brief Process data in parallel using multiple threads
     * @param data Vector of data to process
     * @param processor Function to process each item
     * @param chunk_size Size of each processing chunk
     * @return ParallelResult with processed data
     */
    template<typename T, typename Processor>
    ParallelResult<T> process_parallel(const std::vector<T>& data, 
                                      Processor processor,
                                      size_t chunk_size = 0) {
        if (data.empty()) {
            return ParallelResult<T>();
        }
        
        auto start_time = std::chrono::steady_clock::now();
        
        // Auto-determine chunk size if not specified
        if (chunk_size == 0) {
            chunk_size = calculate_optimal_chunk_size(data.size());
        }
        
        // Split data into chunks
        std::vector<std::vector<T>> chunks = split_into_chunks(data, chunk_size);
        
        // Process chunks in parallel
        std::vector<std::future<std::vector<T>>> futures;
        for (const auto& chunk : chunks) {
            futures.push_back(
                std::async(std::launch::async, [&chunk, &processor]() {
                    std::vector<T> results;
                    results.reserve(chunk.size());
                    for (const auto& item : chunk) {
                        results.push_back(processor(item));
                    }
                    return results;
                })
            );
        }
        
        // Collect results
        std::vector<T> all_results;
        all_results.reserve(data.size());
        
        for (auto& future : futures) {
            try {
                auto chunk_results = future.get();
                all_results.insert(all_results.end(), 
                                 chunk_results.begin(), chunk_results.end());
            } catch (const std::exception& e) {
                Logger::error("Multiprocessor", "Parallel processing failed: " + std::string(e.what()));
                return ParallelResult<T>();
            }
        }
        
        auto end_time = std::chrono::steady_clock::now();
        auto processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        ParallelResult<T> result;
        result.results = std::move(all_results);
        result.processing_time = processing_time;
        result.items_processed = data.size();
        result.success = true;
        
        record_operation(InternalOperationType::STATISTICS_PROCESSING, processing_time, true);
        
        return result;
    }
    
    /**
     * @brief Process data with map-reduce pattern
     * @param data Vector of data to process
     * @param mapper Function to map each item
     * @param reducer Function to reduce results
     * @param initial_value Initial value for reduction
     * @return Reduced result
     */
    template<typename T, typename U, typename Mapper, typename Reducer>
    U map_reduce(const std::vector<T>& data, 
                 Mapper mapper, 
                 Reducer reducer, 
                 U initial_value) {
        if (data.empty()) {
            return initial_value;
        }
        
        auto start_time = std::chrono::steady_clock::now();
        
        size_t chunk_size = calculate_optimal_chunk_size(data.size());
        std::vector<std::vector<T>> chunks = split_into_chunks(data, chunk_size);
        
        // Map phase - process chunks in parallel
        std::vector<std::future<std::vector<U>>> map_futures;
        for (const auto& chunk : chunks) {
            map_futures.push_back(
                std::async(std::launch::async, [&chunk, &mapper]() {
                    std::vector<U> mapped;
                    mapped.reserve(chunk.size());
                    for (const auto& item : chunk) {
                        mapped.push_back(mapper(item));
                    }
                    return mapped;
                })
            );
        }
        
        // Collect mapped results
        std::vector<U> mapped_results;
        for (auto& future : map_futures) {
            try {
                auto chunk_mapped = future.get();
                mapped_results.insert(mapped_results.end(), 
                                    chunk_mapped.begin(), chunk_mapped.end());
            } catch (const std::exception& e) {
                Logger::error("Multiprocessor", "Map phase failed: " + std::string(e.what()));
                return initial_value;
            }
        }
        
        // Reduce phase - sequential reduction
        U result = initial_value;
        for (const auto& mapped_item : mapped_results) {
            result = reducer(result, mapped_item);
        }
        
        auto end_time = std::chrono::steady_clock::now();
        auto processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        record_operation(InternalOperationType::STATISTICS_PROCESSING, processing_time, true);
        
        return result;
    }
    
    /**
     * @brief Execute multiple independent tasks in parallel
     * @param tasks Vector of tasks to execute
     * @return Vector of results
     */
    template<typename T>
    std::vector<T> execute_parallel(const std::vector<std::function<T()>>& tasks) {
        if (tasks.empty()) {
            return std::vector<T>();
        }
        
        auto start_time = std::chrono::steady_clock::now();
        
        std::vector<std::future<T>> futures;
        futures.reserve(tasks.size());
        
        for (const auto& task : tasks) {
            futures.push_back(std::async(std::launch::async, task));
        }
        
        std::vector<T> results;
        results.reserve(tasks.size());
        
        for (auto& future : futures) {
            try {
                results.push_back(future.get());
            } catch (const std::exception& e) {
                Logger::error("Multiprocessor", "Parallel execution failed: " + std::string(e.what()));
                return std::vector<T>();
            }
        }
        
        auto end_time = std::chrono::steady_clock::now();
        auto processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        record_operation(InternalOperationType::METRICS_ANALYSIS, processing_time, true);
        
        return results;
    }
    
    /**
     * @brief Calculate statistics in parallel
     * @param data Vector of numeric data
     * @return Statistics object
     */
    template<typename T>
    struct Statistics {
        T min_value;
        T max_value;
        T mean;
        T median;
        T standard_deviation;
        T variance;
        size_t count;
    };
    
    template<typename T>
    Statistics<T> calculate_statistics_parallel(const std::vector<T>& data) {
        if (data.empty()) {
            return Statistics<T>();
        }
        
        auto start_time = std::chrono::steady_clock::now();
        
        // Calculate basic statistics in parallel
        auto min_max = std::async(std::launch::async, [&data]() {
            auto [min_it, max_it] = std::minmax_element(data.begin(), data.end());
            return std::make_pair(*min_it, *max_it);
        });
        
        auto sum_count = std::async(std::launch::async, [&data]() {
            T sum = std::accumulate(data.begin(), data.end(), T{});
            return std::make_pair(sum, data.size());
        });
        
        auto sorted_data = std::async(std::launch::async, [&data]() {
            std::vector<T> sorted = data;
            std::sort(sorted.begin(), sorted.end());
            return sorted;
        });
        
        // Wait for parallel calculations
        auto [min_val, max_val] = min_max.get();
        auto [sum, count] = sum_count.get();
        auto sorted = sorted_data.get();
        
        // Calculate derived statistics
        T mean = sum / static_cast<T>(count);
        T median = (count % 2 == 0) ? 
            (sorted[count/2 - 1] + sorted[count/2]) / T{2} : 
            sorted[count/2];
        
        // Calculate variance and standard deviation
        T variance = map_reduce(data, 
            [mean](T x) { return (x - mean) * (x - mean); },
            [](T acc, T val) { return acc + val; },
            T{}) / static_cast<T>(count);
        
        T std_dev = std::sqrt(variance);
        
        auto end_time = std::chrono::steady_clock::now();
        auto processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        record_operation(InternalOperationType::STATISTICS_PROCESSING, processing_time, true);
        
        return Statistics<T>{min_val, max_val, mean, median, std_dev, variance, count};
    }
    
    /**
     * @brief Get multiprocessor statistics
     * @return MultiprocessorStats object
     */
    MultiprocessorStats get_stats() const;
    
    /**
     * @brief Check if multiprocessor is enabled
     * @return True if enabled
     */
    bool is_enabled() const { return enabled_.load(); }
    
    /**
     * @brief Enable or disable multiprocessor
     * @param enabled Whether to enable multiprocessing
     */
    void set_enabled(bool enabled) { enabled_.store(enabled); }
    
    /**
     * @brief Get optimal thread count for current system
     * @return Optimal number of threads
     */
    size_t get_optimal_thread_count() const;
    
    /**
     * @brief Get number of available processes/threads for batch processing
     * @return Number of processes available for batch operations
     */
    size_t get_process_count() const { return optimal_thread_count_.load(); }

private:
    Multiprocessor(const Multiprocessor&) = delete;
    Multiprocessor& operator=(const Multiprocessor&) = delete;
    
    /**
     * @brief Calculate optimal chunk size for parallel processing
     * @param total_size Total number of items
     * @return Optimal chunk size
     */
    size_t calculate_optimal_chunk_size(size_t total_size) const;
    
    /**
     * @brief Split data into chunks for parallel processing
     * @param data Data to split
     * @param chunk_size Size of each chunk
     * @return Vector of chunks
     */
    template<typename T>
    std::vector<std::vector<T>> split_into_chunks(const std::vector<T>& data, size_t chunk_size) const {
        std::vector<std::vector<T>> chunks;
        size_t total_size = data.size();
        
        for (size_t i = 0; i < total_size; i += chunk_size) {
            size_t end = std::min(i + chunk_size, total_size);
            chunks.emplace_back(data.begin() + i, data.begin() + end);
        }
        
        return chunks;
    }
    
    /**
     * @brief Record operation statistics
     * @param type Operation type
     * @param duration Processing duration
     * @param success Whether operation succeeded
     */
    void record_operation(InternalOperationType type, 
                         std::chrono::milliseconds duration, 
                         bool success);
    
    // Member variables
    std::atomic<bool> enabled_;
    std::atomic<bool> initialized_;
    std::atomic<size_t> optimal_thread_count_;
    
    mutable std::mutex stats_mutex_;
    MultiprocessorStats stats_;
    
    // Singleton
    static std::unique_ptr<Multiprocessor> instance_;
    static std::mutex instance_mutex_;
};

} // namespace tasklets 