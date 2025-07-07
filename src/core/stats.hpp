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
 * @file stats.hpp
 * @brief Statistics collection and monitoring system
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <vector>
#include <cstdint>
#include <atomic>
#include <mutex>
#include <string>

namespace tasklets {

/**
 * @brief Statistics data structure for Tasklets scheduler
 * 
 * Contains comprehensive statistics about tasklet execution,
 * performance metrics, and system utilization.
 */
struct SchedulerStats {
    // =====================================================================
    // Tasklet Counts
    // =====================================================================
    
    /**
     * @brief Number of tasklets currently active (running or pending)
     */
    size_t active_threads;
    
    /**
     * @brief Total number of tasklets created since scheduler start
     */
    size_t total_threads_created;
    
    /**
     * @brief Number of tasklets that completed successfully
     */
    size_t completed_threads;
    
    /**
     * @brief Number of tasklets that failed with errors
     */
    size_t failed_threads;
    
    // =====================================================================
    // Worker Thread Information
    // =====================================================================
    
    /**
     * @brief Number of worker threads in the thread pool
     */
    size_t worker_threads;
    
    /**
     * @brief Utilization percentage for each worker thread
     */
    std::vector<size_t> worker_utilization;
    
    // =====================================================================
    // Performance Metrics
    // =====================================================================
    
    /**
     * @brief Total execution time across all tasklets (milliseconds)
     */
    uint64_t total_execution_time_ms;
    
    /**
     * @brief Average execution time per tasklet (milliseconds)
     */
    double average_execution_time_ms;
    
    /**
     * @brief Success rate (percentage of successful tasklets)
     */
    double success_rate;
    
    // =====================================================================
    // Constructor
    // =====================================================================
    
    /**
     * @brief Constructs a new SchedulerStats with default values
     */
    SchedulerStats() :
        active_threads(0),
        total_threads_created(0),
        completed_threads(0),
        failed_threads(0),
        worker_threads(0),
        total_execution_time_ms(0),
        average_execution_time_ms(0.0),
        success_rate(0.0) {
    }
    
    // =====================================================================
    // Utility Methods
    // =====================================================================
    
    /**
     * @brief Calculates derived statistics from raw counters
     */
    void calculate_derived_stats() {
        // Calculate success rate
        if (total_threads_created > 0) {
            success_rate = (static_cast<double>(completed_threads) / 
                          static_cast<double>(total_threads_created)) * 100.0;
        } else {
            success_rate = 0.0;
        }
        
        // Calculate average execution time
        if (completed_threads > 0) {
            average_execution_time_ms = static_cast<double>(total_execution_time_ms) / 
                                      static_cast<double>(completed_threads);
        } else {
            average_execution_time_ms = 0.0;
        }
    }
    
    /**
     * @brief Gets a string representation of the stats for debugging
     * @return Debug string
     */
    std::string to_string() const {
        return "SchedulerStats[active=" + std::to_string(active_threads) +
               ", total=" + std::to_string(total_threads_created) +
               ", completed=" + std::to_string(completed_threads) +
               ", failed=" + std::to_string(failed_threads) +
               ", success_rate=" + std::to_string(success_rate) + "%]";
    }
};

/**
 * @brief Thread-safe statistics collector for the scheduler
 * 
 * This class provides thread-safe methods to collect and retrieve
 * statistics about the scheduler's performance and tasklet execution.
 */
class StatsCollector {
public:
    /**
     * @brief Constructs a new StatsCollector
     */
    StatsCollector();
    
    /**
     * @brief Destructor
     */
    ~StatsCollector() = default;
    
    // Non-copyable and non-movable
    StatsCollector(const StatsCollector&) = delete;
    StatsCollector& operator=(const StatsCollector&) = delete;
    StatsCollector(StatsCollector&&) = delete;
    StatsCollector& operator=(StatsCollector&&) = delete;
    
    // =====================================================================
    // Statistics Collection
    // =====================================================================
    
    /**
     * @brief Records that a new tasklet was created
     */
    void record_thread_created();
    
    /**
     * @brief Records that a tasklet completed successfully
     * @param execution_time_ms The execution time in milliseconds
     */
    void record_thread_completed(uint64_t execution_time_ms);
    
    /**
     * @brief Records that a tasklet failed
     */
    void record_thread_failed();
    
    /**
     * @brief Updates the count of active tasklets
     * @param count The current number of active tasklets
     */
    void update_active_threads(size_t count);
    
    /**
     * @brief Sets the number of worker threads
     * @param count The number of worker threads
     */
    void set_worker_thread_count(size_t count);
    
    // =====================================================================
    // Statistics Retrieval
    // =====================================================================
    
    /**
     * @brief Gets the current statistics
     * @return SchedulerStats structure with current statistics
     */
    SchedulerStats get_stats() const;
    
    /**
     * @brief Resets all statistics to zero
     */
    void reset();

private:
    // Thread-safe counters
    mutable std::mutex stats_mutex_;
    std::atomic<uint64_t> total_threads_created_;
    std::atomic<uint64_t> completed_threads_;
    std::atomic<uint64_t> failed_threads_;
    std::atomic<uint64_t> total_execution_time_;
    std::atomic<size_t> active_threads_;
    std::atomic<size_t> worker_thread_count_;
};

} // namespace tasklets 