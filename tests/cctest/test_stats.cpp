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
 * @file test_stats.cpp
 * @brief Tests for StatsCollector and SchedulerStats classes
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/stats.hpp"
#include <thread>
#include <vector>
#include <atomic>
#include <chrono>

using namespace tasklets;
using namespace cctest;

TEST(SchedulerStatsDefault) {
    // Test default constructor
    SchedulerStats stats;
    
    ASSERT_EQ(0, stats.active_threads);
    ASSERT_EQ(0, stats.total_threads_created);
    ASSERT_EQ(0, stats.completed_threads);
    ASSERT_EQ(0, stats.failed_threads);
    ASSERT_EQ(0, stats.worker_threads);
    ASSERT_EQ(0, stats.total_execution_time_ms);
    ASSERT_EQ(0.0, stats.average_execution_time_ms);
    ASSERT_EQ(0.0, stats.success_rate);
    ASSERT_TRUE(stats.worker_utilization.empty());
}

TEST(SchedulerStatsCalculations) {
    SchedulerStats stats;
    
    // Test with no threads created
    stats.calculate_derived_stats();
    ASSERT_EQ(0.0, stats.success_rate);
    ASSERT_EQ(0.0, stats.average_execution_time_ms);
    
    // Test with some completed threads
    stats.total_threads_created = 100;
    stats.completed_threads = 80;
    stats.failed_threads = 20;
    stats.total_execution_time_ms = 4000; // 4 seconds total
    
    stats.calculate_derived_stats();
    ASSERT_EQ(80.0, stats.success_rate); // 80% success rate
    ASSERT_EQ(50.0, stats.average_execution_time_ms); // 4000ms / 80 completed = 50ms average
    
    // Test with 100% success rate
    stats.total_threads_created = 50;
    stats.completed_threads = 50;
    stats.failed_threads = 0;
    stats.total_execution_time_ms = 2500;
    
    stats.calculate_derived_stats();
    ASSERT_EQ(100.0, stats.success_rate);
    ASSERT_EQ(50.0, stats.average_execution_time_ms);
    
    // Test with 0% success rate
    stats.total_threads_created = 10;
    stats.completed_threads = 0;
    stats.failed_threads = 10;
    stats.total_execution_time_ms = 0;
    
    stats.calculate_derived_stats();
    ASSERT_EQ(0.0, stats.success_rate);
    ASSERT_EQ(0.0, stats.average_execution_time_ms);
}

TEST(SchedulerStatsToString) {
    SchedulerStats stats;
    stats.active_threads = 5;
    stats.total_threads_created = 100;
    stats.completed_threads = 85;
    stats.failed_threads = 15;
    stats.success_rate = 85.0;
    
    std::string str = stats.to_string();
    
    // Check that the string contains expected values
    ASSERT_TRUE(str.find("active=5") != std::string::npos);
    ASSERT_TRUE(str.find("total=100") != std::string::npos);
    ASSERT_TRUE(str.find("completed=85") != std::string::npos);
    ASSERT_TRUE(str.find("failed=15") != std::string::npos);
    ASSERT_TRUE(str.find("success_rate=85") != std::string::npos);
}

TEST(StatsCollectorDefault) {
    StatsCollector collector;
    
    SchedulerStats stats = collector.get_stats();
    
    ASSERT_EQ(0, stats.active_threads);
    ASSERT_EQ(0, stats.total_threads_created);
    ASSERT_EQ(0, stats.completed_threads);
    ASSERT_EQ(0, stats.failed_threads);
    ASSERT_GT(stats.worker_threads, 0); // Should detect CPU cores
    ASSERT_EQ(0, stats.total_execution_time_ms);
    ASSERT_EQ(0.0, stats.average_execution_time_ms);
    ASSERT_EQ(0.0, stats.success_rate);
}

TEST(StatsCollectorRecordThreadCreated) {
    StatsCollector collector;
    
    // Record several thread creations
    collector.record_thread_created();
    collector.record_thread_created();
    collector.record_thread_created();
    
    SchedulerStats stats = collector.get_stats();
    ASSERT_EQ(3, stats.total_threads_created);
    ASSERT_EQ(0, stats.completed_threads);
    ASSERT_EQ(0, stats.failed_threads);
}

TEST(StatsCollectorRecordThreadCompleted) {
    StatsCollector collector;
    
    // Record some completions with different execution times
    collector.record_thread_completed(100); // 100ms
    collector.record_thread_completed(200); // 200ms
    collector.record_thread_completed(300); // 300ms
    
    SchedulerStats stats = collector.get_stats();
    ASSERT_EQ(3, stats.completed_threads);
    ASSERT_EQ(600, stats.total_execution_time_ms); // 100 + 200 + 300
    ASSERT_EQ(200.0, stats.average_execution_time_ms); // 600 / 3
}

TEST(StatsCollectorRecordThreadFailed) {
    StatsCollector collector;
    
    // Record some failures
    collector.record_thread_failed();
    collector.record_thread_failed();
    
    SchedulerStats stats = collector.get_stats();
    ASSERT_EQ(2, stats.failed_threads);
    ASSERT_EQ(0, stats.completed_threads);
}

TEST(StatsCollectorUpdateActiveThreads) {
    StatsCollector collector;
    
    // Update active thread count
    collector.update_active_threads(10);
    
    SchedulerStats stats = collector.get_stats();
    ASSERT_EQ(10, stats.active_threads);
    
    // Update again
    collector.update_active_threads(5);
    stats = collector.get_stats();
    ASSERT_EQ(5, stats.active_threads);
}

TEST(StatsCollectorSetWorkerThreadCount) {
    StatsCollector collector;
    
    // Set worker thread count
    collector.set_worker_thread_count(8);
    
    SchedulerStats stats = collector.get_stats();
    ASSERT_EQ(8, stats.worker_threads);
    ASSERT_EQ(8, stats.worker_utilization.size());
    
    // Change worker thread count
    collector.set_worker_thread_count(4);
    stats = collector.get_stats();
    ASSERT_EQ(4, stats.worker_threads);
    ASSERT_EQ(4, stats.worker_utilization.size());
}

TEST(StatsCollectorReset) {
    StatsCollector collector;
    
    // Add some data
    collector.record_thread_created();
    collector.record_thread_created();
    collector.record_thread_completed(100);
    collector.record_thread_failed();
    collector.update_active_threads(5);
    collector.set_worker_thread_count(8);
    
    SchedulerStats stats = collector.get_stats();
    ASSERT_EQ(2, stats.total_threads_created);
    ASSERT_EQ(1, stats.completed_threads);
    ASSERT_EQ(1, stats.failed_threads);
    ASSERT_EQ(5, stats.active_threads);
    ASSERT_EQ(8, stats.worker_threads);
    
    // Reset stats
    collector.reset();
    
    stats = collector.get_stats();
    ASSERT_EQ(0, stats.total_threads_created);
    ASSERT_EQ(0, stats.completed_threads);
    ASSERT_EQ(0, stats.failed_threads);
    ASSERT_EQ(0, stats.active_threads);
    ASSERT_EQ(0, stats.total_execution_time_ms);
    ASSERT_EQ(8, stats.worker_threads); // Worker thread count should NOT be reset
}

TEST(StatsCollectorThreadSafety) {
    StatsCollector collector;
    
    const int num_threads = 10;
    const int operations_per_thread = 100;
    std::vector<std::thread> threads;
    std::atomic<int> completed_operations(0);
    
    // Create multiple threads that perform stats operations
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&collector, &completed_operations, operations_per_thread]() {
            for (int j = 0; j < operations_per_thread; j++) {
                // Perform various operations
                collector.record_thread_created();
                collector.record_thread_completed(j % 100); // Varying execution times
                
                if (j % 10 == 0) {
                    collector.record_thread_failed();
                }
                
                if (j % 5 == 0) {
                    collector.update_active_threads(j % 20);
                }
                
                // Get stats (this should be thread-safe)
                SchedulerStats stats = collector.get_stats();
                ASSERT_GE(stats.total_threads_created, 0);
                ASSERT_GE(stats.completed_threads, 0);
                ASSERT_GE(stats.failed_threads, 0);
                
                completed_operations++;
            }
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(num_threads * operations_per_thread, completed_operations.load());
    
    // Verify final stats make sense
    SchedulerStats final_stats = collector.get_stats();
    ASSERT_EQ(num_threads * operations_per_thread, final_stats.total_threads_created);
    ASSERT_EQ(num_threads * operations_per_thread, final_stats.completed_threads);
    ASSERT_EQ(num_threads * operations_per_thread / 10, final_stats.failed_threads);
    ASSERT_GT(final_stats.total_execution_time_ms, 0);
}

TEST(StatsCollectorComplexScenario) {
    StatsCollector collector;
    
    // Simulate a complex scenario with mixed operations
    collector.set_worker_thread_count(4);
    
    // Simulate creating and completing some threads
    for (int i = 0; i < 50; i++) {
        collector.record_thread_created();
    }
    
    for (int i = 0; i < 40; i++) {
        collector.record_thread_completed(50 + i * 10); // 50ms to 440ms
    }
    
    // Simulate some failures
    for (int i = 0; i < 10; i++) {
        collector.record_thread_failed();
    }
    
    // Update active threads
    collector.update_active_threads(15);
    
    SchedulerStats stats = collector.get_stats();
    
    // Verify the stats
    ASSERT_EQ(50, stats.total_threads_created);
    ASSERT_EQ(40, stats.completed_threads);
    ASSERT_EQ(10, stats.failed_threads);
    ASSERT_EQ(15, stats.active_threads);
    ASSERT_EQ(4, stats.worker_threads);
    ASSERT_EQ(4, stats.worker_utilization.size());
    
    // Check calculated stats
    ASSERT_EQ(80.0, stats.success_rate); // 40/50 = 80%
    ASSERT_GT(stats.average_execution_time_ms, 0);
    ASSERT_GT(stats.total_execution_time_ms, 0);
    
    // Expected total execution time: 50 + 60 + 70 + ... + 440
    // This is an arithmetic sequence: sum = n/2 * (first + last) = 40/2 * (50 + 440) = 20 * 490 = 9800
    ASSERT_EQ(9800, stats.total_execution_time_ms);
    ASSERT_EQ(245.0, stats.average_execution_time_ms); // 9800 / 40 = 245
}

TEST(StatsCollectorConcurrentResetAndOperations) {
    StatsCollector collector;
    
    const int num_threads = 5;
    const int operations_per_thread = 50;
    std::vector<std::thread> threads;
    std::atomic<bool> should_stop(false);
    
    // Create threads that perform operations
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&collector, &should_stop, operations_per_thread]() {
            for (int j = 0; j < operations_per_thread && !should_stop.load(); j++) {
                collector.record_thread_created();
                collector.record_thread_completed(j);
                
                if (j % 10 == 0) {
                    collector.record_thread_failed();
                }
                
                // Small delay to allow interleaving
                std::this_thread::sleep_for(std::chrono::microseconds(10));
            }
        });
    }
    
    // Create a thread that periodically resets stats
    std::thread reset_thread([&collector, &should_stop]() {
        for (int i = 0; i < 5; i++) {
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
            collector.reset();
        }
        should_stop.store(true);
    });
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    reset_thread.join();
    
    // After reset, stats should be mostly zeros (except worker thread count)
    SchedulerStats final_stats = collector.get_stats();
    ASSERT_GE(final_stats.worker_threads, 0);
    // Other stats may be non-zero due to operations after the last reset
}

TEST(StatsCollectorMixedOperations) {
    StatsCollector collector;
    
    // Test a realistic mixed scenario
    collector.set_worker_thread_count(8);
    
    // Simulate 1000 threads created
    for (int i = 0; i < 1000; i++) {
        collector.record_thread_created();
    }
    
    // 800 completed successfully
    for (int i = 0; i < 800; i++) {
        collector.record_thread_completed(25 + i % 100); // 25-124ms execution times
    }
    
    // 200 failed
    for (int i = 0; i < 200; i++) {
        collector.record_thread_failed();
    }
    
    // Active threads fluctuate
    collector.update_active_threads(50);
    
    SchedulerStats stats = collector.get_stats();
    
    ASSERT_EQ(1000, stats.total_threads_created);
    ASSERT_EQ(800, stats.completed_threads);
    ASSERT_EQ(200, stats.failed_threads);
    ASSERT_EQ(50, stats.active_threads);
    ASSERT_EQ(8, stats.worker_threads);
    ASSERT_EQ(80.0, stats.success_rate); // 800/1000 = 80%
    ASSERT_GT(stats.average_execution_time_ms, 0);
    ASSERT_GT(stats.total_execution_time_ms, 0);
} 