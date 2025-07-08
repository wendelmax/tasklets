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
 * @brief Tasklet class definition
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

#ifndef BUILDING_CCTEST
#include <napi.h>
#endif

namespace tasklets {

class Tasklet {
public:
    // Constructor for C++ tasks
    Tasklet(uint64_t id, std::function<void()> task);

    // Constructor for JS tasks
    Tasklet(
        uint64_t id,
        std::function<void()> task,
        std::shared_ptr<std::string> result_holder,
        std::shared_ptr<std::string> error_holder,
        std::shared_ptr<bool> has_error_holder,
        std::shared_ptr<bool> completed_holder,
        std::shared_ptr<std::mutex> completion_mutex,
        std::shared_ptr<std::condition_variable> completion_cv
    );
    
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
    
    #ifndef BUILDING_CCTEST
    void set_native_result(const Napi::Value& value);
    Napi::Value get_native_result(Napi::Env env) const;
    #endif
    
    bool has_native_result() const { return has_native_result_; }
    
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
    
    // For C++ tasks and string results from JS tasks
    std::string result_;
    std::string error_;
    std::atomic<bool> has_error_;
    
    // For JS tasks, to sync with the main thread
    std::shared_ptr<std::string> js_result_holder_;
    std::shared_ptr<std::string> js_error_holder_;
    std::shared_ptr<bool> js_has_error_holder_;
    std::shared_ptr<bool> js_completed_holder_;
    std::shared_ptr<std::mutex> completion_mutex_;
    std::shared_ptr<std::condition_variable> completion_cv_;
    
    // Native result storage for performance optimization
    #ifndef BUILDING_CCTEST
    Napi::Reference<Napi::Value> native_result_ref_;
    #endif
    std::atomic<bool> has_native_result_;
};

} // namespace tasklets 