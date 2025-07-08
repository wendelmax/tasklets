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
 * @file napi_wrapper.hpp
 * @brief N-API wrapper utilities for Node.js integration
 * @author Jackson Wendel Santos Sá
 * @date 2025
 */

#ifndef NAPI_WRAPPER_HPP
#define NAPI_WRAPPER_HPP

#include <napi.h>
#include "../core/native_thread_pool.hpp"
#include "../core/memory_manager.hpp"

class TaskletsWrapper : public Napi::ObjectWrap<TaskletsWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    TaskletsWrapper(const Napi::CallbackInfo& info);
    ~TaskletsWrapper();

private:
    static Napi::FunctionReference constructor;
    std::unique_ptr<tasklets::NativeThreadPool> thread_pool;
    
    Napi::Value SpawnJs(const Napi::CallbackInfo& info);
    Napi::Value Configure(const Napi::CallbackInfo& info);
    Napi::Value GetStats(const Napi::CallbackInfo& info);
    Napi::Value GetResult(const Napi::CallbackInfo& info);
    Napi::Value HasError(const Napi::CallbackInfo& info);
    Napi::Value GetError(const Napi::CallbackInfo& info);
};

#endif 