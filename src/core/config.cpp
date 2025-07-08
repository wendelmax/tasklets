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
 * @file config.cpp
 * @brief System configuration management implementation
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "config.hpp"
#include "logger.hpp"
#include <algorithm>
#include <unistd.h>

namespace tasklets {

SystemConfig& SystemConfig::get_instance() {
    static SystemConfig instance;
    return instance;
}

SystemConfig::SystemConfig()
    : memory_limit_percent_(70.0)
    , cleanup_interval_ms_(5000)
    , worker_thread_count_([]() {
        const auto hardware_threads = std::thread::hardware_concurrency();
        return hardware_threads > 0 ? hardware_threads : 4;
    }())
    , microjob_pool_initial_size_(20)
    , microjob_pool_max_size_(200)
    , log_level_("info") {
    // Initialize mutex
}

void SystemConfig::set_memory_limit_percent(double limit_percent) {
    if (limit_percent >= 0.0 && limit_percent <= 100.0) {
        memory_limit_percent_.store(limit_percent);
        Logger::info("SystemConfig", "Set memory limit to " + std::to_string(limit_percent) + "%");
    } else {
        Logger::warn("SystemConfig", "Invalid memory limit percentage: " + std::to_string(limit_percent) + ". Must be between 0 and 100.");
    }
}

void SystemConfig::set_cleanup_interval_ms(uint32_t interval_ms) {
    if (interval_ms > 0) {
        cleanup_interval_ms_.store(interval_ms);
        Logger::info("SystemConfig", "Set cleanup interval to " + std::to_string(interval_ms) + " ms");
    }
}

void SystemConfig::set_worker_thread_count(size_t count) {
    const auto max_threads = get_max_worker_threads();
    if (count >= MIN_WORKER_THREADS && count <= max_threads) {
        worker_thread_count_.store(count);
        Logger::info("SystemConfig", "Set worker thread count to " + std::to_string(count));
    } else {
        Logger::warn("SystemConfig", "Invalid worker thread count: " + std::to_string(count) + 
                    ". Must be between " + std::to_string(MIN_WORKER_THREADS) + " and " + std::to_string(max_threads));
    }
}

size_t SystemConfig::get_max_worker_threads() const {
    const auto hardware_threads = std::thread::hardware_concurrency();
    return hardware_threads > 0 ? std::min(static_cast<size_t>(hardware_threads * 4), static_cast<size_t>(512)) : 128;
}

size_t SystemConfig::get_default_stack_size() const {
    const auto hardware_threads = std::thread::hardware_concurrency();
    if (hardware_threads >= 16) return 128 * 1024; // 128KB for high-core systems
    if (hardware_threads >= 8) return 96 * 1024;   // 96KB for mid-range systems
    return 64 * 1024;                               // 64KB for lower-end systems
}

size_t SystemConfig::get_max_stack_size() const {
    const auto hardware_threads = std::thread::hardware_concurrency();
    if (hardware_threads >= 16) return 2 * 1024 * 1024; // 2MB for high-end
    if (hardware_threads >= 8) return 1536 * 1024;      // 1.5MB for mid-range
    return 1024 * 1024;                                  // 1MB for standard
}

size_t SystemConfig::get_adaptive_poll_interval_ms() const {
    const auto hardware_threads = std::thread::hardware_concurrency();
    if (hardware_threads >= 16) return 1;  // 1ms for high-end systems
    if (hardware_threads >= 8) return 2;   // 2ms for mid-range systems
    if (hardware_threads >= 4) return 3;   // 3ms for standard systems
    return 5;                               // 5ms for low-end systems
}

size_t SystemConfig::get_adaptive_batch_size() const {
    const auto hardware_threads = std::thread::hardware_concurrency();
    return std::max(static_cast<size_t>(100), static_cast<size_t>(hardware_threads * 125));
}

void SystemConfig::set_microjob_pool_initial_size(size_t size) {
    if (size > 0 && size <= microjob_pool_max_size_.load()) {
        microjob_pool_initial_size_.store(size);
        Logger::info("SystemConfig", "Set microjob pool initial size to " + std::to_string(size));
    } else {
        Logger::warn("SystemConfig", "Invalid microjob pool initial size: " + std::to_string(size));
    }
}

void SystemConfig::set_microjob_pool_max_size(size_t size) {
    if (size >= microjob_pool_initial_size_.load()) {
        microjob_pool_max_size_.store(size);
        Logger::info("SystemConfig", "Set microjob pool max size to " + std::to_string(size));
    } else {
        Logger::warn("SystemConfig", "Invalid microjob pool max size: " + std::to_string(size));
    }
}

std::string SystemConfig::get_log_level() const {
    std::lock_guard<std::mutex> lock(log_level_mutex_);
    return log_level_;
}

void SystemConfig::set_log_level(const std::string& level) {
    const std::vector<std::string> valid_levels = {"debug", "info", "warn", "error"};
    if (std::find(valid_levels.begin(), valid_levels.end(), level) != valid_levels.end()) {
        {
            std::lock_guard<std::mutex> lock(log_level_mutex_);
            log_level_ = level;
        }
        Logger::info("SystemConfig", "Set log level to " + level);
    } else {
        Logger::warn("SystemConfig", "Invalid log level: " + level + ". Valid levels: debug, info, warn, error");
    }
}

void SystemConfig::reset_to_defaults() {
    memory_limit_percent_.store(70.0);
    cleanup_interval_ms_.store(5000);
    
    const auto hardware_threads = std::thread::hardware_concurrency();
    worker_thread_count_.store(hardware_threads > 0 ? hardware_threads : 4);
    
    microjob_pool_initial_size_.store(20);
    microjob_pool_max_size_.store(200);
    {
        std::lock_guard<std::mutex> lock(log_level_mutex_);
        log_level_ = "info";
    }
    
    Logger::info("SystemConfig", "Reset all configuration to defaults");
}

} // namespace tasklets 