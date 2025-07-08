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
#include "../../src/core/base/tasklet.hpp"
#include <thread>
#include <atomic>
#include <chrono>
#include <functional>

using namespace tasklets;
using namespace cctest;

TEST(TaskletConstruction) {
    auto task = []() {
    };
    
    Tasklet tasklet(1, task);
    
    ASSERT_EQ(1, tasklet.get_id());
    ASSERT_FALSE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
    ASSERT_FALSE(tasklet.has_error());
    ASSERT_STREQ("", tasklet.get_result().c_str());
    ASSERT_STREQ("", tasklet.get_error().c_str());
}

TEST(TaskletIdManagement) {
    auto task = []() {};
    
    Tasklet tasklet1(100, task);
    Tasklet tasklet2(200, task);
    Tasklet tasklet3(0, task);
    
    ASSERT_EQ(100, tasklet1.get_id());
    ASSERT_EQ(200, tasklet2.get_id());
    ASSERT_EQ(0, tasklet3.get_id());
    
    Tasklet tasklet4(UINT64_MAX, task);
    ASSERT_EQ(UINT64_MAX, tasklet4.get_id());
}

TEST(TaskletStateManagement) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    ASSERT_FALSE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
    
    tasklet.mark_running();
    ASSERT_TRUE(tasklet.is_running());
    ASSERT_FALSE(tasklet.is_finished());
    
    tasklet.mark_finished();
    ASSERT_TRUE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
}

TEST(TaskletResultHandling) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    ASSERT_STREQ("", tasklet.get_result().c_str());
    
    tasklet.set_result("Test result");
    ASSERT_STREQ("Test result", tasklet.get_result().c_str());
    
    tasklet.set_result("Different result");
    ASSERT_STREQ("Different result", tasklet.get_result().c_str());
    
    tasklet.set_result("");
    ASSERT_STREQ("", tasklet.get_result().c_str());
    
    std::string large_result(1000, 'A');
    tasklet.set_result(large_result);
    ASSERT_STREQ(large_result.c_str(), tasklet.get_result().c_str());
}

TEST(TaskletErrorHandling) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    ASSERT_FALSE(tasklet.has_error());
    ASSERT_STREQ("", tasklet.get_error().c_str());
    
    tasklet.set_error("Test error");
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_STREQ("Test error", tasklet.get_error().c_str());
    
    tasklet.set_error("Different error");
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_STREQ("Different error", tasklet.get_error().c_str());
    
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
    
    ASSERT_FALSE(task_executed.load());
    ASSERT_EQ(0, execution_count.load());
    
    std::function<void()> retrieved_task = tasklet.get_task();
    retrieved_task();
    
    ASSERT_TRUE(task_executed.load());
    ASSERT_EQ(1, execution_count.load());
    
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
    
    tasklet.get_task()();
    
    ASSERT_EQ(42, result.load());
    ASSERT_NOT_NULLPTR(string_ptr.load());
    ASSERT_STREQ("Task executed", string_ptr.load()->c_str());
}

TEST(TaskletComplexTask) {
    std::atomic<int> computation_result(0);
    std::atomic<bool> computation_done(false);
    
    auto complex_task = [&computation_result, &computation_done]() {
        int sum = 0;
        for (int i = 1; i <= 100; i++) {
            sum += i;
        }
        computation_result.store(sum);
        computation_done.store(true);
    };
    
    Tasklet tasklet(1, complex_task);
    
    ASSERT_EQ(0, computation_result.load());
    ASSERT_FALSE(computation_done.load());
    
    tasklet.get_task()();
    
    ASSERT_EQ(5050, computation_result.load());
    ASSERT_TRUE(computation_done.load());
}

TEST(TaskletThreadSafety) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    std::vector<std::thread> threads;
    std::atomic<int> set_result_count(0);
    std::atomic<int> set_error_count(0);
    
    for (int i = 0; i < 10; i++) {
        threads.emplace_back([&tasklet, i, &set_result_count, &set_error_count]() {
            if (i % 2 == 0) {
                tasklet.set_result("Result from thread " + std::to_string(i));
                set_result_count.fetch_add(1);
            } else {
                tasklet.set_error("Error from thread " + std::to_string(i));
                set_error_count.fetch_add(1);
            }
        });
    }
    
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(5, set_result_count.load());
    ASSERT_EQ(5, set_error_count.load());
    
    ASSERT_TRUE(tasklet.has_error());
    ASSERT_FALSE(tasklet.get_result().empty());
}

TEST(TaskletConcurrentExecution) {
    std::atomic<int> counter(0);
    auto task = [&counter]() {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        counter.fetch_add(1);
    };
    
    Tasklet tasklet(1, task);
    
    std::vector<std::thread> threads;
    for (int i = 0; i < 5; i++) {
        threads.emplace_back([&tasklet]() {
            tasklet.get_task()();
        });
    }
    
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(5, counter.load());
}

TEST(TaskletLambdaCapture) {
    int captured_value = 42;
    std::string captured_string = "captured";
    
    auto task = [captured_value, captured_string]() {
        ASSERT_EQ(42, captured_value);
        ASSERT_STREQ("captured", captured_string.c_str());
    };
    
    Tasklet tasklet(1, task);
    tasklet.get_task()();
}

TEST(TaskletMutableLambda) {
    int mutable_value = 0;
    
    auto task = [mutable_value]() mutable {
        mutable_value = 100;
        ASSERT_EQ(100, mutable_value);
    };
    
    Tasklet tasklet(1, task);
    tasklet.get_task()();
}

TEST(TaskletExceptionHandling) {
    auto throwing_task = []() {
        throw std::runtime_error("Test exception");
    };
    
    Tasklet tasklet(1, throwing_task);
    
    try {
        tasklet.get_task()();
        FAIL("Expected exception was not thrown");
    } catch (const std::runtime_error& e) {
        ASSERT_STREQ("Test exception", e.what());
    }
}

TEST(TaskletStateConsistency) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    ASSERT_FALSE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
    ASSERT_FALSE(tasklet.has_error());
    
    tasklet.mark_running();
    ASSERT_TRUE(tasklet.is_running());
    ASSERT_FALSE(tasklet.is_finished());
    
    tasklet.set_result("Success");
    ASSERT_TRUE(tasklet.is_running());
    ASSERT_FALSE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.has_error());
    ASSERT_STREQ("Success", tasklet.get_result().c_str());
    
    tasklet.mark_finished();
    ASSERT_TRUE(tasklet.is_finished());
    ASSERT_FALSE(tasklet.is_running());
    ASSERT_FALSE(tasklet.has_error());
    ASSERT_STREQ("Success", tasklet.get_result().c_str());
}

TEST(TaskletMultipleTaskletInstances) {
    auto task = []() {};
    
    std::vector<std::unique_ptr<Tasklet>> tasklets;
    for (uint64_t i = 0; i < 100; i++) {
        tasklets.emplace_back(std::make_unique<Tasklet>(i, task));
    }
    
    for (size_t i = 0; i < tasklets.size(); i++) {
        ASSERT_EQ(i, tasklets[i]->get_id());
        ASSERT_FALSE(tasklets[i]->is_finished());
        ASSERT_FALSE(tasklets[i]->is_running());
    }
    
    tasklets[50]->set_result("Result 50");
    tasklets[75]->set_error("Error 75");
    
    ASSERT_STREQ("Result 50", tasklets[50]->get_result().c_str());
    ASSERT_STREQ("Error 75", tasklets[75]->get_error().c_str());
    ASSERT_TRUE(tasklets[75]->has_error());
}

TEST(TaskletLargeResultAndError) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    std::string large_result(10000, 'X');
    std::string large_error(10000, 'E');
    
    tasklet.set_result(large_result);
    tasklet.set_error(large_error);
    
    ASSERT_STREQ(large_result.c_str(), tasklet.get_result().c_str());
    ASSERT_STREQ(large_error.c_str(), tasklet.get_error().c_str());
    ASSERT_TRUE(tasklet.has_error());
}

TEST(TaskletSynchronization) {
    auto task = []() {};
    Tasklet tasklet(1, task);
    
    std::atomic<bool> thread_started(false);
    std::atomic<bool> thread_finished(false);
    
    std::thread sync_thread([&tasklet, &thread_started, &thread_finished]() {
        thread_started.store(true);
        tasklet.wait_for_completion();
        thread_finished.store(true);
    });
    
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    ASSERT_TRUE(thread_started.load());
    ASSERT_FALSE(thread_finished.load());
    
    tasklet.notify_completion();
    
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    ASSERT_TRUE(thread_finished.load());
    
    sync_thread.join();
}

TEST(TaskletMoveSemantics) {
    auto task = []() {};
    Tasklet tasklet1(1, task);
    
    tasklet1.set_result("Result 1");
    tasklet1.mark_running();
    
    ASSERT_EQ(1, tasklet1.get_id());
    ASSERT_TRUE(tasklet1.is_running());
    ASSERT_STREQ("Result 1", tasklet1.get_result().c_str());
    
    Tasklet tasklet2(2, task);
    tasklet2.set_error("Error 2");
    
    ASSERT_EQ(2, tasklet2.get_id());
    ASSERT_TRUE(tasklet2.has_error());
    ASSERT_STREQ("Error 2", tasklet2.get_error().c_str());
} 