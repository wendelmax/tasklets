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
 * @file tasklet.cpp
 * @brief Tasklet class implementation
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "tasklet.hpp"
#include <chrono>
#include <thread>

namespace tasklets {

// C++ Task Constructor
Tasklet::Tasklet(uint64_t id, std::function<void()> task)
    : id_(id), 
      task_(task), 
      finished_(false), 
      running_(false), 
      has_error_(false),
      has_native_result_(false) {
}

// JS Task Constructor
Tasklet::Tasklet(
    uint64_t id,
    std::function<void()> task,
    std::shared_ptr<std::string> result_holder,
    std::shared_ptr<std::string> error_holder,
    std::shared_ptr<bool> has_error_holder,
    std::shared_ptr<bool> completed_holder,
    std::shared_ptr<std::mutex> completion_mutex,
    std::shared_ptr<std::condition_variable> completion_cv)
    : id_(id), 
      task_(task), 
      finished_(false), 
      running_(false), 
      has_error_(false),
      js_result_holder_(result_holder),
      js_error_holder_(error_holder),
      js_has_error_holder_(has_error_holder),
      js_completed_holder_(completed_holder),
      completion_mutex_(completion_mutex),
      completion_cv_(completion_cv),
      has_native_result_(false) {
}

Tasklet::~Tasklet() {
    // Release N-API reference if it exists
    #ifndef BUILDING_CCTEST
    if (has_native_result_ && !native_result_ref_.IsEmpty()) {
        native_result_ref_.Reset();
    }
    #endif
}

void Tasklet::mark_finished() {
    running_ = false;
    finished_ = true;
}

void Tasklet::set_result(const std::string& result) {
    result_ = result;
}

const std::string& Tasklet::get_result() const {
    if (js_result_holder_) {
        return *js_result_holder_;
    }
    return result_;
}

void Tasklet::set_error(const std::string& error) {
    error_ = error;
    has_error_ = true;
}

const std::string& Tasklet::get_error() const {
    if (js_error_holder_) {
        return *js_error_holder_;
    }
    return error_;
}

bool Tasklet::has_error() const {
    if (js_has_error_holder_) {
        return *js_has_error_holder_;
    }
    return has_error_.load();
}

void Tasklet::wait_for_completion() {
    if (!finished_.load()) {
        if (completion_mutex_ && completion_cv_) {
            std::unique_lock<std::mutex> lock(*completion_mutex_);
            completion_cv_->wait(lock, [this]{ return *js_completed_holder_; });
        } else {
            // For C++ tasks, we might need a different mechanism or just spin-wait briefly
            // For now, this is primarily for JS tasks.
            while(!finished_.load()) {
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
            }
        }
    }
}

void Tasklet::notify_completion() {
    if (completion_cv_) {
        completion_cv_->notify_all();
    }
}

#ifndef BUILDING_CCTEST
void Tasklet::set_native_result(const Napi::Value& value) {
    if (value.IsObject() || value.IsFunction()) {
        native_result_ref_ = Napi::Reference<Napi::Value>::New(value, 1);
    } else {
        // For primitives, we can just store them directly
        native_result_ref_ = Napi::Reference<Napi::Value>::New(value, 1);
    }
    has_native_result_ = true;
}

Napi::Value Tasklet::get_native_result(Napi::Env env) const {
    if (has_native_result_ && !native_result_ref_.IsEmpty()) {
        return native_result_ref_.Value();
    }
    return env.Undefined();
}
#endif

} // namespace tasklets 