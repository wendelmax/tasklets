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
 * @file auto_scheduler.cpp
 * @brief Implements the AutoScheduler logic, providing intelligent automatic optimization for MicroJob and NativeThreadPool based on runtime metrics and workload patterns.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "auto_scheduler.hpp"
#include "../base/logger.hpp"
#include <algorithm>
#include <cmath>
#include <sstream>
#include <unistd.h>
#include <sys/sysinfo.h>

namespace tasklets {

AutoScheduler& AutoScheduler::get_instance() {
    static AutoScheduler instance;
    return instance;
}

AutoScheduler::AutoScheduler()
    : auto_scheduling_enabled_(false)
    , is_initialized_(false)
    , strategy_(AutoSchedulingStrategy::MODERATE)
    , analysis_interval_ms_(DEFAULT_ANALYSIS_INTERVAL_MS)
    , stats_collector_(std::make_shared<StatsCollector>()) {
}

AutoScheduler::~AutoScheduler() {
    shutdown();
}

void AutoScheduler::initialize(uv_loop_t* loop) {
    if (is_initialized_.load()) {
        return;
    }

    uv_timer_init(loop, &analysis_timer_);
    analysis_timer_.data = this;
    
    is_initialized_.store(true);
    Logger::info("AutoScheduler", "Initialized intelligent auto-scheduling system");
}

void AutoScheduler::shutdown() {
    if (!is_initialized_.load()) {
        return;
    }

    if (auto_scheduling_enabled_.load()) {
        set_auto_scheduling_enabled(false);
    }

    uv_timer_stop(&analysis_timer_);
    is_initialized_.store(false);
    Logger::info("AutoScheduler", "Shutdown auto-scheduling system");
}

void AutoScheduler::set_auto_scheduling_enabled(bool enabled) {
    if (enabled == auto_scheduling_enabled_.load()) {
        return;
    }

    if (enabled) {
        if (!is_initialized_.load()) {
            Logger::error("AutoScheduler", "Cannot enable auto-scheduling - not initialized");
            return;
        }

        auto_scheduling_enabled_.store(true);
        uv_timer_start(&analysis_timer_, timer_callback, analysis_interval_ms_, analysis_interval_ms_);
        Logger::info("AutoScheduler", "Enabled intelligent auto-scheduling");
    } else {
        auto_scheduling_enabled_.store(false);
        uv_timer_stop(&analysis_timer_);
        Logger::info("AutoScheduler", "Disabled auto-scheduling");
    }
}

void AutoScheduler::record_job_metrics(const std::shared_ptr<MicroJob>& job) {
    if (!auto_scheduling_enabled_.load()) {
        return;
    }

    std::lock_guard<std::mutex> lock(metrics_mutex_);
    
    // Store job in history
    job_history_.push_back(job);
    
    while (job_history_.size() > MAX_JOB_HISTORY) {
        job_history_.pop_front();
    }
}

AutoSchedulerRecommendations AutoScheduler::get_recommendations() const {
    std::lock_guard<std::mutex> lock(recommendations_mutex_);
    return current_recommendations_;
}

std::vector<AutoSchedulerMetrics> AutoScheduler::get_metrics_history() const {
    std::lock_guard<std::mutex> lock(metrics_mutex_);
    return std::vector<AutoSchedulerMetrics>(metrics_history_.begin(), metrics_history_.end());
}

void AutoScheduler::force_analysis() {
    if (!auto_scheduling_enabled_.load()) {
        Logger::warn("AutoScheduler", "Cannot force analysis - auto-scheduling is disabled");
        return;
    }

    perform_analysis();
}

WorkloadPattern AutoScheduler::get_detected_pattern() const {
    std::lock_guard<std::mutex> lock(recommendations_mutex_);
    if (metrics_history_.empty()) {
        return WorkloadPattern::MIXED;
    }
    return metrics_history_.back().detected_pattern;
}

JobComplexity AutoScheduler::get_avg_complexity() const {
    std::lock_guard<std::mutex> lock(recommendations_mutex_);
    if (metrics_history_.empty()) {
        return JobComplexity::MODERATE;
    }
    return metrics_history_.back().avg_complexity;
}

void AutoScheduler::set_strategy(AutoSchedulingStrategy strategy) {
    strategy_ = strategy;
    Logger::info("AutoScheduler", "Updated auto-scheduling strategy");
}

void AutoScheduler::register_recommendation_callback(std::function<void(const AutoSchedulerRecommendations&)> callback) {
    std::lock_guard<std::mutex> lock(callback_mutex_);
    recommendation_callbacks_.push_back(callback);
}

void AutoScheduler::perform_analysis() {
    if (!auto_scheduling_enabled_.load()) {
        return;
    }

    auto now = std::chrono::steady_clock::now();
    auto time_since_last = std::chrono::duration_cast<std::chrono::milliseconds>(
        now - last_analysis_time_).count();

    if (time_since_last < analysis_interval_ms_) {
        return;
    }

    AutoSchedulerMetrics current_metrics = collect_metrics();
    
    {
        std::lock_guard<std::mutex> lock(metrics_mutex_);
        metrics_history_.push_back(current_metrics);
        
        while (metrics_history_.size() > MAX_METRICS_HISTORY) {
            metrics_history_.pop_front();
        }
    }

    AutoSchedulerRecommendations recommendations = generate_recommendations(current_metrics);

    {
        std::lock_guard<std::mutex> lock(recommendations_mutex_);
        current_recommendations_ = recommendations;
        last_analysis_time_ = now;
    }

    // Notify callbacks
    {
        std::lock_guard<std::mutex> lock(callback_mutex_);
        for (const auto& callback : recommendation_callbacks_) {
            callback(recommendations);
        }
    }

    Logger::debug("AutoScheduler", "Completed analysis - detected pattern: " + 
                 std::to_string(static_cast<int>(current_metrics.detected_pattern)));
}

AutoSchedulerMetrics AutoScheduler::collect_metrics() {
    AutoSchedulerMetrics metrics;
    metrics.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();

    // Get scheduler statistics
    auto scheduler_stats = stats_collector_->get_stats();
    metrics.queue_length = 0; // SchedulerStats doesn't have queued_tasklets
    metrics.active_jobs = scheduler_stats.active_threads;
    metrics.completed_jobs = scheduler_stats.completed_threads;
    metrics.failed_jobs = scheduler_stats.failed_threads;
    metrics.worker_count = scheduler_stats.worker_threads;

    // Calculate timing metrics from job history
    {
        std::lock_guard<std::mutex> lock(metrics_mutex_);
        if (!job_history_.empty()) {
            double total_queue_wait = 0.0;
            double total_execution = 0.0;
            double total_time = 0.0;
            size_t valid_jobs = 0;

            for (const auto& job : job_history_) {
                if (job->is_finished()) {
                    total_queue_wait += job->get_queue_wait_time();
                    total_execution += job->execution_duration;
                    total_time += job->get_total_time();
                    valid_jobs++;
                }
            }

            if (valid_jobs > 0) {
                metrics.avg_queue_wait_time_ms = total_queue_wait / valid_jobs;
                metrics.avg_execution_time_ms = total_execution / valid_jobs;
                metrics.avg_total_time_ms = total_time / valid_jobs;
            }
        }
    }

    // Calculate throughput
    if (metrics_history_.size() >= 2) {
        const auto& previous = metrics_history_.back();
        double time_diff = (metrics.timestamp - previous.timestamp) / 1000.0;
        if (time_diff > 0) {
            metrics.jobs_per_second = (metrics.completed_jobs - previous.completed_jobs) / time_diff;
            metrics.throughput_trend = metrics.jobs_per_second / std::max(previous.jobs_per_second, 0.1);
        }
    }

    // Calculate worker utilization
    metrics.worker_utilization = metrics.worker_count > 0 ? 
        (static_cast<double>(metrics.active_jobs) / metrics.worker_count) * 100.0 : 0.0;

    // Get system metrics
    struct sysinfo si;
    if (sysinfo(&si) == 0) {
        uint64_t total_memory = si.totalram * si.mem_unit;
        uint64_t free_memory = si.freeram * si.mem_unit;
        uint64_t used_memory = total_memory - free_memory;
        metrics.memory_usage = (static_cast<double>(used_memory) / total_memory) * 100.0;
    }

    // Estimate CPU usage based on worker utilization
    metrics.cpu_usage = std::min(100.0, metrics.worker_utilization * 1.2);

    // Calculate load balance score (0-100, higher is better)
    metrics.load_balance_score = 100.0;
    if (metrics.worker_count > 1) {
        double ideal_jobs_per_worker = static_cast<double>(metrics.active_jobs) / metrics.worker_count;
        double variance = 0.0;
        // Simplified variance calculation
        variance = std::abs(metrics.active_jobs - ideal_jobs_per_worker * metrics.worker_count);
        metrics.load_balance_score = std::max(0.0, 100.0 - (variance * 10.0));
    }

    // Analyze patterns
    metrics.detected_pattern = analyze_workload_pattern(metrics);
    metrics.avg_complexity = estimate_complexity(metrics.avg_execution_time_ms);

    return metrics;
}

WorkloadPattern AutoScheduler::analyze_workload_pattern(const AutoSchedulerMetrics& metrics) {
    // Analyze based on multiple factors
    double cpu_intensity = metrics.cpu_usage / 100.0;
    double memory_intensity = metrics.memory_usage / 100.0;
    double io_intensity = 1.0 - (metrics.avg_execution_time_ms / 1000.0); // Shorter jobs = more I/O
    
    // Pattern detection logic
    if (cpu_intensity > 0.8 && memory_intensity < 0.5) {
        return WorkloadPattern::CPU_INTENSIVE;
    } else if (io_intensity > 0.7 && cpu_intensity < 0.5) {
        return WorkloadPattern::IO_INTENSIVE;
    } else if (memory_intensity > 0.7) {
        return WorkloadPattern::MEMORY_INTENSIVE;
    } else if (metrics.throughput_trend > 1.5) {
        return WorkloadPattern::BURST;
    } else if (std::abs(metrics.throughput_trend - 1.0) < 0.2) {
        return WorkloadPattern::STEADY;
    } else {
        return WorkloadPattern::MIXED;
    }
}

JobComplexity AutoScheduler::estimate_complexity(double execution_time_ms) {
    if (execution_time_ms < 1.0) return JobComplexity::TRIVIAL;
    if (execution_time_ms < 10.0) return JobComplexity::SIMPLE;
    if (execution_time_ms < 100.0) return JobComplexity::MODERATE;
    if (execution_time_ms < 1000.0) return JobComplexity::COMPLEX;
    return JobComplexity::HEAVY;
}

AutoSchedulerRecommendations AutoScheduler::generate_recommendations(const AutoSchedulerMetrics& metrics) {
    AutoSchedulerRecommendations recommendations;

    // Worker scaling recommendations
    auto worker_scaling = calculate_worker_scaling(metrics);
    recommendations.recommended_worker_count = worker_scaling.recommended_count;
    recommendations.should_scale_up = worker_scaling.should_scale_up;
    recommendations.should_scale_down = worker_scaling.should_scale_down;
    recommendations.worker_scaling_confidence = worker_scaling.confidence;

    // Timeout recommendations
    auto timeout_rec = calculate_timeout_adjustment(metrics);
    recommendations.recommended_timeout_ms = timeout_rec.recommended_timeout_ms;
    recommendations.should_adjust_timeout = timeout_rec.should_adjust;
    recommendations.timeout_confidence = timeout_rec.confidence;

    // Priority recommendations
    auto priority_rec = calculate_priority_adjustment(metrics);
    recommendations.recommended_priority = priority_rec.recommended_priority;
    recommendations.should_adjust_priority = priority_rec.should_adjust;
    recommendations.priority_confidence = priority_rec.confidence;

    // Batching recommendations
    auto batching_rec = calculate_batching_recommendation(metrics);
    recommendations.recommended_batch_size = batching_rec.recommended_batch_size;
    recommendations.should_batch = batching_rec.should_batch;
    recommendations.batching_confidence = batching_rec.confidence;

    // Load balancing recommendations
    auto load_balance_rec = calculate_load_balance_recommendation(metrics);
    recommendations.should_rebalance = load_balance_rec.should_rebalance;
    recommendations.worker_assignments = load_balance_rec.worker_assignments;
    recommendations.load_balance_confidence = load_balance_rec.confidence;

    return recommendations;
}

AutoScheduler::WorkerScalingRecommendation AutoScheduler::calculate_worker_scaling(const AutoSchedulerMetrics& metrics) {
    WorkerScalingRecommendation rec;
    rec.confidence = 0.0;
    rec.should_scale_up = false;
    rec.should_scale_down = false;

    const size_t current_workers = metrics.worker_count;
    const size_t max_workers = std::thread::hardware_concurrency() * 4;
    const size_t min_workers = 1;

    // Analyze worker utilization
    if (metrics.worker_utilization > 90.0 && current_workers < max_workers) {
        rec.should_scale_up = true;
        rec.recommended_count = std::min(max_workers, current_workers + 1);
        rec.confidence = 0.8;
    } else if (metrics.worker_utilization < 30.0 && current_workers > min_workers) {
        rec.should_scale_down = true;
        rec.recommended_count = std::max(min_workers, current_workers - 1);
        rec.confidence = 0.7;
    } else {
        rec.recommended_count = current_workers;
        rec.confidence = 0.5;
    }

    // Adjust based on workload pattern
    switch (metrics.detected_pattern) {
        case WorkloadPattern::CPU_INTENSIVE:
            if (rec.should_scale_up) {
                rec.recommended_count = std::min(max_workers, rec.recommended_count + 1);
            }
            break;
        case WorkloadPattern::IO_INTENSIVE:
            if (rec.should_scale_up) {
                rec.recommended_count = std::min(max_workers, rec.recommended_count + 2);
            }
            break;
        case WorkloadPattern::MEMORY_INTENSIVE:
            if (rec.should_scale_down) {
                rec.recommended_count = std::max(min_workers, rec.recommended_count - 1);
            }
            break;
        default:
            break;
    }

    return rec;
}

AutoScheduler::TimeoutRecommendation AutoScheduler::calculate_timeout_adjustment(const AutoSchedulerMetrics& metrics) {
    TimeoutRecommendation rec;
    rec.confidence = 0.0;
    rec.should_adjust = false;

    const long long current_timeout = 30000; // Default 30s
    const double avg_execution = metrics.avg_execution_time_ms;

    if (avg_execution > 0) {
        // Calculate timeout based on execution time and complexity
        long long recommended_timeout = 0;
        
        switch (metrics.avg_complexity) {
            case JobComplexity::TRIVIAL:
                recommended_timeout = 1000; // 1s
                break;
            case JobComplexity::SIMPLE:
                recommended_timeout = 5000; // 5s
                break;
            case JobComplexity::MODERATE:
                recommended_timeout = 15000; // 15s
                break;
            case JobComplexity::COMPLEX:
                recommended_timeout = 60000; // 1min
                break;
            case JobComplexity::HEAVY:
                recommended_timeout = 300000; // 5min
                break;
        }

        // Adjust based on failure rate
        if (metrics.failed_jobs > 0 && metrics.completed_jobs > 0) {
            double failure_rate = static_cast<double>(metrics.failed_jobs) / 
                                (metrics.completed_jobs + metrics.failed_jobs);
            if (failure_rate > 0.1) { // >10% failure rate
                recommended_timeout = static_cast<long long>(recommended_timeout * 1.5);
            }
        }

        rec.recommended_timeout_ms = recommended_timeout;
        rec.should_adjust = std::abs(recommended_timeout - current_timeout) > 5000; // 5s difference
        rec.confidence = 0.7;
    }

    return rec;
}

AutoScheduler::PriorityRecommendation AutoScheduler::calculate_priority_adjustment(const AutoSchedulerMetrics& metrics) {
    PriorityRecommendation rec;
    rec.confidence = 0.0;
    rec.should_adjust = false;

    // Base priority on workload pattern and complexity
    int recommended_priority = 0; // Default priority

    switch (metrics.detected_pattern) {
        case WorkloadPattern::BURST:
            recommended_priority = 10; // High priority for burst workloads
            break;
        case WorkloadPattern::CPU_INTENSIVE:
            recommended_priority = 5; // Medium-high priority
            break;
        case WorkloadPattern::IO_INTENSIVE:
            recommended_priority = 3; // Medium priority
            break;
        case WorkloadPattern::MEMORY_INTENSIVE:
            recommended_priority = 1; // Low priority
            break;
        default:
            recommended_priority = 0; // Default priority
            break;
    }

    // Adjust based on queue length
    if (metrics.queue_length > 100) {
        recommended_priority += 2; // Increase priority for long queues
    } else if (metrics.queue_length < 10) {
        recommended_priority -= 1; // Decrease priority for short queues
    }

    rec.recommended_priority = std::max(-10, std::min(10, recommended_priority));
    rec.should_adjust = true; // Always provide priority recommendations
    rec.confidence = 0.6;

    return rec;
}

AutoScheduler::BatchingRecommendation AutoScheduler::calculate_batching_recommendation(const AutoSchedulerMetrics& metrics) {
    BatchingRecommendation rec;
    rec.confidence = 0.0;
    rec.should_batch = false;

    // Determine if batching would be beneficial
    size_t recommended_batch_size = 1;

    if (metrics.avg_execution_time_ms < 10.0) {
        // For very fast jobs, batching can improve throughput
        recommended_batch_size = std::min(static_cast<size_t>(50), 
                                        static_cast<size_t>(1000.0 / metrics.avg_execution_time_ms));
        rec.should_batch = recommended_batch_size > 5;
    } else if (metrics.detected_pattern == WorkloadPattern::BURST) {
        // For burst workloads, larger batches can help
        recommended_batch_size = 25;
        rec.should_batch = true;
    } else if (metrics.detected_pattern == WorkloadPattern::MEMORY_INTENSIVE) {
        // For memory-intensive workloads, smaller batches
        recommended_batch_size = 5;
        rec.should_batch = metrics.queue_length > 20;
    }

    rec.recommended_batch_size = recommended_batch_size;
    rec.confidence = 0.5;

    return rec;
}

AutoScheduler::LoadBalanceRecommendation AutoScheduler::calculate_load_balance_recommendation(const AutoSchedulerMetrics& metrics) {
    LoadBalanceRecommendation rec;
    rec.confidence = 0.0;
    rec.should_rebalance = false;

    // Determine if load balancing is needed
    if (metrics.worker_count > 1 && metrics.load_balance_score < 70.0) {
        rec.should_rebalance = true;
        
        // Calculate worker assignments (simplified)
        size_t jobs_per_worker = metrics.active_jobs / metrics.worker_count;
        size_t extra_jobs = metrics.active_jobs % metrics.worker_count;
        
        for (size_t i = 0; i < metrics.worker_count; ++i) {
            size_t assignment = jobs_per_worker + (i < extra_jobs ? 1 : 0);
            rec.worker_assignments.push_back(assignment);
        }
        
        rec.confidence = 0.8;
    } else {
        rec.confidence = 0.3;
    }

    return rec;
}

void AutoScheduler::timer_callback(uv_timer_t* handle) {
    AutoScheduler* self = static_cast<AutoScheduler*>(handle->data);
    self->perform_analysis();
}

double AutoScheduler::calculate_adjustment_magnitude(double base_adjustment) const {
    switch (strategy_) {
        case AutoSchedulingStrategy::CONSERVATIVE:
            return base_adjustment * 0.5;
        case AutoSchedulingStrategy::MODERATE:
            return base_adjustment;
        case AutoSchedulingStrategy::AGGRESSIVE:
            return base_adjustment * 1.5;
        default:
            return base_adjustment;
    }
}

} // namespace tasklets 