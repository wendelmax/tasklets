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
 * @brief Implements the Tasklet class logic, including result and error management, state transitions, and synchronization for tasklet execution in the thread pool.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "tasklet.hpp"
#include "logger.hpp"
#include <sstream>
#include <thread>

namespace tasklets {

Tasklet::Tasklet(uint64_t id, std::function<void()> task)
    : id_(id),
      task_(task),
      finished_(false),
      running_(false),
      has_error_(false) {
}

Tasklet::~Tasklet() = default;

void Tasklet::mark_finished() {
    finished_ = true;
    running_ = false;
    notify_completion();
}

void Tasklet::set_result(const std::string& result) {
    result_ = result;
}

const std::string& Tasklet::get_result() const {
    return result_;
}

void Tasklet::set_error(const std::string& error) {
    error_ = error;
    has_error_ = true;
}

const std::string& Tasklet::get_error() const {
    return error_;
}

bool Tasklet::has_error() const {
    return has_error_.load();
}

void Tasklet::wait_for_completion() {
    while (!finished_.load()) {
        std::this_thread::yield();
    }
}

void Tasklet::notify_completion() {
    // This method is called when the tasklet finishes
    // In the future, this could be used to notify listeners
}

} // namespace tasklets 