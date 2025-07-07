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

namespace tasklets {

/**
 * @brief Represents a lightweight task in the Tasklets system
 * 
 * A Tasklet is a lightweight representation of a task that can be
 * executed asynchronously in the libuv thread pool. It tracks the state,
 * result, and error information of the task.
 */
class Tasklet {
public:
    /**
     * @brief Constructs a new Tasklet
     * @param id Unique identifier for this tasklet
     * @param task The function to execute
     */
    Tasklet(uint64_t id, std::function<void()> task);
    
    /**
     * @brief Destructor
     */
    ~Tasklet();
    
    // Non-copyable and non-movable
    Tasklet(const Tasklet&) = delete;
    Tasklet& operator=(const Tasklet&) = delete;
    Tasklet(Tasklet&&) = delete;
    Tasklet& operator=(Tasklet&&) = delete;
    
    // =====================================================================
    // State Management
    // =====================================================================
    
    /**
     * @brief Gets the unique ID of this tasklet
     * @return Tasklet ID
     */
    uint64_t get_id() const { return id_; }
    
    /**
     * @brief Checks if the tasklet has finished execution
     * @return true if finished, false otherwise
     */
    bool is_finished() const { return finished_.load(); }
    
    /**
     * @brief Checks if the tasklet is currently running
     * @return true if running, false otherwise
     */
    bool is_running() const { return running_.load(); }
    
    /**
     * @brief Marks the tasklet as running
     */
    void mark_running() { running_ = true; }
    
    /**
     * @brief Marks the tasklet as finished
     */
    void mark_finished() { 
        finished_ = true; 
        running_ = false; 
    }
    
    // =====================================================================
    // Result Management
    // =====================================================================
    
    /**
     * @brief Sets the result of the tasklet execution
     * @param result The result string
     */
    void set_result(const std::string& result) { result_ = result; }
    
    /**
     * @brief Gets the result of the tasklet execution
     * @return The result string
     */
    const std::string& get_result() const { return result_; }
    
    // =====================================================================
    // Error Management
    // =====================================================================
    
    /**
     * @brief Sets an error for this tasklet
     * @param error The error message
     */
    void set_error(const std::string& error) { 
        error_ = error; 
        has_error_ = true; 
    }
    
    /**
     * @brief Gets the error message
     * @return The error message
     */
    const std::string& get_error() const { return error_; }
    
    /**
     * @brief Checks if the tasklet has an error
     * @return true if there's an error, false otherwise
     */
    bool has_error() const { return has_error_; }
    
    // =====================================================================
    // Task Management
    // =====================================================================
    
    /**
     * @brief Gets the task function
     * @return The task function
     */
    std::function<void()> get_task() const { return task_; }

private:
    // Tasklet identification
    uint64_t id_;
    
    // Task to execute
    std::function<void()> task_;
    
    // State tracking (atomic for thread safety)
    std::atomic<bool> finished_;
    std::atomic<bool> running_;
    
    // Result and error storage
    std::string result_;
    std::string error_;
    bool has_error_;
};

} // namespace tasklets 