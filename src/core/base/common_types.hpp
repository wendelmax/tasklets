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
 * @file common_types.hpp
 * @brief Common types and enums shared across the Tasklets system
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

namespace tasklets {

/**
 * @brief Workload pattern classification
 */
enum class WorkloadPattern {
    CPU_INTENSIVE,      // CPU-bound tasks
    IO_INTENSIVE,       // I/O-bound tasks
    MEMORY_INTENSIVE,   // Memory-bound tasks
    MIXED,              // Mixed workload
    BURST,              // Burst workload
    STEADY              // Steady workload
};

/**
 * @brief Job complexity estimation
 */
enum class JobComplexity {
    TRIVIAL,    // < 1ms execution time
    SIMPLE,     // 1-10ms execution time
    MODERATE,   // 10-100ms execution time
    COMPLEX,    // 100ms-1s execution time
    HEAVY       // > 1s execution time
};

} // namespace tasklets 