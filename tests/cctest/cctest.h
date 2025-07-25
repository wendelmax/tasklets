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
 * @file cctest.h
 * @brief Simple C++ testing framework for tasklets
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <string>
#include <vector>
#include <functional>
#include <iostream>
#include <memory>
#include <chrono>
#include <sstream>
#include <type_traits>
// Include relevant enum headers
#include "../../src/core/automation/auto_scheduler.hpp"
#include "../../src/core/base/common_types.hpp"

// String conversion functions for enums
// Use template specialization, not overloading

template<typename T>
std::string enum_to_string(T value) {
    std::ostringstream oss;
    oss << static_cast<int>(value);
    return oss.str();
}

template<>
inline std::string enum_to_string<tasklets::AutoScheduler::AutoSchedulingStrategy>(tasklets::AutoScheduler::AutoSchedulingStrategy strategy) {
    switch (strategy) {
        case tasklets::AutoScheduler::AutoSchedulingStrategy::CONSERVATIVE:
            return "CONSERVATIVE";
        case tasklets::AutoScheduler::AutoSchedulingStrategy::MODERATE:
            return "MODERATE";
        case tasklets::AutoScheduler::AutoSchedulingStrategy::AGGRESSIVE:
            return "AGGRESSIVE";
        default:
            return "UNKNOWN";
    }
}

template<>
inline std::string enum_to_string<tasklets::WorkloadPattern>(tasklets::WorkloadPattern pattern) {
    switch (pattern) {
        case tasklets::WorkloadPattern::CPU_INTENSIVE:
            return "CPU_INTENSIVE";
        case tasklets::WorkloadPattern::IO_INTENSIVE:
            return "IO_INTENSIVE";
        case tasklets::WorkloadPattern::MEMORY_INTENSIVE:
            return "MEMORY_INTENSIVE";
        case tasklets::WorkloadPattern::MIXED:
            return "MIXED";
        case tasklets::WorkloadPattern::BURST:
            return "BURST";
        case tasklets::WorkloadPattern::STEADY:
            return "STEADY";
        default:
            return "UNKNOWN";
    }
}

template<>
inline std::string enum_to_string<tasklets::JobComplexity>(tasklets::JobComplexity complexity) {
    switch (complexity) {
        case tasklets::JobComplexity::TRIVIAL:
            return "TRIVIAL";
        case tasklets::JobComplexity::SIMPLE:
            return "SIMPLE";
        case tasklets::JobComplexity::MODERATE:
            return "MODERATE";
        case tasklets::JobComplexity::COMPLEX:
            return "COMPLEX";
        case tasklets::JobComplexity::HEAVY:
            return "HEAVY";
        default:
            return "UNKNOWN";
    }
}

// Helper to select correct string conversion
// Use SFINAE to select enum or non-enum
// For enums

template<typename T>
typename std::enable_if<std::is_enum<T>::value, std::string>::type
safe_to_string(const T& value) {
    return enum_to_string<T>(value);
}
// For nullptr
inline std::string safe_to_string(std::nullptr_t) {
    return "<nullptr>";
}
// For pointers
template<typename T>
std::string safe_to_string(T* ptr) {
    if (!ptr) return "<nullptr>";
    std::ostringstream oss;
    oss << ptr;
    return oss.str();
}
// For types with std::to_string
// (integral, floating point)
template<typename T>
typename std::enable_if<std::is_arithmetic<T>::value, std::string>::type
safe_to_string(const T& value) {
    return std::to_string(value);
}
// For types that do not match above, fallback
// (e.g. unique_ptr, shared_ptr, classes)
template<typename T>
typename std::enable_if<!std::is_enum<T>::value && !std::is_arithmetic<T>::value && !std::is_pointer<T>::value, std::string>::type
safe_to_string(const T&) {
    return "<unprintable type>";
}

namespace cctest {

/**
 * @brief Test result status
 */
enum class TestStatus {
    PASS,
    FAIL,
    SKIP
};

/**
 * @brief Test result information
 */
struct TestResult {
    std::string name;
    TestStatus status;
    std::string message;
    std::chrono::milliseconds duration;
    
    TestResult(const std::string& test_name, TestStatus test_status, 
               const std::string& test_message = "", 
               std::chrono::milliseconds test_duration = std::chrono::milliseconds(0))
        : name(test_name), status(test_status), message(test_message), duration(test_duration) {}
};

/**
 * @brief Test case function type
 */
using TestFunction = std::function<void()>;

/**
 * @brief Test case registration
 */
struct TestCase {
    std::string name;
    TestFunction function;
    
    TestCase(const std::string& test_name, TestFunction test_function)
        : name(test_name), function(test_function) {}
};

/**
 * @brief Test registry for managing test cases
 */
class TestRegistry {
private:
    std::vector<TestCase> tests_;
    static TestRegistry* instance_;
    
public:
    static TestRegistry& instance() {
        if (!instance_) {
            instance_ = new TestRegistry();
        }
        return *instance_;
    }
    
    void register_test(const std::string& name, TestFunction function) {
        tests_.emplace_back(name, function);
    }
    
    const std::vector<TestCase>& get_tests() const {
        return tests_;
    }
};

/**
 * @brief Test runner class
 */
class TestRunner {
private:
    std::vector<TestResult> results_;
    bool verbose_;
    
public:
    TestRunner(bool verbose = false) : verbose_(verbose) {}
    
    /**
     * @brief Run all registered tests
     * @return Number of failed tests
     */
    int run_all();
    
    /**
     * @brief Run a specific test by name
     * @param test_name Name of the test to run
     * @return True if test passed, false otherwise
     */
    bool run_test(const std::string& test_name);
    
    /**
     * @brief Print test results summary
     */
    void print_summary() const;
    
    /**
     * @brief Get test results
     * @return Vector of test results
     */
    const std::vector<TestResult>& get_results() const {
        return results_;
    }
};

/**
 * @brief Test assertion exception
 */
class AssertionError : public std::exception {
private:
    std::string message_;
    
public:
    AssertionError(const std::string& message) : message_(message) {}
    
    const char* what() const noexcept override {
        return message_.c_str();
    }
};

/**
 * @brief Test registration helper
 */
class TestRegistrar {
public:
    TestRegistrar(const std::string& name, TestFunction function) {
        TestRegistry::instance().register_test(name, function);
    }
};

// Assertion macros
#define ASSERT_TRUE(condition) \
    do { \
        if (!(condition)) { \
            throw cctest::AssertionError("ASSERT_TRUE failed: " #condition " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_FALSE(condition) \
    do { \
        if (condition) { \
            throw cctest::AssertionError("ASSERT_FALSE failed: " #condition " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_EQ(expected, actual) \
    do { \
        if ((expected) != (actual)) { \
            throw cctest::AssertionError("ASSERT_EQ failed: expected " + safe_to_string(expected) + " but got " + safe_to_string(actual) + " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_NE(expected, actual) \
    do { \
        if ((expected) == (actual)) { \
            throw cctest::AssertionError("ASSERT_NE failed: expected " + safe_to_string(expected) + " != " + safe_to_string(actual) + " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_LT(left, right) \
    do { \
        if ((left) >= (right)) { \
            throw cctest::AssertionError("ASSERT_LT failed: " + std::to_string(left) + " >= " + std::to_string(right) + " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_LE(left, right) \
    do { \
        if ((left) > (right)) { \
            throw cctest::AssertionError("ASSERT_LE failed: " + std::to_string(left) + " > " + std::to_string(right) + " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_GT(left, right) \
    do { \
        if ((left) <= (right)) { \
            throw cctest::AssertionError("ASSERT_GT failed: " + std::to_string(left) + " <= " + std::to_string(right) + " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_GE(left, right) \
    do { \
        if ((left) < (right)) { \
            throw cctest::AssertionError("ASSERT_GE failed: " + std::to_string(left) + " < " + std::to_string(right) + " at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_STREQ(expected, actual) \
    do { \
        std::string exp_str = (expected); \
        std::string act_str = (actual); \
        if (exp_str != act_str) { \
            throw cctest::AssertionError("ASSERT_STREQ failed: expected \"" + exp_str + "\" but got \"" + act_str + "\" at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_STRNE(expected, actual) \
    do { \
        std::string exp_str = (expected); \
        std::string act_str = (actual); \
        if (exp_str == act_str) { \
            throw cctest::AssertionError("ASSERT_STRNE failed: expected \"" + exp_str + "\" != \"" + act_str + "\" at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_NULLPTR(ptr) \
    do { \
        if ((ptr) != nullptr) { \
            throw cctest::AssertionError("ASSERT_NULLPTR failed: pointer is not null at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define ASSERT_NOT_NULLPTR(ptr) \
    do { \
        if ((ptr) == nullptr) { \
            throw cctest::AssertionError("ASSERT_NOT_NULLPTR failed: pointer is null at " __FILE__ ":" + std::to_string(__LINE__)); \
        } \
    } while (0)

#define FAIL(message) \
    do { \
        throw cctest::AssertionError("FAIL: " + std::string(message) + " at " __FILE__ ":" + std::to_string(__LINE__)); \
    } while (0)

// Test registration macro
#define TEST(test_name) \
    void test_##test_name(); \
    static cctest::TestRegistrar test_##test_name##_registrar(#test_name, test_##test_name); \
    void test_##test_name()

// Manual test registration macro
#define REGISTER_TEST(test_function) \
    static cctest::TestRegistrar test_##test_function##_registrar(#test_function, test_function)

} // namespace cctest 