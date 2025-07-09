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
 * @file auto_scheduler.hpp
 * @brief Declares the AutoScheduler class, providing intelligent automatic optimization for MicroJob and NativeThreadPool based on runtime metrics and workload patterns.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <atomic>
#include <chrono>
#include <deque>
#include <mutex>
#include <thread>
#include <vector>
#include <functional>
#include <unordered_map>
#include <uv.h>
#include "../base/microjob.hpp"
#include "../threading/native_thread_pool.hpp"
#include "../monitoring/stats.hpp"
#include "../base/common_types.hpp"

namespace tasklets {

/**
 * @brief Performance metrics for auto-scheduling
 */
struct AutoSchedulerMetrics {
    // Queue metrics
    size_t queue_length;
    size_t active_jobs;
    size_t completed_jobs;
    size_t failed_jobs;
    
    // Timing metrics
    double avg_queue_wait_time_ms;
    double avg_execution_time_ms;
    double avg_total_time_ms;
    
    // Throughput metrics
    double jobs_per_second;
    double throughput_trend;
    
    // Worker metrics
    double worker_utilization;
    double worker_idle_time;
    size_t worker_count;
    
    // Load metrics
    double cpu_usage;
    double memory_usage;
    double load_balance_score;
    
    // Pattern detection
    WorkloadPattern detected_pattern;
    JobComplexity avg_complexity;
    
    uint64_t timestamp;
};

/**
 * @brief Auto-scheduling recommendations
 */
struct AutoSchedulerRecommendations {
    // Worker thread recommendations
    size_t recommended_worker_count;
    bool should_scale_up;
    bool should_scale_down;
    
    // Timeout recommendations
    long long recommended_timeout_ms;
    bool should_adjust_timeout;
    
    // Priority recommendations
    int recommended_priority;
    bool should_adjust_priority;
    
    // Batching recommendations
    size_t recommended_batch_size;
    bool should_batch;
    
    // Load balancing recommendations
    bool should_rebalance;
    std::vector<size_t> worker_assignments;
    
    // Confidence scores (0.0 to 1.0)
    double worker_scaling_confidence;
    double timeout_confidence;
    double priority_confidence;
    double batching_confidence;
    double load_balance_confidence;
};

/**
 * @brief Intelligent auto-scheduler for MicroJob and NativeThreadPool optimization
 */
class AutoScheduler {
public:
    /**
     * @brief Get singleton instance
     * @return Reference to the AutoScheduler instance
     */
    static AutoScheduler& get_instance();

    /**
     * @brief Initialize auto-scheduler with libuv loop
     * @param loop The libuv loop for timer management
     */
    void initialize(uv_loop_t* loop);

    /**
     * @brief Shutdown auto-scheduler
     */
    void shutdown();

    /**
     * @brief Enable or disable auto-scheduling
     * @param enabled Whether auto-scheduling should be active
     */
    void set_auto_scheduling_enabled(bool enabled);

    /**
     * @brief Check if auto-scheduling is enabled
     * @return True if auto-scheduling is active
     */
    bool is_auto_scheduling_enabled() const { return auto_scheduling_enabled_.load(); }

    /**
     * @brief Record job execution metrics
     * @param job The completed job
     */
    void record_job_metrics(const std::shared_ptr<MicroJob>& job);

    /**
     * @brief Get auto-scheduling recommendations
     * @return Current recommendations
     */
    AutoSchedulerRecommendations get_recommendations() const;

    /**
     * @brief Get performance metrics history
     * @return Vector of recent performance metrics
     */
    std::vector<AutoSchedulerMetrics> get_metrics_history() const;

    /**
     * @brief Force immediate analysis and recommendations
     */
    void force_analysis();

    /**
     * @brief Get detected workload pattern
     * @return Current workload pattern
     */
    WorkloadPattern get_detected_pattern() const;

    /**
     * @brief Get average job complexity
     * @return Average job complexity
     */
    JobComplexity get_avg_complexity() const;

    /**
     * @brief Set auto-scheduling strategy
     * @param strategy The strategy to use
     */
    enum class AutoSchedulingStrategy {
        CONSERVATIVE,  // Small, gradual changes
        MODERATE,      // Balanced changes
        AGGRESSIVE     // Larger, faster changes
    };
    
    void set_strategy(AutoSchedulingStrategy strategy);

    /**
     * @brief Get current strategy
     * @return Current auto-scheduling strategy
     */
    AutoSchedulingStrategy get_strategy() const { return strategy_; }

    /**
     * @brief Register callback for recommendations
     * @param callback Function to call when recommendations change
     */
    void register_recommendation_callback(std::function<void(const AutoSchedulerRecommendations&)> callback);

private:
    AutoScheduler();
    ~AutoScheduler();
    AutoScheduler(const AutoScheduler&) = delete;
    AutoScheduler& operator=(const AutoScheduler&) = delete;

    /**
     * @brief Main auto-scheduling analysis logic
     */
    void perform_analysis();

    /**
     * @brief Collect current performance metrics
     * @return Current performance metrics
     */
    AutoSchedulerMetrics collect_metrics();

    /**
     * @brief Analyze workload patterns
     * @param metrics Performance metrics
     * @return Detected workload pattern
     */
    WorkloadPattern analyze_workload_pattern(const AutoSchedulerMetrics& metrics);

    /**
     * @brief Estimate job complexity
     * @param execution_time_ms Job execution time
     * @return Estimated complexity
     */
    JobComplexity estimate_complexity(double execution_time_ms);

    /**
     * @brief Generate auto-scheduling recommendations
     * @param metrics Performance metrics
     * @return Recommendations
     */
    AutoSchedulerRecommendations generate_recommendations(const AutoSchedulerMetrics& metrics);

    /**
     * @brief Calculate worker scaling recommendations
     * @param metrics Performance metrics
     * @return Worker scaling recommendations
     */
    struct WorkerScalingRecommendation {
        size_t recommended_count;
        bool should_scale_up;
        bool should_scale_down;
        double confidence;
    };
    
    WorkerScalingRecommendation calculate_worker_scaling(const AutoSchedulerMetrics& metrics);

    /**
     * @brief Calculate timeout recommendations
     * @param metrics Performance metrics
     * @return Timeout recommendations
     */
    struct TimeoutRecommendation {
        long long recommended_timeout_ms;
        bool should_adjust;
        double confidence;
    };
    
    TimeoutRecommendation calculate_timeout_adjustment(const AutoSchedulerMetrics& metrics);

    /**
     * @brief Calculate priority recommendations
     * @param metrics Performance metrics
     * @return Priority recommendations
     */
    struct PriorityRecommendation {
        int recommended_priority;
        bool should_adjust;
        double confidence;
    };
    
    PriorityRecommendation calculate_priority_adjustment(const AutoSchedulerMetrics& metrics);

    /**
     * @brief Calculate batching recommendations
     * @param metrics Performance metrics
     * @return Batching recommendations
     */
    struct BatchingRecommendation {
        size_t recommended_batch_size;
        bool should_batch;
        double confidence;
    };
    
    BatchingRecommendation calculate_batching_recommendation(const AutoSchedulerMetrics& metrics);

    /**
     * @brief Calculate load balancing recommendations
     * @param metrics Performance metrics
     * @return Load balancing recommendations
     */
    struct LoadBalanceRecommendation {
        bool should_rebalance;
        std::vector<size_t> worker_assignments;
        double confidence;
    };
    
    LoadBalanceRecommendation calculate_load_balance_recommendation(const AutoSchedulerMetrics& metrics);

    /**
     * @brief Timer callback for periodic analysis
     * @param handle libuv timer handle
     */
    static void timer_callback(uv_timer_t* handle);

    /**
     * @brief Calculate adjustment magnitude based on strategy
     * @param base_adjustment Base adjustment value
     * @return Adjusted value based on strategy
     */
    double calculate_adjustment_magnitude(double base_adjustment) const;

    // Configuration and state
    std::atomic<bool> auto_scheduling_enabled_;
    std::atomic<bool> is_initialized_;
    AutoSchedulingStrategy strategy_;
    
    // Performance tracking
    mutable std::mutex metrics_mutex_;
    std::deque<AutoSchedulerMetrics> metrics_history_;
    std::deque<std::shared_ptr<MicroJob>> job_history_;
    
    // Recommendations tracking
    mutable std::mutex recommendations_mutex_;
    AutoSchedulerRecommendations current_recommendations_;
    std::chrono::steady_clock::time_point last_analysis_time_;
    
    // Timer management
    uv_timer_t analysis_timer_;
    uint32_t analysis_interval_ms_;
    
    // Callbacks
    mutable std::mutex callback_mutex_;
    std::vector<std::function<void(const AutoSchedulerRecommendations&)>> recommendation_callbacks_;
    
    // References to other components
    std::shared_ptr<StatsCollector> stats_collector_;
    
    // Constants
    static constexpr size_t MAX_METRICS_HISTORY = 100;
    static constexpr size_t MAX_JOB_HISTORY = 1000;
    static constexpr uint32_t DEFAULT_ANALYSIS_INTERVAL_MS = 5000;
};

} // namespace tasklets 