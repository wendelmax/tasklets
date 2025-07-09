#pragma once

#include <napi.h>
#include <memory>
#include <string>
#include <mutex>
#include <condition_variable>

namespace tasklets {
namespace napi {

/**
 * @brief Handles JavaScript function execution with proper context preservation
 * 
 * Single Responsibility: Only handles JS function execution
 * Open/Closed: Extensible for different execution strategies
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */
class JavaScriptExecutor {
public:
    JavaScriptExecutor();
    ~JavaScriptExecutor();
    
    // Non-copyable, movable
    JavaScriptExecutor(const JavaScriptExecutor&) = delete;
    JavaScriptExecutor& operator=(const JavaScriptExecutor&) = delete;
    JavaScriptExecutor(JavaScriptExecutor&&) = default;
    JavaScriptExecutor& operator=(JavaScriptExecutor&&) = default;
    
    /**
     * @brief Execute a JavaScript function with proper context
     * @param env N-API environment
     * @param js_function Function to execute
     * @return Execution result
     */
    Napi::Value execute(Napi::Env env, const Napi::Function& js_function);
    
    /**
     * @brief Check if execution was successful
     * @return true if successful, false otherwise
     */
    bool is_successful() const { return !has_error_; }
    
    /**
     * @brief Get error message if execution failed
     * @return Error message
     */
    const std::string& get_error() const { return error_string_; }

private:
    std::string error_string_;
    bool has_error_;
    
    /**
     * @brief Execute function with proper context
     * @param env N-API environment
     * @param js_function Function to execute
     * @return Execution result
     */
    Napi::Value execute_with_context(Napi::Env env, const Napi::Function& js_function);
    
    /**
     * @brief Log execution result for debugging
     * @param result Result to log
     */
    void log_result(const Napi::Value& result);
};

/**
 * @brief Manages JavaScript function references with proper lifecycle
 * 
 * Single Responsibility: Only handles function reference management
 */
class FunctionReferenceManager {
public:
    FunctionReferenceManager();
    ~FunctionReferenceManager();
    
    /**
     * @brief Store a JavaScript function with proper reference
     * @param env N-API environment
     * @param js_function Function to store
     * @return true if successful
     */
    bool store_function(Napi::Env env, const Napi::Function& js_function);
    
    /**
     * @brief Get the stored function
     * @return Stored function reference
     */
    Napi::Function get_function() const;
    
    /**
     * @brief Check if function is valid
     * @return true if function is valid
     */
    bool is_valid() const;

private:
    Napi::Reference<Napi::Function> function_ref_;
    bool is_valid_;
};

} // namespace napi
} // namespace tasklets 