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
 * @file test_memory_manager.cpp
 * @brief Tests for the MemoryManager class
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "cctest.h"
#include "../../src/core/memory/memory_manager.hpp"
#include "../../src/core/base/tasklet.hpp"
#include "../../src/core/base/microjob.hpp"
#include <uv.h>
#include <thread>
#include <chrono>
#include <memory>

using namespace tasklets;
using namespace cctest;

TEST(MemoryManagerSingleton) {
    MemoryManager& instance1 = MemoryManager::get_instance();
    MemoryManager& instance2 = MemoryManager::get_instance();
    
    ASSERT_EQ(&instance1, &instance2);
}

TEST(MemoryManagerInitialState) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(0, stats.active_tasklets);
    ASSERT_EQ(0, stats.pending_cleanup);
    ASSERT_EQ(0, stats.total_tasklets_created);
    ASSERT_EQ(0, stats.cleanup_operations_count);
}

TEST(MemoryManagerTaskletRegistration) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto tasklet = std::make_shared<Tasklet>(1, []{});
    
    manager.register_tasklet(1, tasklet);
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(1, stats.active_tasklets);
    ASSERT_EQ(1, stats.total_tasklets_created);
}

TEST(MemoryManagerTaskletCleanup) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto tasklet = std::make_shared<Tasklet>(2, []{});
    
    manager.register_tasklet(2, tasklet);
    
    auto stats_before = manager.get_memory_stats();
    ASSERT_EQ(1, stats_before.active_tasklets);
    
    manager.mark_for_cleanup(2);
    
    auto stats_after = manager.get_memory_stats();
    ASSERT_EQ(1, stats_after.pending_cleanup);
}

TEST(MemoryManagerTaskletUnregistration) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto tasklet = std::make_shared<Tasklet>(3, []{});
    
    manager.register_tasklet(3, tasklet);
    
    auto stats_before = manager.get_memory_stats();
    ASSERT_EQ(1, stats_before.active_tasklets);
    
    manager.unregister_tasklet(3);
    
    auto stats_after = manager.get_memory_stats();
    ASSERT_EQ(0, stats_after.active_tasklets);
}

TEST(MemoryManagerMicroJobPool) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto job1 = manager.acquire_microjob();
    ASSERT_NE(nullptr, job1);
    
    auto job2 = manager.acquire_microjob();
    ASSERT_NE(nullptr, job2);
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(2, stats.microjob_pool_stats.in_use);
    ASSERT_GE(stats.microjob_pool_stats.total_created, 2);
    
    manager.release_microjob(std::move(job1));
    manager.release_microjob(std::move(job2));
    
    auto stats_after = manager.get_memory_stats();
    ASSERT_EQ(0, stats_after.microjob_pool_stats.in_use);
    ASSERT_GT(stats_after.microjob_pool_stats.available_in_pool, 0);
}

TEST(MemoryManagerForceCleanup) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto tasklet = std::make_shared<Tasklet>(4, []{});
    
    manager.register_tasklet(4, tasklet);
    manager.mark_for_cleanup(4);
    
    auto stats_before = manager.get_memory_stats();
    ASSERT_EQ(1, stats_before.pending_cleanup);
    
    manager.force_cleanup();
    
    auto stats_after = manager.get_memory_stats();
    ASSERT_EQ(0, stats_after.pending_cleanup);
    ASSERT_GT(stats_after.cleanup_operations_count, stats_before.cleanup_operations_count);
}

TEST(MemoryManagerMemoryAllocation) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    bool can_allocate = manager.can_allocate_memory();
    ASSERT_TRUE(can_allocate);
    
    bool is_acceptable = manager.is_memory_usage_acceptable();
    ASSERT_TRUE(is_acceptable);
}

TEST(MemoryManagerSystemMemoryStats) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto system_stats = manager.get_system_memory_stats();
    
    ASSERT_GT(system_stats.system_total_memory_bytes, 0);
    ASSERT_GE(system_stats.system_free_memory_bytes, 0);
    ASSERT_GE(system_stats.system_used_memory_bytes, 0);
    ASSERT_GE(system_stats.system_memory_usage_percent, 0.0);
    ASSERT_LE(system_stats.system_memory_usage_percent, 100.0);
}

TEST(MemoryManagerMultipleTasklets) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    std::vector<std::shared_ptr<Tasklet>> tasklets;
    
    for (int i = 0; i < 5; ++i) {
        auto tasklet = std::make_shared<Tasklet>(100 + i, []{});
        tasklets.push_back(tasklet);
        manager.register_tasklet(100 + i, tasklet);
    }
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(5, stats.active_tasklets);
    ASSERT_EQ(5, stats.total_tasklets_created);
    
    for (int i = 0; i < 3; ++i) {
        manager.mark_for_cleanup(100 + i);
    }
    
    auto stats_after = manager.get_memory_stats();
    ASSERT_EQ(3, stats_after.pending_cleanup);
    ASSERT_EQ(2, stats_after.active_tasklets);
}

TEST(MemoryManagerMicroJobReuse) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    std::vector<std::unique_ptr<MicroJob>> jobs;
    
    for (int i = 0; i < 10; ++i) {
        auto job = manager.acquire_microjob();
        job->tasklet_id = i;
        jobs.push_back(std::move(job));
    }
    
    auto stats_before = manager.get_memory_stats();
    ASSERT_EQ(10, stats_before.microjob_pool_stats.in_use);
    
    for (auto& job : jobs) {
        manager.release_microjob(std::move(job));
    }
    
    auto stats_after = manager.get_memory_stats();
    ASSERT_EQ(0, stats_after.microjob_pool_stats.in_use);
    ASSERT_GT(stats_after.microjob_pool_stats.available_in_pool, 0);
}

TEST(MemoryManagerCleanupTiming) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto tasklet = std::make_shared<Tasklet>(200, []{});
    
    manager.register_tasklet(200, tasklet);
    manager.mark_for_cleanup(200);
    
    auto stats = manager.get_memory_stats();
    ASSERT_GE(stats.time_since_last_cleanup_ms, 0);
}

TEST(MemoryManagerMemoryUsage) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats = manager.get_memory_stats();
    
    ASSERT_GE(stats.memory_usage_mb, 0.0);
    ASSERT_GE(stats.system_memory_usage_percent, 0.0);
    ASSERT_LE(stats.system_memory_usage_percent, 100.0);
}

TEST(MemoryManagerPoolStats) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats = manager.get_memory_stats();
    
    ASSERT_GE(stats.microjob_pool_stats.total_created, 0);
    ASSERT_GE(stats.microjob_pool_stats.available_in_pool, 0);
    ASSERT_GE(stats.microjob_pool_stats.in_use, 0);
    ASSERT_GT(stats.microjob_pool_stats.max_pool_size, 0);
}

TEST(MemoryManagerConcurrentAccess) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    std::vector<std::thread> threads;
    std::atomic<int> success_count(0);
    
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([&manager, i, &success_count]() {
            auto tasklet = std::make_shared<Tasklet>(300 + i, []{});
            
            manager.register_tasklet(300 + i, tasklet);
            
            auto job = manager.acquire_microjob();
            if (job) {
                manager.release_microjob(std::move(job));
                success_count.fetch_add(1);
            }
            
            manager.mark_for_cleanup(300 + i);
        });
    }
    
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(5, success_count.load());
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(5, stats.pending_cleanup);
}

TEST(MemoryManagerStatsConsistency) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats1 = manager.get_memory_stats();
    auto stats2 = manager.get_memory_stats();
    
    ASSERT_EQ(stats1.active_tasklets, stats2.active_tasklets);
    ASSERT_EQ(stats1.pending_cleanup, stats2.pending_cleanup);
    ASSERT_EQ(stats1.total_tasklets_created, stats2.total_tasklets_created);
    ASSERT_EQ(stats1.cleanup_operations_count, stats2.cleanup_operations_count);
}

TEST(MemoryManagerSystemStatsConsistency) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats1 = manager.get_system_memory_stats();
    auto stats2 = manager.get_system_memory_stats();
    
    ASSERT_EQ(stats1.system_total_memory_bytes, stats2.system_total_memory_bytes);
    ASSERT_GE(stats1.system_free_memory_bytes, 0);
    ASSERT_GE(stats1.system_used_memory_bytes, 0);
} 