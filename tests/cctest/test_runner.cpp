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
 * @file test_runner.cpp
 * @brief Main test runner for Tasklets cctest suite
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include <iostream>
#include <cstring>

// Test files are compiled separately by the build script
// No need to include them here

void print_usage(const char* program_name) {
    std::cout << "Usage: " << program_name << " [options] [test_name]" << std::endl;
    std::cout << "Options:" << std::endl;
    std::cout << "  -h, --help     Show this help message" << std::endl;
    std::cout << "  -v, --verbose  Enable verbose output" << std::endl;
    std::cout << "  -l, --list     List all available tests" << std::endl;
    std::cout << std::endl;
    std::cout << "Examples:" << std::endl;
    std::cout << "  " << program_name << "              # Run all tests" << std::endl;
    std::cout << "  " << program_name << " -v           # Run all tests with verbose output" << std::endl;
    std::cout << "  " << program_name << " test_name    # Run specific test" << std::endl;
    std::cout << "  " << program_name << " -l           # List all available tests" << std::endl;
}

void list_tests() {
    const auto& tests = cctest::TestRegistry::instance().get_tests();
    
    std::cout << "Available tests (" << tests.size() << "):" << std::endl;
    for (const auto& test : tests) {
        std::cout << "  - " << test.name << std::endl;
    }
}

int main(int argc, char* argv[]) {
    bool verbose = false;
    bool list_only = false;
    std::string specific_test;
    
    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        } else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--verbose") == 0) {
            verbose = true;
        } else if (strcmp(argv[i], "-l") == 0 || strcmp(argv[i], "--list") == 0) {
            list_only = true;
        } else {
            // Assume it's a test name
            specific_test = argv[i];
        }
    }
    
    if (list_only) {
        list_tests();
        return 0;
    }
    
    std::cout << "Tasklets C++ Test Suite" << std::endl;
    std::cout << "======================" << std::endl;
    std::cout << std::endl;
    
    cctest::TestRunner runner(verbose);
    
    if (!specific_test.empty()) {
        // Run specific test
        std::cout << "Running test: " << specific_test << std::endl;
        std::cout << std::endl;
        
        bool success = runner.run_test(specific_test);
        
        if (!verbose) {
            runner.print_summary();
        }
        
        return success ? 0 : 1;
    } else {
        // Run all tests
        int failed_count = runner.run_all();
        
        if (!verbose) {
            runner.print_summary();
        }
        
        return failed_count;
    }
} 