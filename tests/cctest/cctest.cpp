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
 * @file cctest.cpp
 * @brief Simple C++ testing framework implementation
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include <iostream>
#include <iomanip>
#include <algorithm>

namespace cctest {

// Static member initialization
TestRegistry* TestRegistry::instance_ = nullptr;

int TestRunner::run_all() {
    const auto& tests = TestRegistry::instance().get_tests();
    int failed_count = 0;
    
    if (verbose_) {
        std::cout << "Running " << tests.size() << " test(s)..." << std::endl;
        std::cout << std::string(50, '=') << std::endl;
    }
    
    for (const auto& test : tests) {
        auto start_time = std::chrono::high_resolution_clock::now();
        
        try {
            if (verbose_) {
                std::cout << "[ RUN      ] " << test.name << std::endl;
            }
            
            test.function();
            
            auto end_time = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
            
            results_.emplace_back(test.name, TestStatus::PASS, "", duration);
            
            if (verbose_) {
                std::cout << "[       OK ] " << test.name << " (" << duration.count() << " ms)" << std::endl;
            }
            
        } catch (const AssertionError& e) {
            auto end_time = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
            
            results_.emplace_back(test.name, TestStatus::FAIL, e.what(), duration);
            failed_count++;
            
            if (verbose_) {
                std::cout << "[  FAILED  ] " << test.name << " (" << duration.count() << " ms)" << std::endl;
                std::cout << "    " << e.what() << std::endl;
            }
            
        } catch (const std::exception& e) {
            auto end_time = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
            
            results_.emplace_back(test.name, TestStatus::FAIL, "Unexpected exception: " + std::string(e.what()), duration);
            failed_count++;
            
            if (verbose_) {
                std::cout << "[  FAILED  ] " << test.name << " (" << duration.count() << " ms)" << std::endl;
                std::cout << "    Unexpected exception: " << e.what() << std::endl;
            }
        }
    }
    
    if (verbose_) {
        std::cout << std::string(50, '=') << std::endl;
        print_summary();
    }
    
    return failed_count;
}

bool TestRunner::run_test(const std::string& test_name) {
    const auto& tests = TestRegistry::instance().get_tests();
    
    auto it = std::find_if(tests.begin(), tests.end(), 
                          [&test_name](const TestCase& test) {
                              return test.name == test_name;
                          });
    
    if (it == tests.end()) {
        std::cerr << "Test '" << test_name << "' not found." << std::endl;
        return false;
    }
    
    auto start_time = std::chrono::high_resolution_clock::now();
    
    try {
        if (verbose_) {
            std::cout << "[ RUN      ] " << test_name << std::endl;
        }
        
        it->function();
        
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        results_.emplace_back(test_name, TestStatus::PASS, "", duration);
        
        if (verbose_) {
            std::cout << "[       OK ] " << test_name << " (" << duration.count() << " ms)" << std::endl;
        }
        
        return true;
        
    } catch (const AssertionError& e) {
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        results_.emplace_back(test_name, TestStatus::FAIL, e.what(), duration);
        
        if (verbose_) {
            std::cout << "[  FAILED  ] " << test_name << " (" << duration.count() << " ms)" << std::endl;
            std::cout << "    " << e.what() << std::endl;
        }
        
        return false;
        
    } catch (const std::exception& e) {
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        results_.emplace_back(test_name, TestStatus::FAIL, "Unexpected exception: " + std::string(e.what()), duration);
        
        if (verbose_) {
            std::cout << "[  FAILED  ] " << test_name << " (" << duration.count() << " ms)" << std::endl;
            std::cout << "    Unexpected exception: " << e.what() << std::endl;
        }
        
        return false;
    }
}

void TestRunner::print_summary() const {
    int passed = 0;
    int failed = 0;
    int total_time = 0;
    
    for (const auto& result : results_) {
        if (result.status == TestStatus::PASS) {
            passed++;
        } else if (result.status == TestStatus::FAIL) {
            failed++;
        }
        total_time += result.duration.count();
    }
    
    std::cout << std::endl;
    std::cout << "Test Summary:" << std::endl;
    std::cout << "  Total tests: " << results_.size() << std::endl;
    std::cout << "  Passed: " << passed << std::endl;
    std::cout << "  Failed: " << failed << std::endl;
    std::cout << "  Total time: " << total_time << " ms" << std::endl;
    
    if (failed > 0) {
        std::cout << std::endl;
        std::cout << "Failed tests:" << std::endl;
        for (const auto& result : results_) {
            if (result.status == TestStatus::FAIL) {
                std::cout << "  - " << result.name << ": " << result.message << std::endl;
            }
        }
    }
    
    std::cout << std::endl;
    if (failed == 0) {
        std::cout << "All tests passed!" << std::endl;
    } else {
        std::cout << failed << " test(s) failed." << std::endl;
    }
}

} // namespace cctest 