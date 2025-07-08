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
 * @file logger.hpp
 * @brief Logger class definition for the Tasklets library
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#pragma once

#include <iostream>
#include <string>
#include <mutex>

namespace tasklets {

/**
 * @brief Log levels for controlling output verbosity
 */
enum class LogLevel {
    OFF = 0,    // No logging
    ERROR = 1,  // Only critical errors
    WARN = 2,   // Warnings and errors
    INFO = 3,   // General information, warnings, and errors
    DEBUG = 4,  // Detailed debugging information
    TRACE = 5   // Very detailed execution tracing
};

/**
 * @brief Thread-safe logger for tasklets
 */
class Logger {
private:
    static LogLevel current_level_;
    static std::mutex log_mutex_;
    
    static const char* level_to_string(LogLevel level) {
        switch (level) {
            case LogLevel::ERROR: return "ERROR";
            case LogLevel::WARN:  return "WARN";
            case LogLevel::INFO:  return "INFO";
            case LogLevel::DEBUG: return "DEBUG";
            case LogLevel::TRACE: return "TRACE";
            default: return "UNKNOWN";
        }
    }
    
public:
    /**
     * @brief Set the current log level
     * @param level The new log level
     */
    static void set_level(LogLevel level) {
        std::lock_guard<std::mutex> lock(log_mutex_);
        current_level_ = level;
    }
    
    /**
     * @brief Get the current log level
     * @return Current log level
     */
    static LogLevel get_level() {
        std::lock_guard<std::mutex> lock(log_mutex_);
        return current_level_;
    }
    
    /**
     * @brief Check if a log level is enabled
     * @param level The log level to check
     * @return True if the level is enabled
     */
    static bool is_enabled(LogLevel level) {
        std::lock_guard<std::mutex> lock(log_mutex_);
        return static_cast<int>(level) <= static_cast<int>(current_level_);
    }
    
    /**
     * @brief Log a message with the specified level
     * @param level The log level
     * @param component The component name (e.g., "NativeThreadPool")
     * @param message The message to log
     */
    static void log(LogLevel level, const std::string& component, const std::string& message) {
        if (!is_enabled(level)) return;
        
        std::lock_guard<std::mutex> lock(log_mutex_);
        
        if (level == LogLevel::ERROR) {
            std::cerr << "[Tasklets:" << component << "] " << message << std::endl;
        } else {
            std::cout << "[Tasklets:" << component << "] " << message << std::endl;
        }
    }
    
    /**
     * @brief Log an error message
     * @param component The component name
     * @param message The error message
     */
    static void error(const std::string& component, const std::string& message) {
        log(LogLevel::ERROR, component, message);
    }
    
    /**
     * @brief Log a warning message
     * @param component The component name
     * @param message The warning message
     */
    static void warn(const std::string& component, const std::string& message) {
        log(LogLevel::WARN, component, message);
    }
    
    /**
     * @brief Log an info message
     * @param component The component name
     * @param message The info message
     */
    static void info(const std::string& component, const std::string& message) {
        log(LogLevel::INFO, component, message);
    }
    
    /**
     * @brief Log a debug message
     * @param component The component name
     * @param message The debug message
     */
    static void debug(const std::string& component, const std::string& message) {
        log(LogLevel::DEBUG, component, message);
    }
    
    /**
     * @brief Log a trace message
     * @param component The component name
     * @param message The trace message
     */
    static void trace(const std::string& component, const std::string& message) {
        log(LogLevel::TRACE, component, message);
    }
};

// Convenience macros for logging
#define TASKLETS_LOG_ERROR(component, message) \
    tasklets::Logger::error(component, message)

#define TASKLETS_LOG_WARN(component, message) \
    tasklets::Logger::warn(component, message)

#define TASKLETS_LOG_INFO(component, message) \
    tasklets::Logger::info(component, message)

#define TASKLETS_LOG_DEBUG(component, message) \
    tasklets::Logger::debug(component, message)

#define TASKLETS_LOG_TRACE(component, message) \
    tasklets::Logger::trace(component, message)

} // namespace tasklets 