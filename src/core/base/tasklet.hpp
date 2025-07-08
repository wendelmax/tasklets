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
 * @file tasklet.hpp
 * @brief Declares the Tasklet class, representing a high-level abstraction for a unit of work (tasklet) managed by the thread pool, including result, error, and synchronization logic.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <functional>
#include <atomic>
#include <string>
#include <cstdint>
#include <memory>
#include <mutex>
#include <condition_variable>

namespace tasklets {

class Tasklet {
public:
    // Constructor for all tasks (simplified)
    Tasklet(uint64_t id, std::function<void()> task);
    
    ~Tasklet();
    
    Tasklet(const Tasklet&) = delete;
    Tasklet& operator=(const Tasklet&) = delete;
    Tasklet(Tasklet&&) = delete;
    Tasklet& operator=(Tasklet&&) = delete;
    
    // State Management
    uint64_t get_id() const { return id_; }
    bool is_finished() const { return finished_.load(); }
    bool is_running() const { return running_.load(); }
    void mark_running() { running_ = true; }
    void mark_finished();
    
    // Result Management
    void set_result(const std::string& result);
    const std::string& get_result() const;
    
    // Error Management
    void set_error(const std::string& error);
    const std::string& get_error() const;
    bool has_error() const;
    
    // Task Management
    std::function<void()> get_task() const { return task_; }
    
    // Synchronization
    void wait_for_completion();
    void notify_completion();

private:
    uint64_t id_;
    std::function<void()> task_;
    
    std::atomic<bool> finished_;
    std::atomic<bool> running_;
    
    // Result and error storage
    std::string result_;
    std::string error_;
    std::atomic<bool> has_error_;
    
    // Synchronization
    mutable std::mutex completion_mutex_;
    std::condition_variable completion_cv_;
};

} // namespace tasklets 