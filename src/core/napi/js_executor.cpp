#include "js_executor.hpp"
#include "../base/logger.hpp"

namespace tasklets {
namespace napi {

// =====================================================================
// JavaScriptExecutor Implementation
// =====================================================================

JavaScriptExecutor::JavaScriptExecutor() 
    : has_error_(false) {
}

JavaScriptExecutor::~JavaScriptExecutor() {
}

Napi::Value JavaScriptExecutor::execute(Napi::Env env, const Napi::Function& js_function) {
    try {
        Logger::info("Tasklets", "Executing JS function in JavaScriptExecutor");
        
        // Verify the function is valid
        if (js_function.IsEmpty()) {
            error_string_ = "JavaScript function is empty";
            has_error_ = true;
            Logger::error("Tasklets", "JavaScript function is empty");
            return env.Undefined();
        }
        
        // Execute with proper context
        Napi::Value result = execute_with_context(env, js_function);
        
        // Log the result
        log_result(result);
        
        has_error_ = false;
        Logger::info("Tasklets", "JS function executed successfully");
        
        return result;
        
    } catch (const Napi::Error& e) {
        error_string_ = e.Message();
        has_error_ = true;
        Logger::error("Tasklets", "N-API Error executing JS function: " + e.Message());
        return env.Undefined();
    } catch (const std::exception& e) {
        error_string_ = std::string("C++ exception: ") + e.what();
        has_error_ = true;
        Logger::error("Tasklets", std::string("C++ exception executing JS function: ") + e.what());
        return env.Undefined();
    } catch (...) {
        error_string_ = "Unknown error executing JS function";
        has_error_ = true;
        Logger::error("Tasklets", "Unknown error executing JS function");
        return env.Undefined();
    }
}

Napi::Value JavaScriptExecutor::execute_with_context(Napi::Env env, const Napi::Function& js_function) {
    // Execute the function with proper context
    return js_function.Call(env.Global(), {});
}

void JavaScriptExecutor::log_result(const Napi::Value& result) {
    if (result.IsUndefined()) {
        Logger::info("Tasklets", "JS function returned undefined");
    } else if (result.IsNull()) {
        Logger::info("Tasklets", "JS function returned null");
    } else if (result.IsNumber()) {
        double num_value = result.As<Napi::Number>().DoubleValue();
        Logger::info("Tasklets", "JS function returned number: " + std::to_string(num_value));
    } else if (result.IsString()) {
        std::string str_value = result.As<Napi::String>().Utf8Value();
        Logger::info("Tasklets", "JS function returned string: " + str_value);
    } else if (result.IsBoolean()) {
        bool bool_value = result.As<Napi::Boolean>().Value();
        Logger::info("Tasklets", "JS function returned boolean: " + std::string(bool_value ? "true" : "false"));
    } else if (result.IsFunction()) {
        Logger::info("Tasklets", "JS function returned function");
    } else if (result.IsObject()) {
        Logger::info("Tasklets", "JS function returned object");
    } else {
        Logger::info("Tasklets", "JS function returned other type");
    }
}

// =====================================================================
// FunctionReferenceManager Implementation
// =====================================================================

FunctionReferenceManager::FunctionReferenceManager() 
    : is_valid_(false) {
}

FunctionReferenceManager::~FunctionReferenceManager() {
}

bool FunctionReferenceManager::store_function(Napi::Env env, const Napi::Function& js_function) {
    try {
        // Create a reference to preserve the function
        function_ref_ = Napi::Reference<Napi::Function>::New(js_function, 1);
        is_valid_ = true;
        Logger::info("Tasklets", "Function stored successfully");
        return true;
    } catch (...) {
        is_valid_ = false;
        Logger::error("Tasklets", "Failed to store function");
        return false;
    }
}

Napi::Function FunctionReferenceManager::get_function() const {
    if (!is_valid_) {
        return Napi::Function();
    }
    return function_ref_.Value();
}

bool FunctionReferenceManager::is_valid() const {
    return is_valid_ && !function_ref_.IsEmpty();
}

} // namespace napi
} // namespace tasklets 