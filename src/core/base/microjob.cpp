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
 * @file microjob.cpp
 * @brief Implements the MicroJob class, including state management, timing, priority, result handling, and utility methods for thread pool work units.
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#include "microjob.hpp"
#include <sstream>
#include <chrono>

namespace tasklets {

// =====================================================================
// MicroJob Implementation
// =====================================================================

MicroJob::MicroJob() : 
    tasklet_id(0),
    thread_pool(nullptr),
    state(JobState::PENDING),
    execution_duration(0),
    timeout_duration(0),
    priority(0),
    enqueue_time(0),
    start_time(0),
    completion_time(0) {
    work.data = this;
}

// =====================================================================
// State Management Methods
// =====================================================================

void MicroJob::cancel() {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (state == JobState::PENDING || state == JobState::RUNNING) {
        state = JobState::CANCELLED;
        error = "Job cancelled";
    }
}

bool MicroJob::is_cancelled() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    return state == JobState::CANCELLED;
}

JobState MicroJob::get_state() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    return state;
}



// =====================================================================
// Priority Management
// =====================================================================

void MicroJob::set_priority(int prio) {
    priority = prio;
}

// =====================================================================
// Timing Methods
// =====================================================================

void MicroJob::mark_enqueued() {
    enqueue_time = uv_hrtime();
}

void MicroJob::mark_started() {
    std::lock_guard<std::mutex> lock(state_mutex);
    start_time = uv_hrtime();
    state = JobState::RUNNING;
}

void MicroJob::mark_completed() {
    std::lock_guard<std::mutex> lock(state_mutex);
    completion_time = uv_hrtime();
    
    if (start_time > 0) {
        execution_duration = (completion_time - start_time) / 1000000; // Convert to ms
    }
    
    if (state != JobState::CANCELLED) {
        state = !error.empty() ? JobState::FAILED : JobState::COMPLETED;
    }
}

long long MicroJob::get_queue_wait_time() const {
    if (enqueue_time > 0 && start_time > 0) {
        return (start_time - enqueue_time) / 1000000; // Convert to ms
    }
    return 0;
}

long long MicroJob::get_total_time() const {
    if (enqueue_time > 0 && completion_time > 0) {
        return (completion_time - enqueue_time) / 1000000; // Convert to ms
    }
    return 0;
}

// =====================================================================
// Result and Error Handling
// =====================================================================

void MicroJob::set_result(const std::string& result_str) {
    std::lock_guard<std::mutex> lock(state_mutex);
    result = result_str;
    if (state != JobState::CANCELLED) {
        state = JobState::COMPLETED;
    }
}

void MicroJob::set_error(const std::string& error_msg) {
    std::lock_guard<std::mutex> lock(state_mutex);
    error = error_msg;
    if (state != JobState::CANCELLED) {
        state = JobState::FAILED;
    }
}

std::string MicroJob::get_result() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    return result;
}

std::string MicroJob::get_error() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    return error;
}

bool MicroJob::is_successful() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    return state == JobState::COMPLETED;
}

bool MicroJob::has_failed() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    return state == JobState::FAILED;
}

bool MicroJob::is_finished() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    return state == JobState::COMPLETED || 
           state == JobState::FAILED || 
           state == JobState::CANCELLED;
}

// =====================================================================
// Utility Methods
// =====================================================================

void MicroJob::reset() {
    std::lock_guard<std::mutex> lock(state_mutex);
    
    // Reset basic fields
    task = nullptr;
    result.clear();
    error.clear();
    tasklet_id = 0;
    thread_pool = nullptr;
    execution_duration = 0;
    
    // Reset state
    state = JobState::PENDING;
    
    // Reset timeout and priority
    timeout_duration = 0;
    priority = 0;
    
    // Reset timestamps
    enqueue_time = 0;
    start_time = 0;
    completion_time = 0;
    
    // Reset callbacks
    on_complete = nullptr;
    on_error = nullptr;
}

std::string MicroJob::to_string() const {
    std::lock_guard<std::mutex> lock(state_mutex);
    
    std::string state_str;
    switch (state) {
        case JobState::PENDING: state_str = "PENDING"; break;
        case JobState::RUNNING: state_str = "RUNNING"; break;
        case JobState::COMPLETED: state_str = "COMPLETED"; break;
        case JobState::FAILED: state_str = "FAILED"; break;
        case JobState::CANCELLED: state_str = "CANCELLED"; break;
    }
    
    std::string str = "MicroJob[tasklet_id=" + std::to_string(tasklet_id) + 
                     ", state=" + state_str +
                     ", priority=" + std::to_string(priority);
    
    if (timeout_duration > 0) {
        str += ", timeout=" + std::to_string(timeout_duration) + "ms";
    }
    
    if (!result.empty()) {
        str += ", result=\"" + result + "\"";
    }
    
    if (has_failed() && !error.empty()) {
        str += ", error=\"" + error + "\"";
    }
    
    if (execution_duration > 0) {
        str += ", duration=" + std::to_string(execution_duration) + "ms";
    }
    
    str += "]";
    return str;
}

// =====================================================================
// Auto-Scheduling Integration
// =====================================================================

void MicroJob::apply_auto_scheduling_recommendations(long long timeout_ms, int priority) {
    if (priority != 0) {
        set_priority(priority);
    }
}

JobComplexity MicroJob::get_estimated_complexity() const {
    // Estimate complexity based on execution time if available
    if (execution_duration > 0) {
        if (execution_duration < 1) return JobComplexity::TRIVIAL;
        if (execution_duration < 10) return JobComplexity::SIMPLE;
        if (execution_duration < 100) return JobComplexity::MODERATE;
        if (execution_duration < 1000) return JobComplexity::COMPLEX;
        return JobComplexity::HEAVY;
    }
    
    // Default to moderate complexity for unknown jobs
    return JobComplexity::MODERATE;
}

bool MicroJob::is_suitable_for_batching() const {
    // Jobs are suitable for batching if they are simple or trivial
    JobComplexity complexity = get_estimated_complexity();
    return complexity == JobComplexity::TRIVIAL || complexity == JobComplexity::SIMPLE;
}

} // namespace tasklets 