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
 * @file test_auto_config.cpp
 * @brief Tests for the AutoConfig class
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/automation/auto_config.hpp"
#include "../../src/core/base/microjob.hpp"
#include <uv.h>
#include <thread>
#include <chrono>
#include <memory>

using namespace tasklets;
using namespace cctest;

TEST(AutoConfigSingleton) {
    AutoConfig& instance1 = AutoConfig::get_instance();
    AutoConfig& instance2 = AutoConfig::get_instance();
    
    ASSERT_EQ(&instance1, &instance2);
}

TEST(AutoConfigInitialState) {
    AutoConfig& config = AutoConfig::get_instance();
    
    ASSERT_FALSE(config.is_auto_config_enabled());
}

TEST(AutoConfigEnableDisable) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.set_auto_config_enabled(true);
    ASSERT_TRUE(config.is_auto_config_enabled());
    
    config.set_auto_config_enabled(false);
    ASSERT_FALSE(config.is_auto_config_enabled());
    
    config.set_auto_config_enabled(true);
    ASSERT_TRUE(config.is_auto_config_enabled());
}

TEST(AutoConfigStrategyManagement) {
    AutoConfig& config = AutoConfig::get_instance();
    
    ASSERT_EQ(AutoConfigStrategy::MODERATE, config.get_strategy());
    
    config.set_strategy(AutoConfigStrategy::CONSERVATIVE);
    ASSERT_EQ(AutoConfigStrategy::CONSERVATIVE, config.get_strategy());
    
    config.set_strategy(AutoConfigStrategy::AGGRESSIVE);
    ASSERT_EQ(AutoConfigStrategy::AGGRESSIVE, config.get_strategy());
    
    config.set_strategy(AutoConfigStrategy::MODERATE);
    ASSERT_EQ(AutoConfigStrategy::MODERATE, config.get_strategy());
}

TEST(AutoConfigJobMetricsRecording) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->set_result("Test result");
    job->execution_duration = 100;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    config.record_job_metrics(job);
    
    auto metrics_history = config.get_metrics_history();
    ASSERT_GT(metrics_history.size(), 0);
    
    if (!metrics_history.empty()) {
        const auto& metrics = metrics_history.back();
        ASSERT_EQ(1, metrics.completed_jobs);
        ASSERT_GT(metrics.average_execution_time_ms, 0.0);
    }
}

TEST(AutoConfigBatchPatternRecording) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.record_batch_pattern(5);
    config.record_batch_pattern(10);
    config.record_batch_pattern(15);
    
    auto metrics_history = config.get_metrics_history();
    ASSERT_GT(metrics_history.size(), 0);
}

TEST(AutoConfigRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_worker_count, 1);
    ASSERT_GE(recommendations.recommended_memory_limit_percent, 0.0);
    ASSERT_LE(recommendations.recommended_memory_limit_percent, 100.0);
    ASSERT_GE(recommendations.recommended_timeout_ms, 0);
    ASSERT_GE(recommendations.recommended_priority, 0);
    ASSERT_GE(recommendations.worker_scaling_confidence, 0.0);
    ASSERT_LE(recommendations.worker_scaling_confidence, 1.0);
    ASSERT_GE(recommendations.overall_confidence, 0.0);
    ASSERT_LE(recommendations.overall_confidence, 1.0);
}

TEST(AutoConfigMetricsHistory) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto initial_history = config.get_metrics_history();
    size_t initial_size = initial_history.size();
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 50;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    config.record_job_metrics(job);
    
    auto updated_history = config.get_metrics_history();
    ASSERT_GE(updated_history.size(), initial_size);
}

TEST(AutoConfigWorkloadPatternDetection) {
    AutoConfig& config = AutoConfig::get_instance();
    
    WorkloadPattern pattern = config.get_detected_pattern();
    
    ASSERT_TRUE(pattern == WorkloadPattern::CPU_INTENSIVE || 
                pattern == WorkloadPattern::IO_INTENSIVE ||
                pattern == WorkloadPattern::MEMORY_INTENSIVE ||
                pattern == WorkloadPattern::MIXED ||
                pattern == WorkloadPattern::BURST ||
                pattern == WorkloadPattern::STEADY);
}

TEST(AutoConfigJobComplexityEstimation) {
    AutoConfig& config = AutoConfig::get_instance();
    
    JobComplexity complexity = config.get_avg_complexity();
    
    ASSERT_TRUE(complexity == JobComplexity::TRIVIAL ||
                complexity == JobComplexity::SIMPLE ||
                complexity == JobComplexity::MODERATE ||
                complexity == JobComplexity::COMPLEX ||
                complexity == JobComplexity::HEAVY);
}

TEST(AutoConfigCallbackRegistration) {
    AutoConfig& config = AutoConfig::get_instance();
    
    bool callback_called = false;
    AutoConfigRecommendations received_recommendations;
    
    auto callback = [&callback_called, &received_recommendations](const AutoConfigRecommendations& rec) {
        callback_called = true;
        received_recommendations = rec;
    };
    
    config.register_adjustment_callback(callback);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 75;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    config.record_job_metrics(job);
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    ASSERT_TRUE(callback_called);
    ASSERT_GT(received_recommendations.recommended_worker_count, 0);
}

TEST(AutoConfigMultipleCallbacks) {
    AutoConfig& config = AutoConfig::get_instance();
    
    std::atomic<int> callback_count(0);
    
    auto callback1 = [&callback_count](const AutoConfigRecommendations&) {
        callback_count.fetch_add(1);
    };
    
    auto callback2 = [&callback_count](const AutoConfigRecommendations&) {
        callback_count.fetch_add(1);
    };
    
    config.register_adjustment_callback(callback1);
    config.register_adjustment_callback(callback2);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 60;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    config.record_job_metrics(job);
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    ASSERT_GE(callback_count.load(), 0);
}

TEST(AutoConfigForceAnalysis) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto initial_recommendations = config.get_recommendations();
    
    config.force_analysis();
    
    auto updated_recommendations = config.get_recommendations();
    
    ASSERT_GT(updated_recommendations.recommended_worker_count, 0);
    ASSERT_GE(updated_recommendations.worker_scaling_confidence, 0.0);
    ASSERT_LE(updated_recommendations.worker_scaling_confidence, 1.0);
}

TEST(AutoConfigConservativeStrategy) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.set_strategy(AutoConfigStrategy::CONSERVATIVE);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 200;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    config.record_job_metrics(job);
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_EQ(AutoConfigStrategy::CONSERVATIVE, config.get_strategy());
    ASSERT_GT(recommendations.worker_scaling_confidence, 0.0);
}

TEST(AutoConfigAggressiveStrategy) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.set_strategy(AutoConfigStrategy::AGGRESSIVE);
    
    auto job = std::make_shared<MicroJob>();
    job->tasklet_id = 1;
    job->execution_duration = 300;
    job->mark_enqueued();
    job->mark_started();
    job->mark_completed();
    
    config.record_job_metrics(job);
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_EQ(AutoConfigStrategy::AGGRESSIVE, config.get_strategy());
    ASSERT_GT(recommendations.worker_scaling_confidence, 0.0);
}

TEST(AutoConfigMemoryRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_memory_limit_percent, 0.0);
    ASSERT_LE(recommendations.recommended_memory_limit_percent, 100.0);
    ASSERT_GE(recommendations.memory_confidence, 0.0);
    ASSERT_LE(recommendations.memory_confidence, 1.0);
}

TEST(AutoConfigTimeoutRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_timeout_ms, 0);
    ASSERT_GE(recommendations.timeout_confidence, 0.0);
    ASSERT_LE(recommendations.timeout_confidence, 1.0);
}

TEST(AutoConfigPriorityRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_priority, 0);
    ASSERT_GE(recommendations.priority_confidence, 0.0);
    ASSERT_LE(recommendations.priority_confidence, 1.0);
}

TEST(AutoConfigBatchingRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_batch_size, 1);
    ASSERT_GE(recommendations.batching_confidence, 0.0);
    ASSERT_LE(recommendations.batching_confidence, 1.0);
}

TEST(AutoConfigPoolRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GE(recommendations.recommended_pool_initial_size, 1);
    ASSERT_GE(recommendations.recommended_pool_max_size, recommendations.recommended_pool_initial_size);
    ASSERT_GE(recommendations.pool_confidence, 0.0);
    ASSERT_LE(recommendations.pool_confidence, 1.0);
}

TEST(AutoConfigCleanupRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GT(recommendations.recommended_cleanup_interval_ms, 0);
    ASSERT_GE(recommendations.cleanup_confidence, 0.0);
    ASSERT_LE(recommendations.cleanup_confidence, 1.0);
}

TEST(AutoConfigLoadBalanceRecommendations) {
    AutoConfig& config = AutoConfig::get_instance();
    
    config.force_analysis();
    
    auto recommendations = config.get_recommendations();
    
    ASSERT_GE(recommendations.load_balance_confidence, 0.0);
    ASSERT_LE(recommendations.load_balance_confidence, 1.0);
    
    if (recommendations.should_rebalance) {
        ASSERT_FALSE(recommendations.worker_assignments.empty());
    }
}

TEST(AutoConfigMetricsCollection) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto metrics = config.get_metrics_history();
    
    if (!metrics.empty()) {
        const auto& latest = metrics.back();
        
        ASSERT_GE(latest.cpu_utilization, 0.0);
        ASSERT_LE(latest.cpu_utilization, 100.0);
        ASSERT_GE(latest.memory_usage_percent, 0.0);
        ASSERT_LE(latest.memory_usage_percent, 100.0);
        ASSERT_GE(latest.worker_utilization, 0.0);
        ASSERT_LE(latest.worker_utilization, 100.0);
        ASSERT_GE(latest.throughput_tasks_per_sec, 0.0);
        ASSERT_GE(latest.average_execution_time_ms, 0.0);
        ASSERT_GE(latest.success_rate, 0.0);
        ASSERT_LE(latest.success_rate, 100.0);
        ASSERT_GT(latest.timestamp, 0);
    }
}

TEST(AutoConfigLastAdjustment) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto adjustment = config.get_last_adjustment();
    
    ASSERT_GT(adjustment.timestamp, 0);
    ASSERT_GE(adjustment.performance_impact, 0.0);
}

TEST(AutoConfigSettings) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto settings = config.get_settings();
    
    ASSERT_EQ(config.is_auto_config_enabled(), settings.is_enabled);
    ASSERT_EQ(config.get_strategy(), settings.strategy);
    ASSERT_EQ(config.get_recommendations().recommended_worker_count,
              settings.recommendations.recommended_worker_count);
    ASSERT_EQ(config.get_metrics_history().size(), settings.metrics_history.size());
    ASSERT_EQ(config.get_last_adjustment().timestamp, settings.last_adjustment.timestamp);
}

TEST(AutoConfigRecommendationConsistency) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto recommendations1 = config.get_recommendations();
    auto recommendations2 = config.get_recommendations();
    
    ASSERT_EQ(recommendations1.recommended_worker_count, recommendations2.recommended_worker_count);
    ASSERT_EQ(recommendations1.recommended_memory_limit_percent, recommendations2.recommended_memory_limit_percent);
    ASSERT_EQ(recommendations1.recommended_timeout_ms, recommendations2.recommended_timeout_ms);
    ASSERT_EQ(recommendations1.recommended_priority, recommendations2.recommended_priority);
    ASSERT_EQ(recommendations1.worker_scaling_confidence, recommendations2.worker_scaling_confidence);
    ASSERT_EQ(recommendations1.overall_confidence, recommendations2.overall_confidence);
}

TEST(AutoConfigMetricsConsistency) {
    AutoConfig& config = AutoConfig::get_instance();
    
    auto metrics1 = config.get_metrics_history();
    auto metrics2 = config.get_metrics_history();
    
    ASSERT_EQ(metrics1.size(), metrics2.size());
    
    if (!metrics1.empty() && !metrics2.empty()) {
        ASSERT_EQ(metrics1.back().timestamp, metrics2.back().timestamp);
    }
} 