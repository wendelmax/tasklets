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
 * @file auto_config.hpp
 * @brief Unified automatic configuration system that combines adaptive configuration and auto-scheduler into a single, fully automatic system.
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
#include "../base/logger.hpp"
#include "../threading/multiprocessor.hpp"
#include "../base/common_types.hpp"

namespace tasklets {

/**
 * @brief Comprehensive performance metrics
 */
struct AutoConfigMetrics {
    // System metrics
    double cpu_utilization;
    double memory_usage_percent;
    double worker_utilization;
    double throughput_tasks_per_sec;
    double average_execution_time_ms;
    double success_rate;
    
    // Queue metrics
    size_t queue_length;
    size_t active_jobs;
    size_t completed_jobs;
    size_t failed_jobs;
    size_t active_tasklets;
    size_t queued_tasklets;
    
    // Timing metrics
    double avg_queue_wait_time_ms;
    double avg_total_time_ms;
    double throughput_trend;
    
    // Worker metrics
    double worker_idle_time;
    size_t worker_count;
    
    // Load metrics
    double load_balance_score;
    
    // Pattern detection
    WorkloadPattern detected_pattern;
    JobComplexity avg_complexity;
    
    uint64_t timestamp;
};

/**
 * @brief Automatic configuration recommendations
 */
struct AutoConfigRecommendations {
    // Worker thread recommendations
    size_t recommended_worker_count;
    bool should_scale_up;
    bool should_scale_down;
    double worker_scaling_confidence;
    
    // Memory recommendations
    double recommended_memory_limit_percent;
    bool should_adjust_memory;
    double memory_confidence;
    
    // Timeout recommendations
    long long recommended_timeout_ms;
    bool should_adjust_timeout;
    double timeout_confidence;
    
    // Priority recommendations
    int recommended_priority;
    bool should_adjust_priority;
    double priority_confidence;
    
    // Batching recommendations
    size_t recommended_batch_size;
    bool should_batch;
    double batching_confidence;
    
    // Pool recommendations
    size_t recommended_pool_initial_size;
    size_t recommended_pool_max_size;
    bool should_adjust_pools;
    double pool_confidence;
    
    // Cleanup recommendations
    uint32_t recommended_cleanup_interval_ms;
    bool should_adjust_cleanup;
    double cleanup_confidence;
    
    // Load balancing recommendations
    bool should_rebalance;
    std::vector<size_t> worker_assignments;
    double load_balance_confidence;
    
    // Overall confidence
    double overall_confidence;
};

/**
 * @brief Configuration adjustment strategy
 */
enum class AutoConfigStrategy {
    CONSERVATIVE,  // Small, gradual changes
    MODERATE,      // Balanced changes
    AGGRESSIVE     // Larger, faster changes
};

/**
 * @brief Unified automatic configuration system
 * 
 * This system automatically handles all configuration aspects:
 * - Worker thread scaling
 * - Memory management
 * - Timeout optimization
 * - Priority management
 * - Batching strategies
 * - Pool sizing
 * - Load balancing
 * - Cleanup intervals
 * 
 * No manual configuration required - everything is automatic.
 */
class AutoConfig {
public:
    /**
     * @brief Get singleton instance
     * @return Reference to the AutoConfig instance
     */
    static AutoConfig& get_instance();

    /**
     * @brief Initialize auto-configuration with libuv loop
     * @param loop The libuv loop for timer management
     */
    void initialize(uv_loop_t* loop);

    /**
     * @brief Shutdown auto-configuration
     */
    void shutdown();

    /**
     * @brief Enable or disable auto-configuration
     * @param enabled Whether auto-configuration should be active
     */
    void set_auto_config_enabled(bool enabled);

    /**
     * @brief Check if auto-configuration is enabled
     * @return True if auto-configuration is active
     */
    bool is_auto_config_enabled() const { return auto_config_enabled_.load(); }

    /**
     * @brief Record job execution metrics
     * @param job The completed job
     */
    void record_job_metrics(const std::shared_ptr<MicroJob>& job);

    /**
     * @brief Record batch processing pattern for optimization
     * @param batch_size Size of the batch being processed
     * 
     * This method helps the auto-configuration system understand
     * batch processing patterns and optimize accordingly.
     */
    void record_batch_pattern(size_t batch_size);

    /**
     * @brief Get current auto-configuration recommendations
     * @return Current recommendations
     */
    AutoConfigRecommendations get_recommendations() const;

    /**
     * @brief Get performance metrics history
     * @return Vector of recent performance metrics
     */
    std::vector<AutoConfigMetrics> get_metrics_history() const;

    /**
     * @brief Force immediate analysis and recommendations
     */
    void force_analysis();

    /**
     * @brief Notify that a job completed (called from thread pool). May trigger deferred analysis.
     */
    void notify_job_completed();

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
     * @brief Set auto-configuration strategy
     * @param strategy The strategy to use
     */
    void set_strategy(AutoConfigStrategy strategy);

    /**
     * @brief Get current strategy
     * @return Current auto-configuration strategy
     */
    AutoConfigStrategy get_strategy() const { return strategy_; }

    /**
     * @brief Get last adjustment information
     * @return Information about the last configuration adjustment
     */
    struct AdjustmentInfo {
        std::string reason;
        std::string changes_made;
        double performance_impact;
        uint64_t timestamp;
    };
    
    AdjustmentInfo get_last_adjustment() const;

    /**
     * @brief Register callback for configuration changes
     * @param callback Function to call when configuration changes
     */
    void register_adjustment_callback(std::function<void(const AutoConfigRecommendations&)> callback);

    /**
     * @brief Get comprehensive auto-configuration settings
     * @return Current settings and state
     */
    struct AutoConfigSettings {
        bool is_enabled;
        AutoConfigStrategy strategy;
        AutoConfigRecommendations recommendations;
        std::vector<AutoConfigMetrics> metrics_history;
        AdjustmentInfo last_adjustment;
    };
    
    AutoConfigSettings get_settings() const;

    AutoConfig();
    ~AutoConfig();
    AutoConfig(const AutoConfig&) = delete;
    AutoConfig& operator=(const AutoConfig&) = delete;

private:
    static std::unique_ptr<AutoConfig> instance_;
    static std::mutex instance_mutex_;
    /**
     * @brief Main auto-configuration analysis logic
     */
    void perform_analysis();

    /**
     * @brief Collect current performance metrics
     * @return Current performance metrics
     */
    AutoConfigMetrics collect_metrics();

    /**
     * @brief Analyze workload patterns
     * @param metrics Performance metrics
     * @return Detected workload pattern
     */
    WorkloadPattern analyze_workload_pattern(const AutoConfigMetrics& metrics);

    /**
     * @brief Estimate job complexity
     * @param execution_time_ms Job execution time
     * @return Estimated complexity
     */
    JobComplexity estimate_complexity(double execution_time_ms);

    /**
     * @brief Generate comprehensive auto-configuration recommendations
     * @param metrics Performance metrics
     * @return Recommendations
     */
    AutoConfigRecommendations generate_recommendations(const AutoConfigMetrics& metrics);

    /**
     * @brief Apply recommendations automatically
     * @param recommendations The recommendations to apply
     */
    void apply_recommendations(const AutoConfigRecommendations& recommendations);

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
    
    WorkerScalingRecommendation calculate_worker_scaling(const AutoConfigMetrics& metrics);

    /**
     * @brief Calculate memory recommendations
     * @param metrics Performance metrics
     * @return Memory recommendations
     */
    struct MemoryRecommendation {
        double recommended_limit_percent;
        bool should_adjust;
        double confidence;
    };
    
    MemoryRecommendation calculate_memory_adjustment(const AutoConfigMetrics& metrics);

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
    
    TimeoutRecommendation calculate_timeout_adjustment(const AutoConfigMetrics& metrics);

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
    
    PriorityRecommendation calculate_priority_adjustment(const AutoConfigMetrics& metrics);

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
    
    BatchingRecommendation calculate_batching_recommendation(const AutoConfigMetrics& metrics);

    /**
     * @brief Calculate pool recommendations
     * @param metrics Performance metrics
     * @return Pool recommendations
     */
    struct PoolRecommendation {
        size_t recommended_initial_size;
        size_t recommended_max_size;
        bool should_adjust;
        double confidence;
    };
    
    PoolRecommendation calculate_pool_recommendation(const AutoConfigMetrics& metrics);

    /**
     * @brief Calculate cleanup recommendations
     * @param metrics Performance metrics
     * @return Cleanup recommendations
     */
    struct CleanupRecommendation {
        uint32_t recommended_interval_ms;
        bool should_adjust;
        double confidence;
    };
    
    CleanupRecommendation calculate_cleanup_recommendation(const AutoConfigMetrics& metrics);

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
    
    LoadBalanceRecommendation calculate_load_balance_recommendation(const AutoConfigMetrics& metrics);

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
    
    // Multiprocessing-enhanced analysis methods
    AutoConfigMetrics collect_metrics_parallel();
    
    WorkloadPattern analyze_workload_pattern_parallel(const AutoConfigMetrics& metrics);
    
    AutoConfigRecommendations generate_recommendations_parallel(const AutoConfigMetrics& metrics);
    
    std::vector<double> analyze_historical_trends_parallel();
    
    std::vector<JobComplexity> estimate_complexities_parallel(const std::vector<double>& execution_times);

    // Configuration and state
    std::atomic<bool> auto_config_enabled_;
    std::atomic<bool> is_initialized_;
    AutoConfigStrategy strategy_;
    
    // Performance tracking
    mutable std::mutex metrics_mutex_;
    std::deque<AutoConfigMetrics> metrics_history_;
    std::deque<std::shared_ptr<MicroJob>> job_history_;
    
    // Recommendations tracking
    mutable std::mutex recommendations_mutex_;
    AutoConfigRecommendations current_recommendations_;
    std::chrono::steady_clock::time_point last_analysis_time_;
    
    // Adjustment tracking
    mutable std::mutex adjustment_mutex_;
    AdjustmentInfo last_adjustment_;
    
    // Timer management
    uv_timer_t analysis_timer_;
    uv_async_t analysis_async_;
    uint32_t analysis_interval_ms_;
    static constexpr unsigned int JOB_TRIGGERED_ANALYSIS_INTERVAL = 50;
    std::atomic<unsigned int> completed_jobs_since_analysis_{0};

    static void analysis_async_callback(uv_async_t* handle);

    // Callbacks
    mutable std::mutex callback_mutex_;
    std::vector<std::function<void(const AutoConfigRecommendations&)>> adjustment_callbacks_;
    
    // References to other components
    std::shared_ptr<StatsCollector> stats_collector_;
    
    // Constants
    static constexpr size_t MAX_METRICS_HISTORY = 100;
    static constexpr size_t MAX_JOB_HISTORY = 1000;
    static constexpr uint32_t DEFAULT_ANALYSIS_INTERVAL_MS = 5000;
};

} // namespace tasklets 