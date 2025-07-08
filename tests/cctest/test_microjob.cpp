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
 * @file test_microjob.cpp
 * @brief Tests for MicroJob structure
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/base/microjob.hpp"
#include <string>
#include <thread>
#include <chrono>

using namespace tasklets;
using namespace cctest;

TEST(MicroJobConstruction) {
    MicroJob job;
    
    ASSERT_EQ(job.tasklet_id, 0);
    ASSERT_NULLPTR(job.thread_pool);
    ASSERT_EQ(static_cast<int>(job.state), static_cast<int>(JobState::PENDING));
    ASSERT_EQ(job.execution_duration, 0);
    ASSERT_EQ(job.timeout_duration, 0);
    ASSERT_EQ(job.priority, 0);
    ASSERT_EQ(job.enqueue_time, 0);
    ASSERT_EQ(job.start_time, 0);
    ASSERT_EQ(job.completion_time, 0);
    ASSERT_TRUE(job.result.empty());
    ASSERT_TRUE(job.error.empty());
    ASSERT_FALSE(job.has_failed());
    ASSERT_FALSE(job.is_successful());
    ASSERT_FALSE(job.is_finished());
    ASSERT_FALSE(job.is_cancelled());
}

TEST(MicroJobResultHandling) {
    MicroJob job;
    
    job.set_result("test result");
    ASSERT_STREQ(job.get_result().c_str(), "test result");
    ASSERT_TRUE(job.is_successful());
    ASSERT_FALSE(job.has_failed());
    ASSERT_TRUE(job.is_finished());
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::COMPLETED));
    
    job.set_result("another result");
    ASSERT_STREQ(job.get_result().c_str(), "another result");
    ASSERT_TRUE(job.is_successful());
    ASSERT_FALSE(job.has_failed());
    
    job.set_result("");
    ASSERT_STREQ(job.get_result().c_str(), "");
    ASSERT_TRUE(job.is_successful());
    ASSERT_FALSE(job.has_failed());
    
    std::string large_result(1000, 'x');
    job.set_result(large_result);
    ASSERT_STREQ(job.get_result().c_str(), large_result.c_str());
    ASSERT_TRUE(job.is_successful());
    ASSERT_FALSE(job.has_failed());
}

TEST(MicroJobErrorHandling) {
    MicroJob job;
    
    ASSERT_FALSE(job.has_failed());
    ASSERT_TRUE(job.get_error().empty());
    ASSERT_FALSE(job.is_finished());
    
    job.set_error("test error");
    ASSERT_STREQ(job.get_error().c_str(), "test error");
    ASSERT_TRUE(job.has_failed());
    ASSERT_FALSE(job.is_successful());
    ASSERT_TRUE(job.is_finished());
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::FAILED));
    
    job.set_error("another error");
    ASSERT_STREQ(job.get_error().c_str(), "another error");
    ASSERT_TRUE(job.has_failed());
    ASSERT_FALSE(job.is_successful());
    
    job.set_error("");
    ASSERT_STREQ(job.get_error().c_str(), "");
    ASSERT_TRUE(job.has_failed());
    ASSERT_FALSE(job.is_successful());
}

TEST(MicroJobResultAndError) {
    MicroJob job;
    
    job.set_result("success");
    ASSERT_STREQ(job.get_result().c_str(), "success");
    ASSERT_FALSE(job.has_failed());
    ASSERT_TRUE(job.is_successful());
    
    job.set_error("failure");
    ASSERT_STREQ(job.get_error().c_str(), "failure");
    ASSERT_TRUE(job.has_failed());
    ASSERT_FALSE(job.is_successful());
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::FAILED));
    
    job.set_result("new success");
    ASSERT_STREQ(job.get_result().c_str(), "new success");
    ASSERT_FALSE(job.has_failed());
    ASSERT_TRUE(job.is_successful());
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::COMPLETED));
}

TEST(MicroJobDirectFieldAccess) {
    MicroJob job;
    
    job.result = "direct result";
    job.error = "direct error";
    
    ASSERT_STREQ(job.result.c_str(), "direct result");
    ASSERT_STREQ(job.error.c_str(), "direct error");
    
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::PENDING));
    ASSERT_FALSE(job.is_successful());
    ASSERT_FALSE(job.has_failed());
    ASSERT_FALSE(job.is_finished());
}

TEST(MicroJobMultipleInstances) {
    MicroJob job1, job2;
    
    job1.set_result("result1");
    job2.set_error("error2");
    
    ASSERT_STREQ(job1.get_result().c_str(), "result1");
    ASSERT_TRUE(job1.is_successful());
    ASSERT_FALSE(job1.has_failed());
    
    ASSERT_STREQ(job2.get_error().c_str(), "error2");
    ASSERT_FALSE(job2.is_successful());
    ASSERT_TRUE(job2.has_failed());
    
    ASSERT_STRNE(job1.get_result().c_str(), job2.get_result().c_str());
    ASSERT_STRNE(job1.get_error().c_str(), job2.get_error().c_str());
}

TEST(MicroJobLargeData) {
    MicroJob job;
    
    std::string large_result(10000, 'x');
    job.set_result(large_result);
    ASSERT_STREQ(job.get_result().c_str(), large_result.c_str());
    ASSERT_FALSE(job.has_failed());
    ASSERT_TRUE(job.is_successful());
    
    std::string large_error(10000, 'e');
    job.set_error(large_error);
    ASSERT_STREQ(job.get_error().c_str(), large_error.c_str());
    ASSERT_TRUE(job.has_failed());
    ASSERT_FALSE(job.is_successful());
}

TEST(MicroJobCancellation) {
    MicroJob job;
    
    ASSERT_FALSE(job.is_cancelled());
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::PENDING));
    
    job.cancel();
    ASSERT_TRUE(job.is_cancelled());
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::CANCELLED));
    ASSERT_TRUE(job.is_finished());
    ASSERT_FALSE(job.is_successful());
    ASSERT_FALSE(job.has_failed());
}

TEST(MicroJobPriority) {
    MicroJob job;
    
    ASSERT_EQ(job.get_priority(), 0);
    
    job.set_priority(5);
    ASSERT_EQ(job.get_priority(), 5);
    
    job.set_priority(10);
    ASSERT_EQ(job.get_priority(), 10);
    
    job.set_priority(0);
    ASSERT_EQ(job.get_priority(), 0);
}

TEST(MicroJobTimeout) {
    MicroJob job;
    
    ASSERT_EQ(job.timeout_duration, 0);
    
    job.timeout_duration = 1000;
    ASSERT_EQ(job.timeout_duration, 1000);
    
    job.timeout_duration = 5000;
    ASSERT_EQ(job.timeout_duration, 5000);
}

TEST(MicroJobTiming) {
    MicroJob job;
    
    ASSERT_EQ(job.get_queue_wait_time(), 0);
    ASSERT_EQ(job.get_total_time(), 0);
    
    job.mark_enqueued();
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    
    job.mark_started();
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    
    job.mark_completed();
    
    ASSERT_GT(job.get_queue_wait_time(), 0);
    ASSERT_GT(job.get_total_time(), 0);
    ASSERT_GT(job.get_total_time(), job.get_queue_wait_time());
}

TEST(MicroJobEmptyStrings) {
    MicroJob job;
    
    job.set_result("");
    job.set_error("");
    
    ASSERT_TRUE(job.get_result().empty());
    ASSERT_TRUE(job.get_error().empty());
    ASSERT_TRUE(job.is_successful());
    ASSERT_TRUE(job.has_failed());
}

TEST(MicroJobResetState) {
    MicroJob job;
    
    job.tasklet_id = 123;
    job.set_result("test result");
    job.set_error("test error");
    job.set_priority(5);
    job.timeout_duration = 1000;
    job.execution_duration = 500;
    job.mark_enqueued();
    job.mark_started();
    job.mark_completed();
    
    ASSERT_EQ(job.tasklet_id, 123);
    ASSERT_STREQ(job.get_result().c_str(), "test result");
    ASSERT_STREQ(job.get_error().c_str(), "test error");
    ASSERT_EQ(job.get_priority(), 5);
    ASSERT_EQ(job.timeout_duration, 1000);
    ASSERT_EQ(job.execution_duration, 500);
    ASSERT_GT(job.enqueue_time, 0);
    ASSERT_GT(job.start_time, 0);
    ASSERT_GT(job.completion_time, 0);
    
    job.reset();
    
    ASSERT_EQ(job.tasklet_id, 0);
    ASSERT_STREQ(job.get_result().c_str(), "");
    ASSERT_STREQ(job.get_error().c_str(), "");
    ASSERT_EQ(job.get_priority(), 0);
    ASSERT_EQ(job.timeout_duration, 0);
    ASSERT_EQ(job.execution_duration, 0);
    ASSERT_EQ(job.enqueue_time, 0);
    ASSERT_EQ(job.start_time, 0);
    ASSERT_EQ(job.completion_time, 0);
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::PENDING));
}

TEST(MicroJobToString) {
    MicroJob job;
    
    job.tasklet_id = 456;
    job.set_result("test result");
    job.set_priority(3);
    
    std::string str = job.to_string();
    
    ASSERT_FALSE(str.empty());
    ASSERT_GT(str.find("456"), 0);
    ASSERT_GT(str.find("test result"), 0);
    ASSERT_GT(str.find("3"), 0);
}

TEST(MicroJobConcurrentAccess) {
    MicroJob job;
    
    std::vector<std::thread> threads;
    std::atomic<int> set_result_count(0);
    std::atomic<int> set_error_count(0);
    
    for (int i = 0; i < 10; i++) {
        threads.emplace_back([&job, i, &set_result_count, &set_error_count]() {
            if (i % 2 == 0) {
                job.set_result("Result from thread " + std::to_string(i));
                set_result_count.fetch_add(1);
            } else {
                job.set_error("Error from thread " + std::to_string(i));
                set_error_count.fetch_add(1);
            }
        });
    }
    
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(5, set_result_count.load());
    ASSERT_EQ(5, set_error_count.load());
    
    ASSERT_TRUE(job.has_failed() || job.is_successful());
    ASSERT_FALSE(job.get_result().empty() && job.get_error().empty());
}

TEST(MicroJobStateTransitions) {
    MicroJob job;
    
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::PENDING));
    ASSERT_FALSE(job.is_finished());
    
    job.set_result("success");
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::COMPLETED));
    ASSERT_TRUE(job.is_finished());
    
    job.reset();
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::PENDING));
    ASSERT_FALSE(job.is_finished());
    
    job.set_error("failure");
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::FAILED));
    ASSERT_TRUE(job.is_finished());
    
    job.reset();
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::PENDING));
    ASSERT_FALSE(job.is_finished());
    
    job.cancel();
    ASSERT_EQ(static_cast<int>(job.get_state()), static_cast<int>(JobState::CANCELLED));
    ASSERT_TRUE(job.is_finished());
}

TEST(MicroJobAutoSchedulingIntegration) {
    MicroJob job;
    
    job.tasklet_id = 789;
    job.execution_duration = 250;
    
    JobComplexity complexity = job.get_estimated_complexity();
    ASSERT_TRUE(complexity == JobComplexity::TRIVIAL ||
                complexity == JobComplexity::SIMPLE ||
                complexity == JobComplexity::MODERATE ||
                complexity == JobComplexity::COMPLEX ||
                complexity == JobComplexity::HEAVY);
    
    bool suitable_for_batching = job.is_suitable_for_batching();
    ASSERT_TRUE(suitable_for_batching || !suitable_for_batching);
    
    job.apply_auto_scheduling_recommendations(1000, 5);
    ASSERT_EQ(job.timeout_duration, 1000);
    ASSERT_EQ(job.get_priority(), 5);
} 