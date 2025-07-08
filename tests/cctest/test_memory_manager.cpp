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
    ASSERT_GT(stats.time_since_last_cleanup_ms, 0);
    ASSERT_GE(stats.memory_usage_mb, 0.0);
}

TEST(MemoryManagerSystemMemoryStats) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats = manager.get_system_memory_stats();
    
    ASSERT_GT(stats.system_total_memory_bytes, 0);
    ASSERT_GE(stats.system_free_memory_bytes, 0);
    ASSERT_LE(stats.system_used_memory_bytes, stats.system_total_memory_bytes);
    ASSERT_GE(stats.system_memory_usage_percent, 0.0);
    ASSERT_LE(stats.system_memory_usage_percent, 100.0);
}

TEST(MemoryManagerCanAllocateMemory) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    bool can_allocate = manager.can_allocate_memory();
    
    ASSERT_TRUE(can_allocate);
}

TEST(MemoryManagerMemoryUsageAcceptable) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    bool is_acceptable = manager.is_memory_usage_acceptable();
    
    ASSERT_TRUE(is_acceptable);
}

TEST(MemoryManagerMicroJobPool) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto job1 = manager.acquire_microjob();
    ASSERT_NOT_NULLPTR(job1.get());
    
    auto job2 = manager.acquire_microjob();
    ASSERT_NOT_NULLPTR(job2.get());
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(2, stats.microjob_pool_stats.in_use);
    
    manager.release_microjob(std::move(job1));
    manager.release_microjob(std::move(job2));
    
    auto updated_stats = manager.get_memory_stats();
    ASSERT_EQ(0, updated_stats.microjob_pool_stats.in_use);
    ASSERT_GT(updated_stats.microjob_pool_stats.available_in_pool, 0);
}

TEST(MemoryManagerMicroJobPoolReuse) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    std::vector<std::unique_ptr<MicroJob>> jobs;
    
    for (int i = 0; i < 10; i++) {
        jobs.push_back(manager.acquire_microjob());
        ASSERT_NOT_NULLPTR(jobs.back().get());
    }
    
    auto stats1 = manager.get_memory_stats();
    ASSERT_EQ(10, stats1.microjob_pool_stats.in_use);
    
    for (auto& job : jobs) {
        manager.release_microjob(std::move(job));
    }
    jobs.clear();
    
    auto stats2 = manager.get_memory_stats();
    ASSERT_EQ(0, stats2.microjob_pool_stats.in_use);
    ASSERT_GE(stats2.microjob_pool_stats.available_in_pool, 10);
}

TEST(MemoryManagerTaskletRegistration) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto task = []() {};
    auto tasklet = std::make_shared<Tasklet>(1, task);
    
    auto initial_stats = manager.get_memory_stats();
    size_t initial_active = initial_stats.active_tasklets;
    
    manager.register_tasklet(1, tasklet);
    
    auto updated_stats = manager.get_memory_stats();
    ASSERT_EQ(initial_active + 1, updated_stats.active_tasklets);
    
    manager.unregister_tasklet(1);
    
    auto final_stats = manager.get_memory_stats();
    ASSERT_EQ(initial_active, final_stats.active_tasklets);
}

TEST(MemoryManagerTaskletCleanup) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto task = []() {};
    auto tasklet = std::make_shared<Tasklet>(2, task);
    
    manager.register_tasklet(2, tasklet);
    
    auto stats1 = manager.get_memory_stats();
    size_t initial_active = stats1.active_tasklets;
    
    manager.mark_for_cleanup(2);
    
    auto stats2 = manager.get_memory_stats();
    ASSERT_EQ(initial_active - 1, stats2.active_tasklets);
    ASSERT_EQ(1, stats2.pending_cleanup);
    
    manager.force_cleanup();
    
    auto stats3 = manager.get_memory_stats();
    ASSERT_EQ(0, stats3.pending_cleanup);
}

TEST(MemoryManagerMultipleTasklets) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto task = []() {};
    std::vector<std::shared_ptr<Tasklet>> tasklets;
    
    for (uint64_t i = 100; i < 110; i++) {
        tasklets.push_back(std::make_shared<Tasklet>(i, task));
        manager.register_tasklet(i, tasklets.back());
    }
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(10, stats.active_tasklets);
    
    for (uint64_t i = 100; i < 105; i++) {
        manager.mark_for_cleanup(i);
    }
    
    auto stats2 = manager.get_memory_stats();
    ASSERT_EQ(5, stats2.active_tasklets);
    ASSERT_EQ(5, stats2.pending_cleanup);
    
    for (uint64_t i = 105; i < 110; i++) {
        manager.unregister_tasklet(i);
    }
    
    auto stats3 = manager.get_memory_stats();
    ASSERT_EQ(0, stats3.active_tasklets);
    ASSERT_EQ(5, stats3.pending_cleanup);
    
    manager.force_cleanup();
    
    auto stats4 = manager.get_memory_stats();
    ASSERT_EQ(0, stats4.active_tasklets);
    ASSERT_EQ(0, stats4.pending_cleanup);
}

TEST(MemoryManagerThreadSafety) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    std::vector<std::thread> threads;
    std::atomic<int> registered_count(0);
    std::atomic<int> cleanup_count(0);
    
    for (int i = 0; i < 5; i++) {
        threads.emplace_back([&manager, i, &registered_count, &cleanup_count]() {
            auto task = []() {};
            
            for (int j = 0; j < 10; j++) {
                uint64_t tasklet_id = i * 1000 + j;
                auto tasklet = std::make_shared<Tasklet>(tasklet_id, task);
                
                manager.register_tasklet(tasklet_id, tasklet);
                registered_count.fetch_add(1);
                
                manager.mark_for_cleanup(tasklet_id);
                cleanup_count.fetch_add(1);
            }
        });
    }
    
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(50, registered_count.load());
    ASSERT_EQ(50, cleanup_count.load());
    
    manager.force_cleanup();
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(0, stats.active_tasklets);
    ASSERT_EQ(0, stats.pending_cleanup);
}

TEST(MemoryManagerMicroJobPoolStats) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats = manager.get_memory_stats();
    auto pool_stats = stats.microjob_pool_stats;
    
    ASSERT_GE(pool_stats.total_created, 0);
    ASSERT_GE(pool_stats.available_in_pool, 0);
    ASSERT_EQ(0, pool_stats.in_use);
    ASSERT_GT(pool_stats.max_pool_size, 0);
}

TEST(MemoryManagerMicroJobPoolStress) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    std::vector<std::unique_ptr<MicroJob>> jobs;
    
    for (int i = 0; i < 100; i++) {
        jobs.push_back(manager.acquire_microjob());
        ASSERT_NOT_NULLPTR(jobs.back().get());
    }
    
    auto stats1 = manager.get_memory_stats();
    ASSERT_EQ(100, stats1.microjob_pool_stats.in_use);
    
    for (auto& job : jobs) {
        manager.release_microjob(std::move(job));
    }
    jobs.clear();
    
    auto stats2 = manager.get_memory_stats();
    ASSERT_EQ(0, stats2.microjob_pool_stats.in_use);
    ASSERT_GE(stats2.microjob_pool_stats.available_in_pool, 100);
}

TEST(MemoryManagerTaskletLifecycle) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto task = []() {};
    auto tasklet = std::make_shared<Tasklet>(999, task);
    
    auto initial_stats = manager.get_memory_stats();
    size_t initial_created = initial_stats.total_tasklets_created;
    
    manager.register_tasklet(999, tasklet);
    
    auto stats1 = manager.get_memory_stats();
    ASSERT_EQ(initial_created + 1, stats1.total_tasklets_created);
    ASSERT_EQ(1, stats1.active_tasklets);
    
    tasklet->mark_running();
    tasklet->set_result("Completed");
    tasklet->mark_finished();
    
    manager.mark_for_cleanup(999);
    
    auto stats2 = manager.get_memory_stats();
    ASSERT_EQ(0, stats2.active_tasklets);
    ASSERT_EQ(1, stats2.pending_cleanup);
    
    manager.force_cleanup();
    
    auto stats3 = manager.get_memory_stats();
    ASSERT_EQ(0, stats3.active_tasklets);
    ASSERT_EQ(0, stats3.pending_cleanup);
    ASSERT_EQ(initial_created + 1, stats3.total_tasklets_created);
}

TEST(MemoryManagerCleanupOperations) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto initial_stats = manager.get_memory_stats();
    uint64_t initial_cleanup_count = initial_stats.cleanup_operations_count;
    
    manager.force_cleanup();
    
    auto stats1 = manager.get_memory_stats();
    ASSERT_GE(stats1.cleanup_operations_count, initial_cleanup_count);
    
    manager.force_cleanup();
    
    auto stats2 = manager.get_memory_stats();
    ASSERT_GT(stats2.cleanup_operations_count, stats1.cleanup_operations_count);
}

TEST(MemoryManagerMemoryUsageTracking) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats = manager.get_memory_stats();
    
    ASSERT_GE(stats.memory_usage_mb, 0.0);
    ASSERT_GT(stats.time_since_last_cleanup_ms, 0);
}

TEST(MemoryManagerSystemMemoryConsistency) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto stats = manager.get_system_memory_stats();
    
    uint64_t calculated_used = stats.system_total_memory_bytes - stats.system_free_memory_bytes;
    ASSERT_EQ(stats.system_used_memory_bytes, calculated_used);
    
    double calculated_percent = (static_cast<double>(stats.system_used_memory_bytes) / 
                                static_cast<double>(stats.system_total_memory_bytes)) * 100.0;
    ASSERT_NEAR(stats.system_memory_usage_percent, calculated_percent, 1.0);
}

TEST(MemoryManagerMicroJobReset) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    auto job = manager.acquire_microjob();
    ASSERT_NOT_NULLPTR(job.get());
    
    job->tasklet_id = 123;
    job->set_result("Test result");
    job->set_error("Test error");
    job->set_priority(5);
    job->timeout_duration = 1000;
    
    ASSERT_EQ(123, job->tasklet_id);
    ASSERT_STREQ("Test result", job->get_result().c_str());
    ASSERT_STREQ("Test error", job->get_error().c_str());
    ASSERT_EQ(5, job->get_priority());
    ASSERT_EQ(1000, job->timeout_duration);
    
    job->reset();
    
    ASSERT_EQ(0, job->tasklet_id);
    ASSERT_STREQ("", job->get_result().c_str());
    ASSERT_STREQ("", job->get_error().c_str());
    ASSERT_EQ(0, job->get_priority());
    ASSERT_EQ(0, job->timeout_duration);
    
    manager.release_microjob(std::move(job));
}

TEST(MemoryManagerConcurrentMicroJobOperations) {
    MemoryManager& manager = MemoryManager::get_instance();
    
    std::vector<std::thread> threads;
    std::atomic<int> acquired_count(0);
    std::atomic<int> released_count(0);
    
    for (int i = 0; i < 10; i++) {
        threads.emplace_back([&manager, &acquired_count, &released_count]() {
            std::vector<std::unique_ptr<MicroJob>> jobs;
            
            for (int j = 0; j < 5; j++) {
                jobs.push_back(manager.acquire_microjob());
                acquired_count.fetch_add(1);
            }
            
            for (auto& job : jobs) {
                manager.release_microjob(std::move(job));
                released_count.fetch_add(1);
            }
        });
    }
    
    for (auto& thread : threads) {
        thread.join();
    }
    
    ASSERT_EQ(50, acquired_count.load());
    ASSERT_EQ(50, released_count.load());
    
    auto stats = manager.get_memory_stats();
    ASSERT_EQ(0, stats.microjob_pool_stats.in_use);
} 