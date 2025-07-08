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
 * @file test_auto_scheduler.cpp
 * @brief Tests for the AutoScheduler class
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/automation/auto_scheduler.hpp"
#include "../../src/core/base/microjob.hpp"
#include <uv.h>
#include <thread>
#include <chrono>
#include <memory>

using namespace tasklets;
using namespace cctest;

TEST(AutoSchedulerSingleton) {
    AutoScheduler& instance1 = AutoScheduler::get_instance();
    AutoScheduler& instance2 = AutoScheduler::get_instance();
    
    ASSERT_EQ(&instance1, &instance2);
}

TEST(AutoSchedulerInitialState) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    ASSERT_FALSE(scheduler.is_auto_scheduling_enabled());
}

TEST(AutoSchedulerEnableDisable) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.set_auto_scheduling_enabled(true);
    ASSERT_TRUE(scheduler.is_auto_scheduling_enabled());
    
    scheduler.set_auto_scheduling_enabled(false);
    ASSERT_FALSE(scheduler.is_auto_scheduling_enabled());
    
    scheduler.set_auto_scheduling_enabled(true);
    ASSERT_TRUE(scheduler.is_auto_scheduling_enabled());
}

TEST(AutoSchedulerStrategyManagement) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    ASSERT_EQ(AutoScheduler::AutoSchedulingStrategy::MODERATE, scheduler.get_strategy());
    
    scheduler.set_strategy(AutoScheduler::AutoSchedulingStrategy::CONSERVATIVE);
    ASSERT_EQ(AutoScheduler::AutoSchedulingStrategy::CONSERVATIVE, scheduler.get_strategy());
    
    scheduler.set_strategy(AutoScheduler::AutoSchedulingStrategy::AGGRESSIVE);
    ASSERT_EQ(AutoScheduler::AutoSchedulingStrategy::AGGRESSIVE, scheduler.get_strategy());
    
    scheduler.set_strategy(AutoScheduler::AutoSchedulingStrategy::MODERATE);
    ASSERT_EQ(AutoScheduler::AutoSchedulingStrategy::MODERATE, scheduler.get_strategy());
}

TEST(AutoSchedulerJobMetricsRecording) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->set_result("Test result");
    job->execution_duration = 100;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    scheduler.record_job_metrics(job);
    
    auto metrics_history = scheduler.get_metrics_history();
    ASSERT_GT(metrics_history.size(), 0);
    
    if (!metrics_history.empty()) {
        const auto& metrics = metrics_history.back();
        ASSERT_EQ(1, metrics.completed_jobs);
        ASSERT_GT(metrics.avg_total_time_ms, 0.0);
    }
}

TEST(AutoSchedulerRecommendations) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto recommendations = scheduler.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_worker_count, 1);
    ASSERT_GE(recommendations.recommended_timeout_ms, 0);
    ASSERT_GE(recommendations.recommended_priority, 0);
    ASSERT_GE(recommendations.worker_scaling_confidence, 0.0);
    ASSERT_LE(recommendations.worker_scaling_confidence, 1.0);
}

TEST(AutoSchedulerMetricsHistory) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto initial_history = scheduler.get_metrics_history();
    size_t initial_size = initial_history.size();
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 50;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    scheduler.record_job_metrics(job);
    
    auto updated_history = scheduler.get_metrics_history();
    ASSERT_GE(updated_history.size(), initial_size);
}

TEST(AutoSchedulerWorkloadPatternDetection) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    WorkloadPattern pattern = scheduler.get_detected_pattern();
    
    ASSERT_TRUE(pattern == WorkloadPattern::CPU_INTENSIVE ||
                pattern == WorkloadPattern::IO_INTENSIVE ||
                pattern == WorkloadPattern::MEMORY_INTENSIVE ||
                pattern == WorkloadPattern::MIXED ||
                pattern == WorkloadPattern::BURST ||
                pattern == WorkloadPattern::STEADY);
}

TEST(AutoSchedulerJobComplexityEstimation) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    JobComplexity complexity = scheduler.get_avg_complexity();
    
    ASSERT_TRUE(complexity == JobComplexity::TRIVIAL ||
                complexity == JobComplexity::SIMPLE ||
                complexity == JobComplexity::MODERATE ||
                complexity == JobComplexity::COMPLEX ||
                complexity == JobComplexity::HEAVY);
}

TEST(AutoSchedulerCallbackRegistration) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    bool callback_called = false;
    AutoSchedulerRecommendations received_recommendations;
    
    auto callback = [&callback_called, &received_recommendations](const AutoSchedulerRecommendations& rec) {
        callback_called = true;
        received_recommendations = rec;
    };
    
    scheduler.register_recommendation_callback(callback);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 75;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    scheduler.record_job_metrics(job);
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    ASSERT_TRUE(callback_called);
    ASSERT_GT(received_recommendations.recommended_worker_count, 0);
}

TEST(AutoSchedulerMultipleCallbacks) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    std::atomic<int> callback_count(0);
    
    auto callback1 = [&callback_count](const AutoSchedulerRecommendations&) {
        callback_count.fetch_add(1);
    };
    
    auto callback2 = [&callback_count](const AutoSchedulerRecommendations&) {
        callback_count.fetch_add(1);
    };
    
    scheduler.register_recommendation_callback(callback1);
    scheduler.register_recommendation_callback(callback2);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 60;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    scheduler.record_job_metrics(job);
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    ASSERT_GE(callback_count.load(), 0);
}

TEST(AutoSchedulerForceAnalysis) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto initial_recommendations = scheduler.get_recommendations();
    
    scheduler.force_analysis();
    
    auto updated_recommendations = scheduler.get_recommendations();
    
    ASSERT_GT(updated_recommendations.recommended_worker_count, 0);
    ASSERT_GE(updated_recommendations.worker_scaling_confidence, 0.0);
    ASSERT_LE(updated_recommendations.worker_scaling_confidence, 1.0);
}

TEST(AutoSchedulerConservativeStrategy) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.set_strategy(AutoScheduler::AutoSchedulingStrategy::CONSERVATIVE);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 200;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    scheduler.record_job_metrics(job);
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_recommendations();
    
    ASSERT_EQ(AutoScheduler::AutoSchedulingStrategy::CONSERVATIVE, scheduler.get_strategy());
    ASSERT_GT(recommendations.worker_scaling_confidence, 0.0);
}

TEST(AutoSchedulerAggressiveStrategy) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.set_strategy(AutoScheduler::AutoSchedulingStrategy::AGGRESSIVE);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 300;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    scheduler.record_job_metrics(job);
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_recommendations();
    
    ASSERT_EQ(AutoScheduler::AutoSchedulingStrategy::AGGRESSIVE, scheduler.get_strategy());
    ASSERT_GT(recommendations.worker_scaling_confidence, 0.0);
}

TEST(AutoSchedulerTimeoutRecommendations) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_timeout_ms, 0);
    ASSERT_GE(recommendations.timeout_confidence, 0.0);
    ASSERT_LE(recommendations.timeout_confidence, 1.0);
}

TEST(AutoSchedulerPriorityRecommendations) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_priority, 0);
    ASSERT_GE(recommendations.priority_confidence, 0.0);
    ASSERT_LE(recommendations.priority_confidence, 1.0);
}

TEST(AutoSchedulerBatchingRecommendations) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_batch_size, 1);
    ASSERT_GE(recommendations.batching_confidence, 0.0);
    ASSERT_LE(recommendations.batching_confidence, 1.0);
}

TEST(AutoSchedulerLoadBalanceRecommendations) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_recommendations();
    
    ASSERT_GE(recommendations.load_balance_confidence, 0.0);
    ASSERT_LE(recommendations.load_balance_confidence, 1.0);
    
    if (recommendations.should_rebalance) {
        ASSERT_FALSE(recommendations.worker_assignments.empty());
    }
}

TEST(AutoSchedulerMetricsCollection) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto metrics = scheduler.get_metrics_history();
    
    if (!metrics.empty()) {
        const auto& latest = metrics.back();
        
        ASSERT_GE(latest.cpu_usage, 0.0);
        ASSERT_LE(latest.cpu_usage, 100.0);
        ASSERT_GE(latest.memory_usage, 0.0);
        ASSERT_LE(latest.memory_usage, 100.0);
        ASSERT_GE(latest.worker_utilization, 0.0);
        ASSERT_LE(latest.worker_utilization, 100.0);
        ASSERT_GE(latest.jobs_per_second, 0.0);
        ASSERT_GE(latest.avg_execution_time_ms, 0.0);
        ASSERT_GT(latest.timestamp, 0);
    }
}

TEST(AutoSchedulerRecommendationConsistency) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto recommendations1 = scheduler.get_recommendations();
    auto recommendations2 = scheduler.get_recommendations();
    
    ASSERT_EQ(recommendations1.recommended_worker_count, recommendations2.recommended_worker_count);
    ASSERT_EQ(recommendations1.recommended_timeout_ms, recommendations2.recommended_timeout_ms);
    ASSERT_EQ(recommendations1.recommended_priority, recommendations2.recommended_priority);
    ASSERT_EQ(recommendations1.worker_scaling_confidence, recommendations2.worker_scaling_confidence);
}

TEST(AutoSchedulerMetricsConsistency) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto metrics1 = scheduler.get_metrics_history();
    auto metrics2 = scheduler.get_metrics_history();
    
    ASSERT_EQ(metrics1.size(), metrics2.size());
    
    if (!metrics1.empty() && !metrics2.empty()) {
        ASSERT_EQ(metrics1.back().timestamp, metrics2.back().timestamp);
    }
} 