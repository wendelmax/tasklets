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
 * @file test_tasklet.cpp
 * @brief Tests for the Tasklet class
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/tasklet.hpp"
#include <thread>
#include <atomic>
#include <chrono>
#include <functional>

using namespace tasklets;
using namespace cctest;

TEST(TaskletConstruction) {
    // Test tasklet construction with simple task
    auto task = []() {
        // Simple task that does nothing
    };
    
    Tasklet tasklet(1, task);
    
    // Check initial state
    ASSERT_EQ(1, tasklet.get_id());
    ASSERT_FALSE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
    ASSERT_FALSE(tasklet.has_error());
    ASSERT_STREQ("", tasklet.get_result().c_str());
    ASSERT_STREQ("", tasklet.get_error().c_str());
}

TEST(TaskletIdManagement) {
    // Test different tasklet IDs
    auto task = []() {};
    
    Tasklet tasklet1(100, task);
    Tasklet tasklet2(200, task);
    Tasklet tasklet3(0, task);
    
    ASSERT_EQ(100, tasklet1.get_id());
    ASSERT_EQ(200, tasklet2.get_id());
    ASSERT_EQ(0, tasklet3.get_id());
    
    // Test with maximum uint64_t value
    Tasklet tasklet4(UINT64_MAX, task);
    ASSERT_EQ(UINT64_MAX, tasklet4.get_id());
}

TEST(TaskletStateManagement) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    // Initial state
    ASSERT_FALSE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
    
    // Mark as running
    tasklet.mark_running();
    ASSERT_TRUE(tasklet.is_running());
    ASSERT_FALSE(tasklet.is_finished());
    
    // Mark as finished (automatically sets running to false)
    tasklet.mark_finished();
    ASSERT_TRUE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running()); // Should be false after mark_finished()
}

TEST(TaskletResultHandling) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    // Initial result should be empty
    ASSERT_STREQ("", tasklet.get_result().c_str());
    
    // Set result
    tasklet.set_result("Test result");
    ASSERT_STREQ("Test result", tasklet.get_result().c_str());
    
    // Change result
    tasklet.set_result("Different result");
    ASSERT_STREQ("Different result", tasklet.get_result().c_str());
    
    // Set empty result
    tasklet.set_result("");
    ASSERT_STREQ("", tasklet.get_result().c_str());
    
    // Set large result
    std::string large_result(1000, 'A');
    tasklet.set_result(large_result);
    ASSERT_STREQ(large_result.c_str(), tasklet.get_result().c_str());
}

TEST(TaskletErrorHandling) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    // Initial error state
    ASSERT_FALSE(tasklet.has_error());
    ASSERT_STREQ("", tasklet.get_error().c_str());
    
    // Set error
    tasklet.set_error("Test error");
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_STREQ("Test error", tasklet.get_error().c_str());
    
    // Change error
    tasklet.set_error("Different error");
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_STREQ("Different error", tasklet.get_error().c_str());
    
    // Error should persist even if we set result
    tasklet.set_result("Some result");
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_STREQ("Different error", tasklet.get_error().c_str());
    ASSERT_STREQ("Some result", tasklet.get_result().c_str());
}

TEST(TaskletTaskExecution) {
    std::atomic<bool> task_executed(false);
    std::atomic<int> execution_count(0);
    
    auto task = [&task_executed, &execution_count]() {
        task_executed.store(true);
        execution_count.fetch_add(1);
    };
    
    Tasklet tasklet(1, task);
    
    // Task should not be executed yet
    ASSERT_FALSE(task_executed.load());
    ASSERT_EQ(0, execution_count.load());
    
    // Execute task
    std::function<void()> retrieved_task = tasklet.get_task();
    retrieved_task();
    
    // Task should be executed
    ASSERT_TRUE(task_executed.load());
    ASSERT_EQ(1, execution_count.load());
    
    // Execute again
    retrieved_task();
    ASSERT_EQ(2, execution_count.load());
}

TEST(TaskletTaskWithParameters) {
    std::atomic<int> result(0);
    std::atomic<std::string*> string_ptr(nullptr);
    
    auto task = [&result, &string_ptr]() {
        result.store(42);
        static std::string test_string = "Task executed";
        string_ptr.store(&test_string);
    };
    
    Tasklet tasklet(1, task);
    
    // Execute task
    tasklet.get_task()();
    
    // Check results
    ASSERT_EQ(42, result.load());
    ASSERT_NOT_NULLPTR(string_ptr.load());
    ASSERT_STREQ("Task executed", string_ptr.load()->c_str());
}

TEST(TaskletComplexTask) {
    std::atomic<int> computation_result(0);
    std::atomic<bool> computation_done(false);
    
    auto complex_task = [&computation_result, &computation_done]() {
        // Simulate some complex computation
        int sum = 0;
        for (int i = 1; i <= 100; i++) {
            sum += i;
        }
        computation_result.store(sum);
        computation_done.store(true);
    };
    
    Tasklet tasklet(1, complex_task);
    
    // Execute task
    tasklet.get_task()();
    
    // Check computation result (sum of 1 to 100 = 5050)
    ASSERT_EQ(5050, computation_result.load());
    ASSERT_TRUE(computation_done.load());
}

TEST(TaskletThreadSafety) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    const int num_threads = 10;
    const int operations_per_thread = 100;
    std::vector<std::thread> threads;
    std::atomic<int> completed_operations(0);
    
    // Create threads that modify tasklet state
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&tasklet, &completed_operations, operations_per_thread, i]() {
            for (int j = 0; j < operations_per_thread; j++) {
                // Mark states (note: these are one-way operations)
                if (j % 3 == 0) {
                    tasklet.mark_running();
                } else if (j % 3 == 1) {
                    tasklet.mark_finished();
                }
                
                // Set result and error
                tasklet.set_result("Result from thread " + std::to_string(i) + " operation " + std::to_string(j));
                tasklet.set_error("Error from thread " + std::to_string(i) + " operation " + std::to_string(j));
                
                // Read state (should be thread-safe)
                volatile bool is_running = tasklet.is_running();
                volatile bool is_finished = tasklet.is_finished();
                volatile bool has_error = tasklet.has_error();
                
                // Prevent compiler optimization
                (void)is_running;
                (void)is_finished;
                (void)has_error;
                
                completed_operations++;
            }
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(num_threads * operations_per_thread, completed_operations.load());
    
    // Tasklet should have some error and result set
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_TRUE(tasklet.get_result().length() > 0);
    ASSERT_TRUE(tasklet.get_error().length() > 0);
}

TEST(TaskletConcurrentExecution) {
    std::atomic<int> execution_count(0);
    
    auto task = [&execution_count]() {
        execution_count.fetch_add(1);
        // Small delay to simulate work
        std::this_thread::sleep_for(std::chrono::microseconds(10));
    };
    
    Tasklet tasklet(1, task);
    
    const int num_threads = 5;
    std::vector<std::thread> threads;
    
    // Create threads that execute the same task
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&tasklet]() {
            tasklet.get_task()();
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    // Task should be executed by all threads
    ASSERT_EQ(num_threads, execution_count.load());
}

TEST(TaskletLambdaCapture) {
    int captured_value = 100;
    std::atomic<int> result(0);
    
    // Lambda that captures by value
    auto task = [captured_value, &result]() {
        result.store(captured_value * 2);
    };
    
    Tasklet tasklet(1, task);
    
    // Execute task
    tasklet.get_task()();
    
    ASSERT_EQ(200, result.load());
    
    // Modify original value (should not affect the captured value)
    captured_value = 500;
    tasklet.get_task()();
    
    // Result should still be 200 (captured value was 100)
    ASSERT_EQ(200, result.load());
}

TEST(TaskletMutableLambda) {
    std::atomic<int> execution_count(0);
    
    // Mutable lambda that modifies captured value
    auto task = [execution_count = 0]() mutable {
        execution_count++;
        // Note: This modification is local to the lambda
    };
    
    Tasklet tasklet(1, task);
    
    // Execute task multiple times
    for (int i = 0; i < 5; i++) {
        tasklet.get_task()();
    }
    
    // Original atomic counter should not change
    ASSERT_EQ(0, execution_count.load());
}

TEST(TaskletExceptionHandling) {
    // Task that throws exception
    auto throwing_task = []() {
        throw std::runtime_error("Test exception");
    };
    
    Tasklet tasklet(1, throwing_task);
    
    // Execute task - should not crash the test
    // Note: Exception handling would be done by the thread pool
    bool exception_caught = false;
    
    try {
        tasklet.get_task()();
    } catch (const std::runtime_error& e) {
        exception_caught = true;
        ASSERT_STREQ("Test exception", e.what());
    }
    
    ASSERT_TRUE(exception_caught);
}

TEST(TaskletStateConsistency) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    // Test state consistency
    ASSERT_FALSE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
    ASSERT_FALSE(tasklet.has_error());
    
    // Mark running, then finished
    tasklet.mark_running();
    ASSERT_TRUE(tasklet.is_running());
    ASSERT_FALSE(tasklet.is_finished());
    
    tasklet.mark_finished();
    ASSERT_FALSE(tasklet.is_running()); // mark_finished() sets running to false
    ASSERT_TRUE(tasklet.is_finished());
    
    // Add error
    tasklet.set_error("Test error");
    
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_TRUE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
}

TEST(TaskletMultipleTaskletInstances) {
    std::atomic<int> task1_count(0);
    std::atomic<int> task2_count(0);
    
    auto task1 = [&task1_count]() {
        task1_count.fetch_add(1);
    };
    
    auto task2 = [&task2_count]() {
        task2_count.fetch_add(1);
    };
    
    Tasklet tasklet1(1, task1);
    Tasklet tasklet2(2, task2);
    
    // Execute tasks
    tasklet1.get_task()();
    tasklet2.get_task()();
    
    ASSERT_EQ(1, task1_count.load());
    ASSERT_EQ(1, task2_count.load());
    
    // Execute again
    tasklet1.get_task()();
    tasklet1.get_task()();
    tasklet2.get_task()();
    
    ASSERT_EQ(3, task1_count.load());
    ASSERT_EQ(2, task2_count.load());
    
    // Verify IDs are different
    ASSERT_NE(tasklet1.get_id(), tasklet2.get_id());
}

TEST(TaskletLargeResultAndError) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    // Test with large result string
    std::string large_result(10000, 'R');
    tasklet.set_result(large_result);
    ASSERT_STREQ(large_result.c_str(), tasklet.get_result().c_str());
    
    // Test with large error string
    std::string large_error(10000, 'E');
    tasklet.set_error(large_error);
    ASSERT_STREQ(large_error.c_str(), tasklet.get_error().c_str());
    ASSERT_TRUE(tasklet.has_error());
    
    // Both should coexist
    ASSERT_STREQ(large_result.c_str(), tasklet.get_result().c_str());
    ASSERT_STREQ(large_error.c_str(), tasklet.get_error().c_str());
} 