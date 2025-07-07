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

#pragma once

/**
 * @file tasklets.hpp
 * @brief Main header for the Tasklets library
 * @author Jackson Wendel Santos Sá
 * @date 2025
 * @version 1.0.0
 * 
 * This is the primary include file for the Tasklets library.
 * Include this file to access all public APIs and components.
 * 
 * @example
 * ```cpp
 * #include "tasklets.hpp"
 * 
 * using namespace tasklets;
 * 
 * // Use any tasklets component
 * auto& pool = NativeThreadPool::get_instance();
 * auto stats = pool.get_stats();
 * ```
 */

#include <thread>

// Core tasklets components
#include "core/tasklet.hpp"
#include "core/microjob.hpp"
#include "core/native_thread_pool.hpp"
#include "core/stats.hpp"
#include "core/logger.hpp"

// System includes for adaptive configuration
#include <unistd.h>  // for sysconf

// N-API bindings (for internal use)
#include "bindings/napi_wrapper.hpp"

/**
 * @brief Main namespace for all tasklets functionality
 */
namespace tasklets {

// =====================================================================
// Library Information
// =====================================================================

/**
 * @brief Library version information
 */
struct Version {
    static constexpr int MAJOR = 1;
    static constexpr int MINOR = 0;
    static constexpr int PATCH = 0;
    
    /**
     * @brief Get version as string
     * @return Version string in format "MAJOR.MINOR.PATCH"
     */
    static const char* as_string() {
        return "1.0.0";
    }
};

// =====================================================================
// Configuration Constants
// =====================================================================

/**
 * @brief Default configuration values
 */
namespace config {
    /// Default number of worker threads in the thread pool (auto-detected based on CPU cores)
    inline size_t get_default_worker_threads() {
        const auto hardware_threads = std::thread::hardware_concurrency();
        return hardware_threads > 0 ? hardware_threads : 4;
    }
    
    /// Constant for backward compatibility - use get_default_worker_threads() for dynamic detection
    constexpr size_t DEFAULT_WORKER_THREADS = 4;
    
    /// Get maximum worker threads based on system capabilities
    inline size_t get_max_worker_threads() {
        const auto hardware_threads = std::thread::hardware_concurrency();
        // Allow up to 4x CPU cores for I/O bound tasks, with reasonable upper limit
        return hardware_threads > 0 ? std::min(static_cast<size_t>(hardware_threads * 4), static_cast<size_t>(512)) : 128;
    }
    
    /// Constant for backward compatibility
    constexpr size_t MAX_WORKER_THREADS = 128;
    
    /// Minimum number of worker threads allowed
    constexpr size_t MIN_WORKER_THREADS = 1;
    
    /// Get default stack size based on available memory
    inline size_t get_default_stack_size() {
        // Basic heuristic: more memory = larger default stack
        // TODO: Add system memory detection for more accurate sizing
        const auto hardware_threads = std::thread::hardware_concurrency();
        if (hardware_threads >= 16) return 128 * 1024; // 128KB for high-core systems
        if (hardware_threads >= 8) return 96 * 1024;   // 96KB for mid-range systems
        return 64 * 1024;                               // 64KB for lower-end systems
    }
    
    /// Get maximum stack size based on system capabilities
    inline size_t get_max_stack_size() {
        const auto hardware_threads = std::thread::hardware_concurrency();
        // More cores typically means more memory available
        if (hardware_threads >= 16) return 2 * 1024 * 1024; // 2MB for high-end
        if (hardware_threads >= 8) return 1536 * 1024;      // 1.5MB for mid-range
        return 1024 * 1024;                                  // 1MB for standard
    }
    
    /// Get adaptive polling interval based on system load
    inline size_t get_adaptive_poll_interval_ms() {
        const auto hardware_threads = std::thread::hardware_concurrency();
        // Higher-end systems can poll more frequently for better responsiveness
        if (hardware_threads >= 16) return 1;  // 1ms for high-end systems
        if (hardware_threads >= 8) return 2;   // 2ms for mid-range systems
        if (hardware_threads >= 4) return 3;   // 3ms for standard systems
        return 5;                               // 5ms for low-end systems
    }
    
    /// Get adaptive buffer size for thread count strings
    inline size_t get_thread_count_buffer_size() {
        const auto max_threads = get_max_worker_threads();
        // Calculate digits needed + null terminator + some padding
        if (max_threads >= 1000) return 8;     // 4 digits + padding
        if (max_threads >= 100) return 6;      // 3 digits + padding  
        if (max_threads >= 10) return 4;       // 2 digits + padding
        return 3;                               // 1 digit + padding
    }
    
    /// Get adaptive batch size based on CPU cores
    inline size_t get_adaptive_batch_size() {
        const auto hardware_threads = std::thread::hardware_concurrency();
        // Scale batch size with CPU capability for optimal throughput
        return std::max(static_cast<size_t>(100), static_cast<size_t>(hardware_threads * 125));
    }
    
    /// Get adaptive memory limit based on system RAM
    inline size_t get_adaptive_memory_limit_mb() {
        // Get system page size and total memory
        const size_t page_size = 4096; // 4KB typical page size
        const size_t total_memory = sysconf(_SC_PHYS_PAGES) * page_size;
        const size_t total_memory_mb = total_memory / (1024 * 1024);
        
        // Use a conservative percentage of available memory
        if (total_memory_mb >= 32768) return 8192;  // 8GB for systems with 32GB+ RAM
        if (total_memory_mb >= 16384) return 4096;  // 4GB for systems with 16GB+ RAM
        if (total_memory_mb >= 8192) return 2048;   // 2GB for systems with 8GB+ RAM
        if (total_memory_mb >= 4096) return 1024;   // 1GB for systems with 4GB+ RAM
        return 512;                                 // 512MB for systems with <4GB RAM
    }
    
    /// Get adaptive task memory limit based on system RAM
    inline size_t get_adaptive_task_memory_limit_mb() {
        const size_t total_limit = get_adaptive_memory_limit_mb();
        const auto hardware_threads = std::thread::hardware_concurrency();
        // Distribute memory fairly among worker threads
        return std::max(static_cast<size_t>(16), total_limit / hardware_threads);
    }
    
    /// Constants for backward compatibility
    constexpr size_t DEFAULT_STACK_SIZE = 64 * 1024;
    constexpr size_t MAX_STACK_SIZE = 1024 * 1024;
    constexpr size_t MIN_STACK_SIZE = 8 * 1024;
}

// =====================================================================
// Convenience Type Aliases
// =====================================================================

/// Alias for the main thread pool type
using ThreadPool = NativeThreadPool;

/// Alias for tasklet statistics
using Stats = SchedulerStats;

/// Alias for task function type
using TaskFunction = std::function<void()>;

/// Alias for tasklet ID type
using TaskletId = uint64_t;

// =====================================================================
// Convenience Functions
// =====================================================================

/**
 * @brief Get the global thread pool instance
 * @return Reference to the singleton thread pool
 */
inline ThreadPool& get_thread_pool() {
    return NativeThreadPool::get_instance();
}

/**
 * @brief Spawn a tasklet with the global thread pool
 * @param task Function to execute
 * @return Tasklet ID
 */
inline TaskletId spawn(TaskFunction task) {
    return get_thread_pool().spawn(task);
}

/**
 * @brief Join a tasklet (wait for completion)
 * @param tasklet_id ID of the tasklet to join
 */
inline void join(TaskletId tasklet_id) {
    get_thread_pool().join(tasklet_id);
}

/**
 * @brief Join all tasklets
 */
inline void join_all() {
    get_thread_pool().join_all();
}

/**
 * @brief Get tasklet result
 * @param tasklet_id ID of the tasklet
 * @return Result string
 */
inline std::string get_result(TaskletId tasklet_id) {
    return get_thread_pool().get_result(tasklet_id);
}

/**
 * @brief Check if tasklet has error
 * @param tasklet_id ID of the tasklet
 * @return True if tasklet has error
 */
inline bool has_error(TaskletId tasklet_id) {
    return get_thread_pool().has_error(tasklet_id);
}

/**
 * @brief Get tasklet error message
 * @param tasklet_id ID of the tasklet
 * @return Error message
 */
inline std::string get_error(TaskletId tasklet_id) {
    return get_thread_pool().get_error(tasklet_id);
}

/**
 * @brief Get thread pool statistics
 * @return Statistics object
 */
inline Stats get_stats() {
    return get_thread_pool().get_stats();
}

/**
 * @brief Set number of worker threads
 * @param count Number of worker threads (1 to system-dependent maximum)
 */
inline void set_worker_thread_count(size_t count) {
    get_thread_pool().set_worker_thread_count(count);
}

/**
 * @brief Get number of worker threads
 * @return Current number of worker threads
 */
inline size_t get_worker_thread_count() {
    return get_thread_pool().get_worker_thread_count();
}

/**
 * @brief Set log level for tasklets
 * @param level The log level to set (OFF, ERROR, WARN, INFO, DEBUG, TRACE)
 */
inline void set_log_level(LogLevel level) {
    Logger::set_level(level);
}

/**
 * @brief Get current log level
 * @return Current log level
 */
inline LogLevel get_log_level() {
    return Logger::get_level();
}

} // namespace tasklets

/**
 * @brief Library usage example
 * 
 * @code{.cpp}
 * #include "tasklets.hpp"
 * 
 * int main() {
 *     using namespace tasklets;
 *     
 *     // Configure thread pool
 *     set_worker_thread_count(8);
 *     
 *     // Spawn a tasklet
 *     auto tasklet_id = spawn([]() {
 *         // Some work here
 *         std::this_thread::sleep_for(std::chrono::milliseconds(100));
 *     });
 *     
 *     // Wait for completion
 *     join(tasklet_id);
 *     
 *     // Get statistics
 *     auto stats = get_stats();
 *     std::cout << "[Tasklets:Stats] Completed tasklets: " << stats.completed_threads << std::endl;
 *     
 *     return 0;
 * }
 * @endcode
 */ 