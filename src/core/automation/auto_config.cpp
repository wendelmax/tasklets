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
 * @file auto_config.cpp
 * @brief Implementation of the unified automatic configuration system with multiprocessing capabilities
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "auto_config.hpp"
#include "../threading/multiprocessor.hpp"
#include <algorithm>
#include <cmath>
#include <sstream>
#include <unistd.h>
#include <sys/sysinfo.h>

namespace tasklets {

// =====================================================================
// Static Member Initialization
// =====================================================================

std::unique_ptr<AutoConfig> AutoConfig::instance_;
std::mutex AutoConfig::instance_mutex_;

// =====================================================================
// AutoConfig Implementation
// =====================================================================

AutoConfig::AutoConfig()
    : auto_config_enabled_(true)
    , is_initialized_(false)
    , strategy_(AutoConfigStrategy::MODERATE)
    , analysis_interval_ms_(DEFAULT_ANALYSIS_INTERVAL_MS)
    , stats_collector_(std::make_shared<StatsCollector>()) {
    
    // Initialize multiprocessor
    Multiprocessor::get_instance().initialize();
    
    Logger::info("AutoConfig", "AutoConfig system initialized");
}

AutoConfig::~AutoConfig() {
    shutdown();
}

AutoConfig& AutoConfig::get_instance() {
    std::lock_guard<std::mutex> lock(instance_mutex_);
    if (!instance_) {
        instance_ = std::make_unique<AutoConfig>();
    }
    return *instance_;
}

void AutoConfig::initialize(uv_loop_t* loop) {
    if (is_initialized_.load()) {
        return;
    }
    
    // Initialize multiprocessor
    Multiprocessor::get_instance().initialize();
    
    // Set up timer for periodic analysis
    uv_timer_init(loop, &analysis_timer_);
    analysis_timer_.data = this;
    
    int result = uv_timer_start(&analysis_timer_, timer_callback, 
                               analysis_interval_ms_, analysis_interval_ms_);
    if (result != 0) {
        Logger::error("AutoConfig", "Failed to start analysis timer");
        return;
    }
    
    is_initialized_.store(true);
    Logger::info("AutoConfig", "AutoConfig initialized with multiprocessing support");
}

void AutoConfig::shutdown() {
    if (!is_initialized_.load()) {
        return;
    }
    
    uv_timer_stop(&analysis_timer_);
    is_initialized_.store(false);
    
    Logger::info("AutoConfig", "AutoConfig shutdown completed");
}

void AutoConfig::set_auto_config_enabled(bool enabled) {
    auto_config_enabled_.store(enabled);
    Logger::info("AutoConfig", "Auto-configuration " + std::string(enabled ? "enabled" : "disabled"));
}

void AutoConfig::record_job_metrics(const std::shared_ptr<MicroJob>& job) {
    if (!auto_config_enabled_.load()) {
        return;
    }
    
    std::lock_guard<std::mutex> lock(metrics_mutex_);
    
    // Add job to history
    job_history_.push_back(job);
    
    // Maintain history size
    if (job_history_.size() > MAX_JOB_HISTORY) {
        job_history_.pop_front();
    }
}

void AutoConfig::record_batch_pattern(size_t batch_size) {
    if (!auto_config_enabled_.load()) {
        return;
    }
    
    std::lock_guard<std::mutex> lock(metrics_mutex_);
    
    // Record batch pattern for analysis
    // This helps the system understand batch processing patterns
    // and optimize worker thread allocation and memory management
    
    // Update current metrics with batch information
    if (!metrics_history_.empty()) {
        auto& current_metrics = metrics_history_.back();
        
        // Adjust workload pattern detection for batch processing
        if (batch_size > 1000) {
            current_metrics.detected_pattern = WorkloadPattern::BURST;
        } else if (batch_size > 100) {
            current_metrics.detected_pattern = WorkloadPattern::MIXED;
        }
        
        // Update queue metrics
        current_metrics.queued_tasklets += batch_size;
        current_metrics.active_tasklets += batch_size;
    }
    
    Logger::debug("AutoConfig", "Recorded batch pattern with size: " + std::to_string(batch_size));
}

AutoConfigRecommendations AutoConfig::get_recommendations() const {
    std::lock_guard<std::mutex> lock(recommendations_mutex_);
    return current_recommendations_;
}

std::vector<AutoConfigMetrics> AutoConfig::get_metrics_history() const {
    std::lock_guard<std::mutex> lock(metrics_mutex_);
    return std::vector<AutoConfigMetrics>(metrics_history_.begin(), metrics_history_.end());
}

void AutoConfig::force_analysis() {
    if (!auto_config_enabled_.load()) {
        return;
    }
    
    perform_analysis();
}

WorkloadPattern AutoConfig::get_detected_pattern() const {
    std::lock_guard<std::mutex> lock(metrics_mutex_);
    if (metrics_history_.empty()) {
        return WorkloadPattern::MIXED;
    }
    return metrics_history_.back().detected_pattern;
}

JobComplexity AutoConfig::get_avg_complexity() const {
    std::lock_guard<std::mutex> lock(metrics_mutex_);
    if (metrics_history_.empty()) {
        return JobComplexity::MODERATE;
    }
    return metrics_history_.back().avg_complexity;
}

void AutoConfig::set_strategy(AutoConfigStrategy strategy) {
    strategy_ = strategy;
    Logger::info("AutoConfig", "Strategy set to " + std::to_string(static_cast<int>(strategy)));
}

AutoConfig::AdjustmentInfo AutoConfig::get_last_adjustment() const {
    std::lock_guard<std::mutex> lock(adjustment_mutex_);
    return last_adjustment_;
}

void AutoConfig::register_adjustment_callback(std::function<void(const AutoConfigRecommendations&)> callback) {
    std::lock_guard<std::mutex> lock(callback_mutex_);
    adjustment_callbacks_.push_back(callback);
}

AutoConfig::AutoConfigSettings AutoConfig::get_settings() const {
    std::lock_guard<std::mutex> lock(recommendations_mutex_);
    std::lock_guard<std::mutex> lock2(metrics_mutex_);
    std::lock_guard<std::mutex> lock3(adjustment_mutex_);
    
    AutoConfigSettings settings;
    settings.is_enabled = auto_config_enabled_.load();
    settings.strategy = strategy_;
    settings.recommendations = current_recommendations_;
    settings.metrics_history = std::vector<AutoConfigMetrics>(metrics_history_.begin(), metrics_history_.end());
    settings.last_adjustment = last_adjustment_;
    
    return settings;
}

// =====================================================================
// Multiprocessing-Enhanced Analysis Methods
// =====================================================================

AutoConfigMetrics AutoConfig::collect_metrics_parallel() {
    auto& multiprocessor = Multiprocessor::get_instance();
    
    // Collect system metrics in parallel
    auto system_metrics = std::async(std::launch::async, [this]() {
        AutoConfigMetrics metrics;
        
        // Get system memory info
        struct sysinfo si;
        if (sysinfo(&si) == 0) {
            double total_mem = static_cast<double>(si.totalram) / (1024 * 1024 * 1024); // GB
            double free_mem = static_cast<double>(si.freeram) / (1024 * 1024 * 1024); // GB
            metrics.memory_usage_percent = ((total_mem - free_mem) / total_mem) * 100.0;
        } else {
            metrics.memory_usage_percent = 50.0; // Default fallback
        }
        
        // Get CPU utilization (simplified)
        metrics.cpu_utilization = 50.0; // Placeholder - would need more sophisticated CPU monitoring
        
        return metrics;
    });
    
    // Collect thread pool metrics in parallel
    auto thread_pool_metrics = std::async(std::launch::async, [this]() {
        AutoConfigMetrics metrics;
        
        auto stats = NativeThreadPool::get_instance().get_stats();
        metrics.worker_count = stats.worker_threads;
        metrics.active_jobs = stats.active_threads;
        metrics.completed_jobs = stats.completed_threads;
        metrics.failed_jobs = stats.failed_threads;
        metrics.worker_utilization = static_cast<double>(stats.active_threads) / stats.worker_threads;
        
        return metrics;
    });
    
    // Collect timing metrics in parallel
    auto timing_metrics = std::async(std::launch::async, [this, &multiprocessor]() {
        AutoConfigMetrics metrics;
        
        std::lock_guard<std::mutex> lock(metrics_mutex_);
        
        if (!job_history_.empty()) {
            // Calculate average execution time
            std::vector<double> execution_times;
            for (const auto& job : job_history_) {
                if (job->execution_duration > 0) {
                    execution_times.push_back(static_cast<double>(job->execution_duration));
                }
            }
            
            if (!execution_times.empty()) {
                auto stats = multiprocessor.calculate_statistics_parallel(execution_times);
                metrics.average_execution_time_ms = stats.mean;
            }
        }
        
        return metrics;
    });
    
    // Wait for all parallel collections
    auto system = system_metrics.get();
    auto thread_pool = thread_pool_metrics.get();
    auto timing = timing_metrics.get();
    
    // Combine results
    AutoConfigMetrics combined_metrics;
    combined_metrics.cpu_utilization = system.cpu_utilization;
    combined_metrics.memory_usage_percent = system.memory_usage_percent;
    combined_metrics.worker_count = thread_pool.worker_count;
    combined_metrics.active_jobs = thread_pool.active_jobs;
    combined_metrics.completed_jobs = thread_pool.completed_jobs;
    combined_metrics.failed_jobs = thread_pool.failed_jobs;
    combined_metrics.worker_utilization = thread_pool.worker_utilization;
    combined_metrics.average_execution_time_ms = timing.average_execution_time_ms;
    combined_metrics.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    
    return combined_metrics;
}

WorkloadPattern AutoConfig::analyze_workload_pattern_parallel(const AutoConfigMetrics& metrics) {
    // Analyze multiple factors in parallel
    auto cpu_analysis = std::async(std::launch::async, [&metrics]() {
        return metrics.cpu_utilization > 80.0;
    });
    
    auto memory_analysis = std::async(std::launch::async, [&metrics]() {
        return metrics.memory_usage_percent > 70.0;
    });
    
    auto io_analysis = std::async(std::launch::async, [&metrics]() {
        return metrics.average_execution_time_ms < 10.0; // Short jobs indicate I/O
    });
    
    // Wait for parallel analyses
    bool is_cpu_intensive = cpu_analysis.get();
    bool is_memory_intensive = memory_analysis.get();
    bool is_io_intensive = io_analysis.get();
    
    // Determine pattern based on parallel analysis results
    if (is_cpu_intensive && !is_memory_intensive) {
        return WorkloadPattern::CPU_INTENSIVE;
    } else if (is_io_intensive && !is_cpu_intensive) {
        return WorkloadPattern::IO_INTENSIVE;
    } else if (is_memory_intensive) {
        return WorkloadPattern::MEMORY_INTENSIVE;
    } else {
        return WorkloadPattern::MIXED;
    }
}

AutoConfigRecommendations AutoConfig::generate_recommendations_parallel(const AutoConfigMetrics& metrics) {
    // Generate different types of recommendations in parallel
    auto worker_recommendations = std::async(std::launch::async, [this, &metrics]() {
        return calculate_worker_scaling(metrics);
    });
    
    auto memory_recommendations = std::async(std::launch::async, [this, &metrics]() {
        return calculate_memory_adjustment(metrics);
    });
    
    auto timeout_recommendations = std::async(std::launch::async, [this, &metrics]() {
        return calculate_timeout_adjustment(metrics);
    });
    
    // Wait for parallel recommendations
    auto worker = worker_recommendations.get();
    auto memory = memory_recommendations.get();
    auto timeout = timeout_recommendations.get();
    
    // Combine recommendations
    AutoConfigRecommendations recommendations;
    recommendations.recommended_worker_count = worker.recommended_count;
    recommendations.should_scale_up = worker.should_scale_up;
    recommendations.should_scale_down = worker.should_scale_down;
    recommendations.worker_scaling_confidence = worker.confidence;
    
    recommendations.recommended_memory_limit_percent = memory.recommended_limit_percent;
    recommendations.should_adjust_memory = memory.should_adjust;
    recommendations.memory_confidence = memory.confidence;
    
    recommendations.recommended_timeout_ms = timeout.recommended_timeout_ms;
    recommendations.should_adjust_timeout = timeout.should_adjust;
    recommendations.timeout_confidence = timeout.confidence;
    
    return recommendations;
}

std::vector<double> AutoConfig::analyze_historical_trends_parallel() {
    std::lock_guard<std::mutex> lock(metrics_mutex_);
    
    if (metrics_history_.size() < 2) {
        return std::vector<double>();
    }
    
    // Extract execution times for trend analysis
    std::vector<double> execution_times;
    for (const auto& metrics : metrics_history_) {
        execution_times.push_back(metrics.average_execution_time_ms);
    }
    
    // Use multiprocessor to analyze trends in parallel
    auto& multiprocessor = Multiprocessor::get_instance();
    
    // Calculate moving averages in parallel
    size_t window_size = std::min(static_cast<size_t>(10), execution_times.size() / 2);
    
    std::vector<std::function<std::vector<double>()>> trend_tasks;
    
    for (size_t i = window_size; i < execution_times.size(); ++i) {
        trend_tasks.push_back([&execution_times, i, window_size]() {
            std::vector<double> window(execution_times.begin() + i - window_size, 
                                     execution_times.begin() + i);
            double sum = std::accumulate(window.begin(), window.end(), 0.0);
            return std::vector<double>{sum / window_size};
        });
    }
    
    auto trend_results = multiprocessor.execute_parallel(trend_tasks);
    
    // Flatten results
    std::vector<double> trends;
    for (const auto& result : trend_results) {
        trends.insert(trends.end(), result.begin(), result.end());
    }
    
    return trends;
}

std::vector<JobComplexity> AutoConfig::estimate_complexities_parallel(const std::vector<double>& execution_times) {
    if (execution_times.empty()) {
        return std::vector<JobComplexity>();
    }
    
    auto& multiprocessor = Multiprocessor::get_instance();
    
    // Use execute_parallel instead of process_parallel for this case
    std::vector<std::function<JobComplexity()>> tasks;
    tasks.reserve(execution_times.size());
    
    for (const auto& execution_time : execution_times) {
        tasks.push_back([this, execution_time]() {
            return estimate_complexity(execution_time);
        });
    }
    
    return multiprocessor.execute_parallel(tasks);
}

// =====================================================================
// Core Analysis Methods
// =====================================================================

void AutoConfig::perform_analysis() {
    if (!auto_config_enabled_.load()) {
        return;
    }
    
    auto start_time = std::chrono::steady_clock::now();
    
    // Use parallel metrics collection
    AutoConfigMetrics metrics = collect_metrics_parallel();
    
    // Use parallel pattern analysis
    metrics.detected_pattern = analyze_workload_pattern_parallel(metrics);
    
    // Use parallel recommendation generation
    AutoConfigRecommendations recommendations = generate_recommendations_parallel(metrics);
    
    // Store results
    {
        std::lock_guard<std::mutex> lock(metrics_mutex_);
        metrics_history_.push_back(metrics);
        
        if (metrics_history_.size() > MAX_METRICS_HISTORY) {
            metrics_history_.pop_front();
        }
    }
    
    {
        std::lock_guard<std::mutex> lock(recommendations_mutex_);
        current_recommendations_ = recommendations;
        last_analysis_time_ = std::chrono::steady_clock::now();
    }
    
    // Apply recommendations
    apply_recommendations(recommendations);
    
    auto end_time = std::chrono::steady_clock::now();
    auto analysis_duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
    
    Logger::debug("AutoConfig", "Analysis completed in " + std::to_string(analysis_duration.count()) + "ms");
}

AutoConfigMetrics AutoConfig::collect_metrics() {
    return collect_metrics_parallel();
}

WorkloadPattern AutoConfig::analyze_workload_pattern(const AutoConfigMetrics& metrics) {
    return analyze_workload_pattern_parallel(metrics);
}

JobComplexity AutoConfig::estimate_complexity(double execution_time_ms) {
    if (execution_time_ms < 1.0) return JobComplexity::TRIVIAL;
    if (execution_time_ms < 10.0) return JobComplexity::SIMPLE;
    if (execution_time_ms < 100.0) return JobComplexity::MODERATE;
    if (execution_time_ms < 1000.0) return JobComplexity::COMPLEX;
    return JobComplexity::HEAVY;
}

AutoConfigRecommendations AutoConfig::generate_recommendations(const AutoConfigMetrics& metrics) {
    return generate_recommendations_parallel(metrics);
}

void AutoConfig::apply_recommendations(const AutoConfigRecommendations& recommendations) {
    // Apply worker scaling
    if (recommendations.should_scale_up || recommendations.should_scale_down) {
        NativeThreadPool::get_instance().set_worker_thread_count(recommendations.recommended_worker_count);
        
        std::lock_guard<std::mutex> lock(adjustment_mutex_);
        last_adjustment_.reason = "Worker scaling based on performance analysis";
        last_adjustment_.changes_made = "Worker count adjusted to " + std::to_string(recommendations.recommended_worker_count);
        last_adjustment_.performance_impact = recommendations.worker_scaling_confidence;
        last_adjustment_.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()).count();
    }
    
    // Notify callbacks
    {
        std::lock_guard<std::mutex> lock(callback_mutex_);
        for (const auto& callback : adjustment_callbacks_) {
            try {
                callback(recommendations);
            } catch (const std::exception& e) {
                Logger::warn("AutoConfig", "Callback failed: " + std::string(e.what()));
            }
        }
    }
}

// =====================================================================
// Recommendation Calculation Methods
// =====================================================================

AutoConfig::WorkerScalingRecommendation AutoConfig::calculate_worker_scaling(const AutoConfigMetrics& metrics) {
    WorkerScalingRecommendation recommendation;
    
    size_t current_workers = metrics.worker_count;
    double utilization = metrics.worker_utilization;
    
    if (utilization > 0.9) {
        recommendation.should_scale_up = true;
        recommendation.should_scale_down = false;
        recommendation.recommended_count = std::min(current_workers * 2, static_cast<size_t>(32));
        recommendation.confidence = 0.8;
    } else if (utilization < 0.3 && current_workers > 2) {
        recommendation.should_scale_up = false;
        recommendation.should_scale_down = true;
        recommendation.recommended_count = std::max(current_workers / 2, static_cast<size_t>(2));
        recommendation.confidence = 0.6;
    } else {
        recommendation.should_scale_up = false;
        recommendation.should_scale_down = false;
        recommendation.recommended_count = current_workers;
        recommendation.confidence = 0.5;
    }
    
    return recommendation;
}

AutoConfig::MemoryRecommendation AutoConfig::calculate_memory_adjustment(const AutoConfigMetrics& metrics) {
    MemoryRecommendation recommendation;
    
    double current_memory = metrics.memory_usage_percent;
    
    if (current_memory > 80.0) {
        recommendation.should_adjust = true;
        recommendation.recommended_limit_percent = 70.0;
        recommendation.confidence = 0.9;
    } else if (current_memory < 30.0) {
        recommendation.should_adjust = true;
        recommendation.recommended_limit_percent = 80.0;
        recommendation.confidence = 0.7;
    } else {
        recommendation.should_adjust = false;
        recommendation.recommended_limit_percent = current_memory;
        recommendation.confidence = 0.5;
    }
    
    return recommendation;
}

AutoConfig::TimeoutRecommendation AutoConfig::calculate_timeout_adjustment(const AutoConfigMetrics& metrics) {
    TimeoutRecommendation recommendation;
    
    double avg_execution = metrics.average_execution_time_ms;
    
    if (avg_execution > 1000.0) {
        recommendation.should_adjust = true;
        recommendation.recommended_timeout_ms = static_cast<long long>(avg_execution * 3);
        recommendation.confidence = 0.8;
    } else if (avg_execution < 10.0) {
        recommendation.should_adjust = true;
        recommendation.recommended_timeout_ms = 30000; // 30 seconds
        recommendation.confidence = 0.6;
    } else {
        recommendation.should_adjust = false;
        recommendation.recommended_timeout_ms = 60000; // Default 60 seconds
        recommendation.confidence = 0.5;
    }
    
    return recommendation;
}

AutoConfig::PriorityRecommendation AutoConfig::calculate_priority_adjustment(const AutoConfigMetrics& metrics) {
    PriorityRecommendation recommendation;
    recommendation.should_adjust = false;
    recommendation.recommended_priority = 0;
    recommendation.confidence = 0.5;
    return recommendation;
}

AutoConfig::BatchingRecommendation AutoConfig::calculate_batching_recommendation(const AutoConfigMetrics& metrics) {
    BatchingRecommendation recommendation;
    recommendation.should_batch = false;
    recommendation.recommended_batch_size = 100;
    recommendation.confidence = 0.5;
    return recommendation;
}

AutoConfig::PoolRecommendation AutoConfig::calculate_pool_recommendation(const AutoConfigMetrics& metrics) {
    PoolRecommendation recommendation;
    recommendation.should_adjust = false;
    recommendation.recommended_initial_size = 20;
    recommendation.recommended_max_size = 200;
    recommendation.confidence = 0.5;
    return recommendation;
}

AutoConfig::CleanupRecommendation AutoConfig::calculate_cleanup_recommendation(const AutoConfigMetrics& metrics) {
    CleanupRecommendation recommendation;
    recommendation.should_adjust = false;
    recommendation.recommended_interval_ms = 5000;
    recommendation.confidence = 0.5;
    return recommendation;
}

AutoConfig::LoadBalanceRecommendation AutoConfig::calculate_load_balance_recommendation(const AutoConfigMetrics& metrics) {
    LoadBalanceRecommendation recommendation;
    recommendation.should_rebalance = false;
    recommendation.confidence = 0.5;
    return recommendation;
}

// =====================================================================
// Utility Methods
// =====================================================================

void AutoConfig::timer_callback(uv_timer_t* handle) {
    AutoConfig* config = static_cast<AutoConfig*>(handle->data);
    if (config && config->auto_config_enabled_.load()) {
        config->perform_analysis();
    }
}

double AutoConfig::calculate_adjustment_magnitude(double base_adjustment) const {
    switch (strategy_) {
        case AutoConfigStrategy::CONSERVATIVE:
            return base_adjustment * 0.5;
        case AutoConfigStrategy::MODERATE:
            return base_adjustment;
        case AutoConfigStrategy::AGGRESSIVE:
            return base_adjustment * 2.0;
        default:
            return base_adjustment;
    }
}

} // namespace tasklets 