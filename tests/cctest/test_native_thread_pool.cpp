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
 * @file test_native_thread_pool.cpp
 * @brief Tests for the NativeThreadPool class
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/native_thread_pool.hpp"
#include <thread>
#include <chrono>
#include <atomic>
#include <functional>
#include <set>

using namespace tasklets;
using namespace cctest;

TEST(NativeThreadPoolSingleton) {
    // Test singleton pattern
    NativeThreadPool& pool1 = NativeThreadPool::get_instance();
    NativeThreadPool& pool2 = NativeThreadPool::get_instance();
    
    // Both references should point to the same instance
    ASSERT_TRUE(&pool1 == &pool2);
}

TEST(NativeThreadPoolConfiguration) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test default worker thread count (should be > 0)
    size_t default_count = pool.get_worker_thread_count();
    ASSERT_GT(default_count, 0);
    
    // Test setting worker thread count
    pool.set_worker_thread_count(8);
    ASSERT_EQ(8, pool.get_worker_thread_count());
    
    pool.set_worker_thread_count(4);
    ASSERT_EQ(4, pool.get_worker_thread_count());
    
    pool.set_worker_thread_count(1);
    ASSERT_EQ(1, pool.get_worker_thread_count());
    
    // Test setting to 0 (should probably be handled gracefully)
    pool.set_worker_thread_count(0);
    // The implementation should handle this case appropriately
    
    // Restore to a reasonable value
    pool.set_worker_thread_count(default_count);
}

TEST(NativeThreadPoolStats) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Get initial stats
    SchedulerStats stats = pool.get_stats();
    
    // Stats should be initialized
    ASSERT_GE(stats.worker_threads, 0);
    ASSERT_GE(stats.total_threads_created, 0);
    ASSERT_GE(stats.completed_threads, 0);
    ASSERT_GE(stats.failed_threads, 0);
    ASSERT_GE(stats.active_threads, 0);
    ASSERT_GE(stats.total_execution_time_ms, 0);
    ASSERT_GE(stats.average_execution_time_ms, 0.0);
    ASSERT_GE(stats.success_rate, 0.0);
    ASSERT_LE(stats.success_rate, 100.0);
}

TEST(NativeThreadPoolWorkerThreadCount) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test with various worker thread counts
    for (size_t count = 1; count <= 16; count *= 2) {
        pool.set_worker_thread_count(count);
        ASSERT_EQ(count, pool.get_worker_thread_count());
        
        // Check that stats reflect the change
        SchedulerStats stats = pool.get_stats();
        ASSERT_EQ(count, stats.worker_threads);
        ASSERT_EQ(count, stats.worker_utilization.size());
    }
}

TEST(NativeThreadPoolMaxWorkerThreads) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Save original count
    size_t original_count = pool.get_worker_thread_count();
    
    // Test with a large number of worker threads
    pool.set_worker_thread_count(1000);
    ASSERT_EQ(1000, pool.get_worker_thread_count());
    
    // Restore original count
    pool.set_worker_thread_count(original_count);
}

TEST(NativeThreadPoolBasicTaskExecution) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Note: This test depends on libuv integration working
    // In a real environment, this would test actual task execution
    // For now, we'll test the interface
    
    std::atomic<bool> task_executed(false);
    
    auto task = [&task_executed]() {
        task_executed.store(true);
    };
    
    // This call should not crash
    uint64_t tasklet_id = pool.spawn(task);
    
    // Tasklet ID should be non-zero
    ASSERT_GT(tasklet_id, 0);
    
    // In a full integration test, we would:
    // pool.join(tasklet_id);
    // ASSERT_TRUE(task_executed.load());
}

TEST(NativeThreadPoolTaskletIds) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test that tasklet IDs are unique
    std::set<uint64_t> tasklet_ids;
    
    for (int i = 0; i < 10; i++) {
        auto task = []() {};
        uint64_t id = pool.spawn(task);
        
        // ID should be unique
        ASSERT_TRUE(tasklet_ids.find(id) == tasklet_ids.end());
        tasklet_ids.insert(id);
        
        // ID should be non-zero
        ASSERT_GT(id, 0);
    }
}

TEST(NativeThreadPoolResultHandling) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test result handling interface
    // Note: These tests verify the interface but may not work without libuv integration
    
    auto task = []() {};
    uint64_t tasklet_id = pool.spawn(task);
    
    // These calls should not crash
    std::string result = pool.get_result(tasklet_id);
    bool has_error = pool.has_error(tasklet_id);
    std::string error = pool.get_error(tasklet_id);
    
    // Suppress unused variable warnings
    (void)result;
    (void)has_error; 
    (void)error;
    
    // For a non-existent tasklet, the behavior depends on implementation
    // but it should not crash
    std::string result_nonexistent = pool.get_result(999999);
    bool has_error_nonexistent = pool.has_error(999999);
    std::string error_nonexistent = pool.get_error(999999);
    
    // Suppress unused variable warnings
    (void)result_nonexistent;
    (void)has_error_nonexistent;
    (void)error_nonexistent;
}

TEST(NativeThreadPoolStatsConsistency) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Get stats multiple times and verify consistency
    SchedulerStats stats1 = pool.get_stats();
    SchedulerStats stats2 = pool.get_stats();
    
    // Worker thread count should be consistent
    ASSERT_EQ(stats1.worker_threads, stats2.worker_threads);
    
    // Counters should be monotonically increasing or staying the same
    ASSERT_GE(stats2.total_threads_created, stats1.total_threads_created);
    ASSERT_GE(stats2.completed_threads, stats1.completed_threads);
    ASSERT_GE(stats2.failed_threads, stats1.failed_threads);
    ASSERT_GE(stats2.total_execution_time_ms, stats1.total_execution_time_ms);
}

TEST(NativeThreadPoolConcurrentConfiguration) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test concurrent configuration changes
    const int num_threads = 5;
    const int operations_per_thread = 20;
    std::vector<std::thread> threads;
    std::atomic<int> completed_operations(0);
    
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&pool, &completed_operations, operations_per_thread, i]() {
            for (int j = 0; j < operations_per_thread; j++) {
                // Vary worker thread count
                size_t worker_count = (i + j) % 8 + 1; // 1 to 8 workers
                pool.set_worker_thread_count(worker_count);
                
                // Verify the setting
                ASSERT_EQ(worker_count, pool.get_worker_thread_count());
                
                // Get stats
                SchedulerStats stats = pool.get_stats();
                ASSERT_EQ(worker_count, stats.worker_threads);
                
                completed_operations++;
            }
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(num_threads * operations_per_thread, completed_operations.load());
}

TEST(NativeThreadPoolConcurrentStats) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test concurrent stats access
    const int num_threads = 10;
    const int operations_per_thread = 100;
    std::vector<std::thread> threads;
    std::atomic<int> completed_operations(0);
    
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&pool, &completed_operations, operations_per_thread]() {
            for (int j = 0; j < operations_per_thread; j++) {
                // Get stats concurrently
                SchedulerStats stats = pool.get_stats();
                
                // Verify stats are reasonable
                ASSERT_GE(stats.worker_threads, 0);
                ASSERT_GE(stats.total_threads_created, 0);
                ASSERT_GE(stats.completed_threads, 0);
                ASSERT_GE(stats.failed_threads, 0);
                ASSERT_GE(stats.active_threads, 0);
                ASSERT_GE(stats.total_execution_time_ms, 0);
                ASSERT_GE(stats.average_execution_time_ms, 0.0);
                ASSERT_GE(stats.success_rate, 0.0);
                ASSERT_LE(stats.success_rate, 100.0);
                
                completed_operations++;
            }
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(num_threads * operations_per_thread, completed_operations.load());
}

TEST(NativeThreadPoolMultipleTaskSpawning) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test spawning multiple tasks
    std::vector<uint64_t> tasklet_ids;
    
    for (int i = 0; i < 20; i++) {
        auto task = [i]() {
            // Simple task that captures the index
            volatile int x = i * 2;
            (void)x; // Prevent optimization
        };
        
        uint64_t id = pool.spawn(task);
        tasklet_ids.push_back(id);
        
        // Verify ID is unique
        for (size_t j = 0; j < tasklet_ids.size() - 1; j++) {
            ASSERT_NE(id, tasklet_ids[j]);
        }
    }
    
    // All IDs should be unique
    std::set<uint64_t> unique_ids(tasklet_ids.begin(), tasklet_ids.end());
    ASSERT_EQ(tasklet_ids.size(), unique_ids.size());
}

TEST(NativeThreadPoolExceptionHandling) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test spawning a task that throws an exception
    auto throwing_task = []() {
        throw std::runtime_error("Test exception");
    };
    
    // This should not crash
    uint64_t tasklet_id = pool.spawn(throwing_task);
    ASSERT_GT(tasklet_id, 0);
    
    // The exception should be handled by the thread pool
    // In a full integration test, we would verify the error is captured
}

TEST(NativeThreadPoolLargeNumberOfTasks) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Test spawning a large number of tasks
    const int num_tasks = 1000;
    std::vector<uint64_t> tasklet_ids;
    tasklet_ids.reserve(num_tasks);
    
    for (int i = 0; i < num_tasks; i++) {
        auto task = [i]() {
            // Simple computation
            volatile int result = i * i;
            (void)result;
        };
        
        uint64_t id = pool.spawn(task);
        tasklet_ids.push_back(id);
        ASSERT_GT(id, 0);
    }
    
    // All IDs should be unique
    std::set<uint64_t> unique_ids(tasklet_ids.begin(), tasklet_ids.end());
    ASSERT_EQ(static_cast<size_t>(num_tasks), unique_ids.size());
}

TEST(NativeThreadPoolConfigurationLimits) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    // Save original configuration
    size_t original_count = pool.get_worker_thread_count();
    
    // Test edge cases
    pool.set_worker_thread_count(1);
    ASSERT_EQ(1, pool.get_worker_thread_count());
    
    // Test very large number (should be handled gracefully)
    pool.set_worker_thread_count(SIZE_MAX);
    // Implementation should handle this appropriately
    
    // Restore original configuration
    pool.set_worker_thread_count(original_count);
}

// Note: The following tests would require full libuv integration
// and are commented out for reference:

/*
TEST(NativeThreadPoolIntegrationExecution) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    std::atomic<int> execution_count(0);
    
    auto task = [&execution_count]() {
        execution_count.fetch_add(1);
    };
    
    uint64_t tasklet_id = pool.spawn(task);
    pool.join(tasklet_id);
    
    ASSERT_EQ(1, execution_count.load());
}

TEST(NativeThreadPoolIntegrationResults) {
    NativeThreadPool& pool = NativeThreadPool::get_instance();
    
    auto task = []() {
        // This would need to set a result somehow
        return "Test result";
    };
    
    uint64_t tasklet_id = pool.spawn(task);
    pool.join(tasklet_id);
    
    std::string result = pool.get_result(tasklet_id);
    ASSERT_STREQ("Test result", result.c_str());
}
*/ 