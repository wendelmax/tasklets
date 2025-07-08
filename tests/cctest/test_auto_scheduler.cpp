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
    
    ASSERT_EQ(AutoSchedulerStrategy::ADAPTIVE, scheduler.get_strategy());
    
    scheduler.set_strategy(AutoSchedulerStrategy::PERFORMANCE);
    ASSERT_EQ(AutoSchedulerStrategy::PERFORMANCE, scheduler.get_strategy());
    
    scheduler.set_strategy(AutoSchedulerStrategy::EFFICIENCY);
    ASSERT_EQ(AutoSchedulerStrategy::EFFICIENCY, scheduler.get_strategy());
    
    scheduler.set_strategy(AutoSchedulerStrategy::BALANCED);
    ASSERT_EQ(AutoSchedulerStrategy::BALANCED, scheduler.get_strategy());
    
    scheduler.set_strategy(AutoSchedulerStrategy::ADAPTIVE);
    ASSERT_EQ(AutoSchedulerStrategy::ADAPTIVE, scheduler.get_strategy());
}

TEST(AutoSchedulerJobAnalysis) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    MicroJob job;
    job.tasklet_id = 1;
    job.execution_duration = 150;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    scheduler.analyze_job(job);
    
    auto analysis = scheduler.get_job_analysis(job.tasklet_id);
    ASSERT_GT(analysis.complexity_score, 0.0);
    ASSERT_GT(analysis.execution_time_ms, 0.0);
    ASSERT_GT(analysis.timestamp, 0);
}

TEST(AutoSchedulerWorkloadAnalysis) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto analysis = scheduler.get_workload_analysis();
    
    ASSERT_GE(analysis.avg_complexity, 0.0);
    ASSERT_GE(analysis.avg_execution_time_ms, 0.0);
    ASSERT_GE(analysis.throughput_tasks_per_sec, 0.0);
    ASSERT_GE(analysis.worker_utilization, 0.0);
    ASSERT_LE(analysis.worker_utilization, 100.0);
    ASSERT_GT(analysis.timestamp, 0);
}

TEST(AutoSchedulerSchedulingRecommendations) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto recommendations = scheduler.get_scheduling_recommendations();
    
    ASSERT_GE(recommendations.recommended_worker_count, 1);
    ASSERT_GE(recommendations.recommended_timeout_ms, 0);
    ASSERT_GE(recommendations.recommended_priority, 0);
    ASSERT_GE(recommendations.confidence, 0.0);
    ASSERT_LE(recommendations.confidence, 1.0);
}

TEST(AutoSchedulerPerformanceOptimization) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto optimization = scheduler.get_performance_optimization();
    
    ASSERT_GE(optimization.estimated_improvement_percent, 0.0);
    ASSERT_GE(optimization.recommended_changes.size(), 0);
    ASSERT_GT(optimization.timestamp, 0);
}

TEST(AutoSchedulerHistoricalData) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto history = scheduler.get_historical_data();
    
    ASSERT_GE(history.size(), 0);
    
    if (!history.empty()) {
        const auto& latest = history.back();
        ASSERT_GT(latest.timestamp, 0);
        ASSERT_GE(latest.avg_complexity, 0.0);
        ASSERT_GE(latest.avg_execution_time_ms, 0.0);
    }
}

TEST(AutoSchedulerPatternDetection) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto patterns = scheduler.get_detected_patterns();
    
    ASSERT_GE(patterns.size(), 0);
    
    for (const auto& pattern : patterns) {
        ASSERT_GT(pattern.timestamp, 0);
        ASSERT_GE(pattern.confidence, 0.0);
        ASSERT_LE(pattern.confidence, 1.0);
    }
}

TEST(AutoSchedulerSettings) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto settings = scheduler.get_settings();
    
    ASSERT_EQ(scheduler.is_auto_scheduling_enabled(), settings.is_enabled);
    ASSERT_EQ(scheduler.get_strategy(), settings.strategy);
    ASSERT_EQ(scheduler.get_scheduling_recommendations().recommended_worker_count,
              settings.recommendations.recommended_worker_count);
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
    
    MicroJob job;
    job.tasklet_id = 1;
    job.execution_duration = 100;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    scheduler.analyze_job(job);
    
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
    
    MicroJob job;
    job.tasklet_id = 1;
    job.execution_duration = 80;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    scheduler.analyze_job(job);
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    ASSERT_GE(callback_count.load(), 0);
}

TEST(AutoSchedulerForceAnalysis) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto initial_recommendations = scheduler.get_scheduling_recommendations();
    
    scheduler.force_analysis();
    
    auto updated_recommendations = scheduler.get_scheduling_recommendations();
    
    ASSERT_GT(updated_recommendations.recommended_worker_count, 0);
    ASSERT_GE(updated_recommendations.confidence, 0.0);
    ASSERT_LE(updated_recommendations.confidence, 1.0);
}

TEST(AutoSchedulerPerformanceStrategy) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.set_strategy(AutoSchedulerStrategy::PERFORMANCE);
    
    MicroJob job;
    job.tasklet_id = 1;
    job.execution_duration = 200;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    scheduler.analyze_job(job);
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_scheduling_recommendations();
    
    ASSERT_EQ(AutoSchedulerStrategy::PERFORMANCE, scheduler.get_strategy());
    ASSERT_GT(recommendations.confidence, 0.0);
}

TEST(AutoSchedulerEfficiencyStrategy) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.set_strategy(AutoSchedulerStrategy::EFFICIENCY);
    
    MicroJob job;
    job.tasklet_id = 1;
    job.execution_duration = 50;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    scheduler.analyze_job(job);
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_scheduling_recommendations();
    
    ASSERT_EQ(AutoSchedulerStrategy::EFFICIENCY, scheduler.get_strategy());
    ASSERT_GT(recommendations.confidence, 0.0);
}

TEST(AutoSchedulerBalancedStrategy) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.set_strategy(AutoSchedulerStrategy::BALANCED);
    
    MicroJob job;
    job.tasklet_id = 1;
    job.execution_duration = 120;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    scheduler.analyze_job(job);
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_scheduling_recommendations();
    
    ASSERT_EQ(AutoSchedulerStrategy::BALANCED, scheduler.get_strategy());
    ASSERT_GT(recommendations.confidence, 0.0);
}

TEST(AutoSchedulerAdaptiveStrategy) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    scheduler.set_strategy(AutoSchedulerStrategy::ADAPTIVE);
    
    MicroJob job;
    job.tasklet_id = 1;
    job.execution_duration = 180;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    scheduler.analyze_job(job);
    scheduler.force_analysis();
    
    auto recommendations = scheduler.get_scheduling_recommendations();
    
    ASSERT_EQ(AutoSchedulerStrategy::ADAPTIVE, scheduler.get_strategy());
    ASSERT_GT(recommendations.confidence, 0.0);
}

TEST(AutoSchedulerJobComplexityAnalysis) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    MicroJob simple_job;
    simple_job.tasklet_id = 1;
    simple_job.execution_duration = 10;
    simple_job.mark_enqueued();
    simple_job.mark_started();
    simple_job.mark_completed();
    
    scheduler.analyze_job(simple_job);
    
    auto simple_analysis = scheduler.get_job_analysis(simple_job.tasklet_id);
    ASSERT_GT(simple_analysis.complexity_score, 0.0);
    ASSERT_LT(simple_analysis.complexity_score, 0.5);
    
    MicroJob complex_job;
    complex_job.tasklet_id = 2;
    complex_job.execution_duration = 500;
    complex_job.mark_enqueued();
    complex_job.mark_started();
    complex_job.mark_completed();
    
    scheduler.analyze_job(complex_job);
    
    auto complex_analysis = scheduler.get_job_analysis(complex_job.tasklet_id);
    ASSERT_GT(complex_analysis.complexity_score, simple_analysis.complexity_score);
}

TEST(AutoSchedulerWorkloadTrends) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto trends = scheduler.get_workload_trends();
    
    ASSERT_GE(trends.size(), 0);
    
    for (const auto& trend : trends) {
        ASSERT_GT(trend.timestamp, 0);
        ASSERT_GE(trend.complexity_trend, -1.0);
        ASSERT_LE(trend.complexity_trend, 1.0);
        ASSERT_GE(trend.execution_time_trend, -1.0);
        ASSERT_LE(trend.execution_time_trend, 1.0);
    }
}

TEST(AutoSchedulerPerformanceMetrics) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto metrics = scheduler.get_performance_metrics();
    
    ASSERT_GE(metrics.avg_response_time_ms, 0.0);
    ASSERT_GE(metrics.throughput_tasks_per_sec, 0.0);
    ASSERT_GE(metrics.worker_efficiency, 0.0);
    ASSERT_LE(metrics.worker_efficiency, 100.0);
    ASSERT_GE(metrics.resource_utilization, 0.0);
    ASSERT_LE(metrics.resource_utilization, 100.0);
    ASSERT_GT(metrics.timestamp, 0);
}

TEST(AutoSchedulerOptimizationHistory) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto history = scheduler.get_optimization_history();
    
    ASSERT_GE(history.size(), 0);
    
    for (const auto& optimization : history) {
        ASSERT_GT(optimization.timestamp, 0);
        ASSERT_GE(optimization.improvement_percent, 0.0);
        ASSERT_GE(optimization.confidence, 0.0);
        ASSERT_LE(optimization.confidence, 1.0);
    }
}

TEST(AutoSchedulerPatternConfidence) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto patterns = scheduler.get_detected_patterns();
    
    for (const auto& pattern : patterns) {
        ASSERT_GE(pattern.confidence, 0.0);
        ASSERT_LE(pattern.confidence, 1.0);
        
        if (pattern.confidence > 0.8) {
            ASSERT_GT(pattern.timestamp, 0);
        }
    }
}

TEST(AutoSchedulerRecommendationConsistency) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto recommendations1 = scheduler.get_scheduling_recommendations();
    auto recommendations2 = scheduler.get_scheduling_recommendations();
    
    ASSERT_EQ(recommendations1.recommended_worker_count, recommendations2.recommended_worker_count);
    ASSERT_EQ(recommendations1.recommended_timeout_ms, recommendations2.recommended_timeout_ms);
    ASSERT_EQ(recommendations1.recommended_priority, recommendations2.recommended_priority);
    ASSERT_EQ(recommendations1.confidence, recommendations2.confidence);
}

TEST(AutoSchedulerAnalysisConsistency) {
    AutoScheduler& scheduler = AutoScheduler::get_instance();
    
    auto analysis1 = scheduler.get_workload_analysis();
    auto analysis2 = scheduler.get_workload_analysis();
    
    ASSERT_EQ(analysis1.avg_complexity, analysis2.avg_complexity);
    ASSERT_EQ(analysis1.avg_execution_time_ms, analysis2.avg_execution_time_ms);
    ASSERT_EQ(analysis1.throughput_tasks_per_sec, analysis2.throughput_tasks_per_sec);
    ASSERT_EQ(analysis1.worker_utilization, analysis2.worker_utilization);
    ASSERT_EQ(analysis1.timestamp, analysis2.timestamp);
} 