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
 * @file config.hpp
 * @brief System configuration management
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <cstddef>
#include <atomic>
#include <thread>
#include <string>
#include <vector>
#include <mutex>

namespace tasklets {

/**
 * @brief Centralized configuration management for the tasklets system
 * Follows the Single Responsibility Principle by handling all configuration concerns
 */
class SystemConfig {
public:
    /**
     * @brief Get singleton instance
     * @return Reference to the SystemConfig instance
     */
    static SystemConfig& get_instance();

    // Memory Management Configuration
    double get_memory_limit_percent() const { return memory_limit_percent_.load(); }
    void set_memory_limit_percent(double limit_percent);
    
    uint32_t get_cleanup_interval_ms() const { return cleanup_interval_ms_.load(); }
    void set_cleanup_interval_ms(uint32_t interval_ms);

    // Thread Pool Configuration
    size_t get_worker_thread_count() const { return worker_thread_count_.load(); }
    void set_worker_thread_count(size_t count);
    
    size_t get_max_worker_threads() const;
    size_t get_min_worker_threads() const { return MIN_WORKER_THREADS; }

    // Stack Size Configuration
    size_t get_default_stack_size() const;
    size_t get_max_stack_size() const;
    size_t get_min_stack_size() const { return MIN_STACK_SIZE; }

    // Performance Configuration
    size_t get_adaptive_poll_interval_ms() const;
    size_t get_adaptive_batch_size() const;

    // Memory Pool Configuration
    size_t get_microjob_pool_initial_size() const { return microjob_pool_initial_size_.load(); }
    void set_microjob_pool_initial_size(size_t size);
    
    size_t get_microjob_pool_max_size() const { return microjob_pool_max_size_.load(); }
    void set_microjob_pool_max_size(size_t size);

    // Logging Configuration
    std::string get_log_level() const;
    void set_log_level(const std::string& level);

    // Reset to defaults
    void reset_to_defaults();

private:
    SystemConfig();
    ~SystemConfig() = default;
    SystemConfig(const SystemConfig&) = delete;
    SystemConfig& operator=(const SystemConfig&) = delete;

    // Memory Management
    std::atomic<double> memory_limit_percent_;
    std::atomic<uint32_t> cleanup_interval_ms_;

    // Thread Pool
    std::atomic<size_t> worker_thread_count_;

    // Memory Pools
    std::atomic<size_t> microjob_pool_initial_size_;
    std::atomic<size_t> microjob_pool_max_size_;

    // Logging
    mutable std::mutex log_level_mutex_;
    std::string log_level_;

    // Constants
    static constexpr size_t MIN_WORKER_THREADS = 1;
    static constexpr size_t MIN_STACK_SIZE = 8 * 1024; // 8KB
};

} // namespace tasklets 