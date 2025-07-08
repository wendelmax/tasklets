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
 * @file core.hpp
 * @brief Unified header for all core components of the Tasklets system
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

// =====================================================================
// Base Infrastructure
// =====================================================================

#include "base/logger.hpp"
#include "base/tasklet.hpp"
#include "base/microjob.hpp"

// =====================================================================
// Threading and Concurrency
// =====================================================================

#include "threading/native_thread_pool.hpp"
#include "threading/multiprocessor.hpp"

// =====================================================================
// Memory Management
// =====================================================================

#include "memory/memory_manager.hpp"

// =====================================================================
// Monitoring and Statistics
// =====================================================================

#include "monitoring/stats.hpp"

// =====================================================================
// Automation and Configuration
// =====================================================================

#include "automation/auto_config.hpp"
#include "automation/auto_scheduler.hpp"

// =====================================================================
// Core System Initialization
// =====================================================================

namespace tasklets {

/**
 * @brief Initialize all core systems
 * @param loop libuv event loop
 */
inline void initialize_core(uv_loop_t* loop) {
    // Initialize logging system
    Logger::info("Core", "Initializing Tasklets core systems");
    
    // Initialize memory management
    MemoryManager::get_instance().initialize(loop);
    
    // Initialize auto-configuration
    AutoConfig::get_instance().initialize(loop);
    
    // Initialize auto-scheduler
    AutoScheduler::get_instance().initialize(loop);
    
    // Initialize multiprocessor
    Multiprocessor::get_instance().initialize();
    
    Logger::info("Core", "All core systems initialized successfully");
}

/**
 * @brief Shutdown all core systems
 */
inline void shutdown_core() {
    Logger::info("Core", "Shutting down Tasklets core systems");
    
    // Shutdown in reverse order
    Multiprocessor::get_instance().shutdown();
    AutoScheduler::get_instance().shutdown();
    AutoConfig::get_instance().shutdown();
    MemoryManager::get_instance().shutdown();
    
    Logger::info("Core", "All core systems shutdown successfully");
}

/**
 * @brief Core system status structure
 */
struct CoreStatus {
    bool memory_manager_initialized;
    bool auto_config_initialized;
    bool auto_scheduler_initialized;
    bool multiprocessor_initialized;
    size_t active_tasklets;
    size_t worker_threads;
    double memory_usage_percent;
    double cpu_utilization;
};

/**
 * @brief Get core system status
 * @return Status object with system information
 */
inline CoreStatus get_core_status() {
    CoreStatus status;
    
    // Get memory manager status
    auto memory_stats = MemoryManager::get_instance().get_memory_stats();
    status.memory_manager_initialized = true; // Memory manager is initialized if we can get stats
    status.active_tasklets = memory_stats.active_tasklets;
    status.memory_usage_percent = memory_stats.system_memory_usage_percent;
    
    // Get thread pool status
    auto thread_stats = NativeThreadPool::get_instance().get_stats();
    status.worker_threads = thread_stats.worker_threads;
    
    // Get auto-config status
    auto auto_config_settings = AutoConfig::get_instance().get_settings();
    status.auto_config_initialized = auto_config_settings.is_enabled;
    
    // Get auto-scheduler status
    status.auto_scheduler_initialized = AutoScheduler::get_instance().is_auto_scheduling_enabled();
    
    // Get multiprocessor status
    status.multiprocessor_initialized = Multiprocessor::get_instance().is_enabled();
    
    // Estimate CPU utilization (simplified)
    status.cpu_utilization = 50.0; // Placeholder - would need more sophisticated monitoring
    
    return status;
}

} // namespace tasklets 