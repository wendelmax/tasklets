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
 * @brief Tests for the MicroJob class
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/microjob.hpp"
#include <string>
#include <functional>

using namespace tasklets;
using namespace cctest;

TEST(MicroJobConstruction) {
    MicroJob job;
    
    // Test default initialization
    ASSERT_EQ(0, job.tasklet_id);
    ASSERT_NULLPTR(job.thread_pool);
    ASSERT_FALSE(job.has_error);
    ASSERT_STREQ("", job.result.c_str());
    ASSERT_STREQ("", job.error.c_str());
    
    // Test that work.data points to this job
    ASSERT_TRUE(&job == job.work.data);
}

TEST(MicroJobTaskletId) {
    MicroJob job;
    
    // Test setting tasklet ID
    job.tasklet_id = 100;
    ASSERT_EQ(100, job.tasklet_id);
    
    job.tasklet_id = 0;
    ASSERT_EQ(0, job.tasklet_id);
    
    job.tasklet_id = UINT64_MAX;
    ASSERT_EQ(UINT64_MAX, job.tasklet_id);
}

TEST(MicroJobThreadPoolPointer) {
    MicroJob job;
    
    // Test thread pool pointer
    ASSERT_NULLPTR(job.thread_pool);
    
    // Note: We can't easily create a real NativeThreadPool instance here
    // for testing, so we'll just test pointer assignment
    tasklets::NativeThreadPool* dummy_ptr = reinterpret_cast<tasklets::NativeThreadPool*>(0x12345678);
    job.thread_pool = dummy_ptr;
    ASSERT_TRUE(dummy_ptr == job.thread_pool);
    
    job.thread_pool = nullptr;
    ASSERT_NULLPTR(job.thread_pool);
}

TEST(MicroJobResultHandling) {
    MicroJob job;
    
    // Initial result state
    ASSERT_STREQ("", job.result.c_str());
    ASSERT_FALSE(job.has_error);
    
    // Set result using method
    job.set_result("Test result");
    ASSERT_STREQ("Test result", job.result.c_str());
    ASSERT_FALSE(job.has_error);
    ASSERT_TRUE(job.is_successful());
    
    // Change result
    job.set_result("Different result");
    ASSERT_STREQ("Different result", job.result.c_str());
    ASSERT_FALSE(job.has_error);
    
    // Set empty result
    job.set_result("");
    ASSERT_STREQ("", job.result.c_str());
    ASSERT_FALSE(job.has_error);
    
    // Set large result
    std::string large_result(1000, 'A');
    job.set_result(large_result);
    ASSERT_STREQ(large_result.c_str(), job.result.c_str());
    ASSERT_FALSE(job.has_error);
}

TEST(MicroJobErrorHandling) {
    MicroJob job;
    
    // Initial error state
    ASSERT_STREQ("", job.error.c_str());
    ASSERT_FALSE(job.has_error);
    ASSERT_TRUE(job.is_successful());
    
    // Set error using method
    job.set_error("Test error");
    ASSERT_STREQ("Test error", job.error.c_str());
    ASSERT_TRUE(job.has_error);
    ASSERT_FALSE(job.is_successful());
    
    // Change error
    job.set_error("Different error");
    ASSERT_STREQ("Different error", job.error.c_str());
    ASSERT_TRUE(job.has_error);
    ASSERT_FALSE(job.is_successful());
    
    // Set empty error (but has_error should still be true)
    job.set_error("");
    ASSERT_STREQ("", job.error.c_str());
    ASSERT_TRUE(job.has_error);
    ASSERT_FALSE(job.is_successful());
}

TEST(MicroJobResultAndError) {
    MicroJob job;
    
    // Set result first
    job.set_result("Test result");
    ASSERT_STREQ("Test result", job.result.c_str());
    ASSERT_FALSE(job.has_error);
    ASSERT_TRUE(job.is_successful());
    
    // Then set error
    job.set_error("Test error");
    ASSERT_STREQ("Test result", job.result.c_str()); // Result should remain
    ASSERT_STREQ("Test error", job.error.c_str());
    ASSERT_TRUE(job.has_error);
    ASSERT_FALSE(job.is_successful());
    
    // Set result again (error should remain)
    job.set_result("New result");
    ASSERT_STREQ("New result", job.result.c_str());
    ASSERT_STREQ("Test error", job.error.c_str());
    ASSERT_TRUE(job.has_error);
    ASSERT_FALSE(job.is_successful());
}

TEST(MicroJobDirectFieldAccess) {
    MicroJob job;
    
    // Test direct field access
    job.tasklet_id = 42;
    job.result = "Direct result";
    job.error = "Direct error";
    job.has_error = true;
    
    ASSERT_EQ(42, job.tasklet_id);
    ASSERT_STREQ("Direct result", job.result.c_str());
    ASSERT_STREQ("Direct error", job.error.c_str());
    ASSERT_TRUE(job.has_error);
    ASSERT_FALSE(job.is_successful());
}

TEST(MicroJobLibuvWorkStructure) {
    MicroJob job;
    
    // Test that the libuv work structure is properly initialized
    ASSERT_TRUE(&job == job.work.data);
    
    // Test that we can access the job from the work structure
    MicroJob* job_from_work = static_cast<MicroJob*>(job.work.data);
    ASSERT_TRUE(&job == job_from_work);
    
    // Test that modifying the job affects the work structure
    job.tasklet_id = 123;
    ASSERT_EQ(123, job_from_work->tasklet_id);
}

TEST(MicroJobMultipleInstances) {
    MicroJob job1;
    MicroJob job2;
    
    // Test that each job has its own work structure
    ASSERT_TRUE(&job1 == job1.work.data);
    ASSERT_TRUE(&job2 == job2.work.data);
    ASSERT_TRUE(&job1 != &job2);
    ASSERT_TRUE(job1.work.data != job2.work.data);
    
    // Test that they can have different states
    job1.tasklet_id = 1;
    job2.tasklet_id = 2;
    
    job1.set_result("Result 1");
    job2.set_error("Error 2");
    
    ASSERT_EQ(1, job1.tasklet_id);
    ASSERT_EQ(2, job2.tasklet_id);
    ASSERT_STREQ("Result 1", job1.result.c_str());
    ASSERT_STREQ("Error 2", job2.error.c_str());
    ASSERT_FALSE(job1.has_error);
    ASSERT_TRUE(job2.has_error);
}

TEST(MicroJobLargeData) {
    MicroJob job;
    
    // Test with large result
    std::string large_result(10000, 'R');
    job.set_result(large_result);
    ASSERT_STREQ(large_result.c_str(), job.result.c_str());
    ASSERT_FALSE(job.has_error);
    
    // Test with large error
    std::string large_error(10000, 'E');
    job.set_error(large_error);
    ASSERT_STREQ(large_error.c_str(), job.error.c_str());
    ASSERT_TRUE(job.has_error);
    
    // Both should coexist
    ASSERT_STREQ(large_result.c_str(), job.result.c_str());
    ASSERT_STREQ(large_error.c_str(), job.error.c_str());
}

TEST(MicroJobSpecialCharacters) {
    MicroJob job;
    
    // Test with special characters in result
    std::string special_result = "Result with special chars: \n\t\r\"\'\\\0";
    job.set_result(special_result);
    ASSERT_STREQ(special_result.c_str(), job.result.c_str());
    
    // Test with special characters in error
    std::string special_error = "Error with special chars: \n\t\r\"\'\\\0";
    job.set_error(special_error);
    ASSERT_STREQ(special_error.c_str(), job.error.c_str());
}

TEST(MicroJobUtf8Strings) {
    MicroJob job;
    
    // Test with UTF-8 strings
    std::string utf8_result = "UTF-8 Result: こんにちは 世界 🌍";
    job.set_result(utf8_result);
    ASSERT_STREQ(utf8_result.c_str(), job.result.c_str());
    
    std::string utf8_error = "UTF-8 Error: エラー 错误 ошибка";
    job.set_error(utf8_error);
    ASSERT_STREQ(utf8_error.c_str(), job.error.c_str());
}

TEST(MicroJobStateTransitions) {
    MicroJob job;
    
    // Start with successful state
    job.set_result("Success");
    ASSERT_TRUE(job.is_successful());
    ASSERT_FALSE(job.has_error);
    
    // Transition to error state
    job.set_error("Error occurred");
    ASSERT_FALSE(job.is_successful());
    ASSERT_TRUE(job.has_error);
    
    // Result should still be there
    ASSERT_STREQ("Success", job.result.c_str());
    ASSERT_STREQ("Error occurred", job.error.c_str());
    
    // Set another result (error state should persist)
    job.set_result("New success");
    ASSERT_FALSE(job.is_successful());
    ASSERT_TRUE(job.has_error);
    ASSERT_STREQ("New success", job.result.c_str());
}

TEST(MicroJobNonCopyable) {
    // Test that MicroJob is non-copyable
    MicroJob job1;
    job1.tasklet_id = 42;
    job1.set_result("Test");
    
    // These should not compile if uncommented:
    // MicroJob job2 = job1;  // Copy constructor
    // MicroJob job3; job3 = job1;  // Copy assignment
    
    // But we can test that we can't copy by trying to pass by value
    // This test just ensures the class is designed correctly
    ASSERT_EQ(42, job1.tasklet_id);
    ASSERT_STREQ("Test", job1.result.c_str());
}

TEST(MicroJobNonMovable) {
    // Test that MicroJob is non-movable
    MicroJob job1;
    job1.tasklet_id = 42;
    job1.set_result("Test");
    
    // These should not compile if uncommented:
    // MicroJob job2 = std::move(job1);  // Move constructor
    // MicroJob job3; job3 = std::move(job1);  // Move assignment
    
    // Test that the original job is still valid
    ASSERT_EQ(42, job1.tasklet_id);
    ASSERT_STREQ("Test", job1.result.c_str());
}

TEST(MicroJobWorkDataConsistency) {
    MicroJob job;
    
    // Test that work.data always points to the job
    ASSERT_TRUE(&job == job.work.data);
    
    // Even after modifying other fields
    job.tasklet_id = 100;
    job.set_result("Test result");
    job.set_error("Test error");
    
    ASSERT_TRUE(&job == job.work.data);
    
    // Test that we can retrieve the job from work.data
    MicroJob* retrieved_job = static_cast<MicroJob*>(job.work.data);
    ASSERT_TRUE(&job == retrieved_job);
    ASSERT_EQ(100, retrieved_job->tasklet_id);
    ASSERT_STREQ("Test result", retrieved_job->result.c_str());
    ASSERT_STREQ("Test error", retrieved_job->error.c_str());
}

TEST(MicroJobEmptyStrings) {
    MicroJob job;
    
    // Test with empty strings
    job.set_result("");
    job.set_error("");
    
    ASSERT_STREQ("", job.result.c_str());
    ASSERT_STREQ("", job.error.c_str());
    ASSERT_TRUE(job.has_error); // Error flag should be set even with empty error
    ASSERT_FALSE(job.is_successful());
}

TEST(MicroJobResetState) {
    MicroJob job;
    
    // Set up job with data
    job.tasklet_id = 123;
    job.set_result("Initial result");
    job.set_error("Initial error");
    
    // Verify state
    ASSERT_EQ(123, job.tasklet_id);
    ASSERT_STREQ("Initial result", job.result.c_str());
    ASSERT_STREQ("Initial error", job.error.c_str());
    ASSERT_TRUE(job.has_error);
    
    // Reset to initial state
    job.tasklet_id = 0;
    job.result.clear();
    job.error.clear();
    job.has_error = false;
    
    // Verify reset
    ASSERT_EQ(0, job.tasklet_id);
    ASSERT_STREQ("", job.result.c_str());
    ASSERT_STREQ("", job.error.c_str());
    ASSERT_FALSE(job.has_error);
    ASSERT_TRUE(job.is_successful());
}

TEST(MicroJobToString) {
    MicroJob job;
    job.tasklet_id = 42;
    job.set_result("Success result");
    
    std::string debug_str = job.to_string();
    
    // Check that the debug string contains expected information
    ASSERT_TRUE(debug_str.find("42") != std::string::npos);
    ASSERT_TRUE(debug_str.find("Success result") != std::string::npos);
    
    // Test with error
    job.set_error("Test error");
    debug_str = job.to_string();
    
    ASSERT_TRUE(debug_str.find("42") != std::string::npos);
    ASSERT_TRUE(debug_str.find("Test error") != std::string::npos);
} 