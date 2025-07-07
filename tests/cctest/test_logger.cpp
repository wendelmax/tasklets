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
 * @file test_logger.cpp
 * @brief Tests for the Logger class
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/logger.hpp"
#include <thread>
#include <vector>
#include <sstream>
#include <iostream>
#include <atomic>

using namespace tasklets;
using namespace cctest;

TEST(LoggerDefaultLevel) {
    // Test default log level
    LogLevel initial_level = Logger::get_level();
    ASSERT_EQ(static_cast<int>(LogLevel::INFO), static_cast<int>(initial_level));
}

TEST(LoggerSetGetLevel) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    // Test setting and getting different levels
    Logger::set_level(LogLevel::DEBUG);
    ASSERT_EQ(static_cast<int>(LogLevel::DEBUG), static_cast<int>(Logger::get_level()));
    
    Logger::set_level(LogLevel::ERROR);
    ASSERT_EQ(static_cast<int>(LogLevel::ERROR), static_cast<int>(Logger::get_level()));
    
    Logger::set_level(LogLevel::TRACE);
    ASSERT_EQ(static_cast<int>(LogLevel::TRACE), static_cast<int>(Logger::get_level()));
    
    Logger::set_level(LogLevel::OFF);
    ASSERT_EQ(static_cast<int>(LogLevel::OFF), static_cast<int>(Logger::get_level()));
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerIsEnabled) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    // Test with INFO level
    Logger::set_level(LogLevel::INFO);
    ASSERT_TRUE(Logger::is_enabled(LogLevel::ERROR));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::WARN));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::INFO));
    ASSERT_FALSE(Logger::is_enabled(LogLevel::DEBUG));
    ASSERT_FALSE(Logger::is_enabled(LogLevel::TRACE));
    
    // Test with DEBUG level
    Logger::set_level(LogLevel::DEBUG);
    ASSERT_TRUE(Logger::is_enabled(LogLevel::ERROR));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::WARN));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::INFO));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::DEBUG));
    ASSERT_FALSE(Logger::is_enabled(LogLevel::TRACE));
    
    // Test with OFF level
    Logger::set_level(LogLevel::OFF);
    ASSERT_FALSE(Logger::is_enabled(LogLevel::ERROR));
    ASSERT_FALSE(Logger::is_enabled(LogLevel::WARN));
    ASSERT_FALSE(Logger::is_enabled(LogLevel::INFO));
    ASSERT_FALSE(Logger::is_enabled(LogLevel::DEBUG));
    ASSERT_FALSE(Logger::is_enabled(LogLevel::TRACE));
    
    // Test with TRACE level (everything enabled)
    Logger::set_level(LogLevel::TRACE);
    ASSERT_TRUE(Logger::is_enabled(LogLevel::ERROR));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::WARN));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::INFO));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::DEBUG));
    ASSERT_TRUE(Logger::is_enabled(LogLevel::TRACE));
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerThreadSafety) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    const int num_threads = 10;
    const int operations_per_thread = 100;
    std::atomic<int> completed_threads(0);
    std::vector<std::thread> threads;
    
    // Create multiple threads that set log levels and check them
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&completed_threads, operations_per_thread, i]() {
            for (int j = 0; j < operations_per_thread; j++) {
                LogLevel level = static_cast<LogLevel>((i + j) % 6); // 0-5 for different levels
                Logger::set_level(level);
                
                // Verify the level was set (though it might be overridden by other threads)
                LogLevel current_level = Logger::get_level();
                ASSERT_GE(static_cast<int>(current_level), 0);
                ASSERT_LE(static_cast<int>(current_level), 5);
                
                // Test is_enabled for various levels
                Logger::is_enabled(LogLevel::ERROR);
                Logger::is_enabled(LogLevel::WARN);
                Logger::is_enabled(LogLevel::INFO);
                Logger::is_enabled(LogLevel::DEBUG);
                Logger::is_enabled(LogLevel::TRACE);
            }
            completed_threads++;
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(num_threads, completed_threads.load());
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerLogMessages) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    // Set to INFO level for testing
    Logger::set_level(LogLevel::INFO);
    
    // Test that log methods don't crash
    // Note: We can't easily test output without redirecting stdout/stderr
    // These calls should at least not crash
    Logger::error("TestComponent", "Test error message");
    Logger::warn("TestComponent", "Test warning message");
    Logger::info("TestComponent", "Test info message");
    Logger::debug("TestComponent", "Test debug message (should not appear)");
    Logger::trace("TestComponent", "Test trace message (should not appear)");
    
    // Test with different log levels
    Logger::set_level(LogLevel::ERROR);
    Logger::error("TestComponent", "Error level test");
    Logger::warn("TestComponent", "Warning should not appear");
    
    Logger::set_level(LogLevel::TRACE);
    Logger::trace("TestComponent", "Trace level test");
    Logger::debug("TestComponent", "Debug level test");
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerGenericLog) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    // Test the generic log method
    Logger::set_level(LogLevel::DEBUG);
    
    // These should not crash
    Logger::log(LogLevel::ERROR, "Component", "Error message");
    Logger::log(LogLevel::WARN, "Component", "Warning message");
    Logger::log(LogLevel::INFO, "Component", "Info message");
    Logger::log(LogLevel::DEBUG, "Component", "Debug message");
    Logger::log(LogLevel::TRACE, "Component", "Trace message (should not appear)");
    
    // Test with OFF level - nothing should be logged
    Logger::set_level(LogLevel::OFF);
    Logger::log(LogLevel::ERROR, "Component", "This should not appear");
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerMacros) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    // Test the convenience macros
    Logger::set_level(LogLevel::DEBUG);
    
    // These should not crash
    TASKLETS_LOG_ERROR("MacroTest", "Error via macro");
    TASKLETS_LOG_WARN("MacroTest", "Warning via macro");
    TASKLETS_LOG_INFO("MacroTest", "Info via macro");
    TASKLETS_LOG_DEBUG("MacroTest", "Debug via macro");
    TASKLETS_LOG_TRACE("MacroTest", "Trace via macro (should not appear)");
    
    // Test with TRACE level
    Logger::set_level(LogLevel::TRACE);
    TASKLETS_LOG_TRACE("MacroTest", "Trace via macro");
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerComponentNames) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    Logger::set_level(LogLevel::INFO);
    
    // Test with different component names
    Logger::info("", "Empty component name");
    Logger::info("VeryLongComponentNameThatShouldStillWork", "Long component name");
    Logger::info("Test123", "Alphanumeric component name");
    Logger::info("Test-Component_Name", "Special characters in component name");
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerEmptyMessages) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    Logger::set_level(LogLevel::INFO);
    
    // Test with empty messages
    Logger::error("TestComponent", "");
    Logger::warn("TestComponent", "");
    Logger::info("TestComponent", "");
    Logger::debug("TestComponent", "");
    Logger::trace("TestComponent", "");
    
    // Restore original level
    Logger::set_level(original_level);
}

TEST(LoggerConcurrentLogging) {
    // Save current level
    LogLevel original_level = Logger::get_level();
    
    Logger::set_level(LogLevel::INFO);
    
    const int num_threads = 5;
    const int messages_per_thread = 10;
    std::vector<std::thread> threads;
    std::atomic<int> completed_messages(0);
    
    // Create multiple threads that log messages concurrently
    for (int i = 0; i < num_threads; i++) {
        threads.emplace_back([&completed_messages, messages_per_thread, i]() {
            for (int j = 0; j < messages_per_thread; j++) {
                std::string component = "Thread" + std::to_string(i);
                std::string message = "Message " + std::to_string(j);
                
                Logger::info(component, message);
                Logger::warn(component, message);
                Logger::error(component, message);
                
                completed_messages++;
            }
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(num_threads * messages_per_thread, completed_messages.load());
    
    // Restore original level
    Logger::set_level(original_level);
} 