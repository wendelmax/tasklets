# Migration Guide: TaskletData → Tasklet

## Overview

This guide documents the migration from the old `TaskletData` architecture to the new `Tasklet`-based architecture, improving SOLID compliance and code organization.

## What Changed

### ❌ **Removed: TaskletData**

```cpp
// OLD: TaskletData struct (removed)
struct TaskletData {
    Napi::Reference<Napi::Function> js_function_ref;
    Napi::Value result_value;
    std::string error_string{ "" };
    bool has_error{ false };
    bool completed{ false };
    bool result_executed{ false };
    std::mutex completion_mutex;
    std::condition_variable completion_cv;
    
    bool execute_js_function(Napi::Env env);
};
```

### ✅ **New: Extended Tasklet Class**

```cpp
// NEW: Enhanced Tasklet class
class Tasklet {
public:
    // Native tasklet constructor
    Tasklet(uint64_t id, std::function<void()> task);
    
    // JavaScript tasklet constructor
    Tasklet(uint64_t id, Napi::Env env, Napi::Function js_function);
    
    // State management
    bool is_finished() const;
    bool is_running() const;
    void mark_finished();
    
    // Result management
    void set_result(const std::string& result);
    const std::string& get_result() const;
    void set_napi_result(const Napi::Value& result);
    Napi::Value get_napi_result() const;
    
    // Error management
    void set_error(const std::string& error);
    const std::string& get_error() const;
    bool has_error() const;
    
    // JavaScript execution
    bool execute_js_function(Napi::Env env);
    bool is_javascript_tasklet() const;
    Napi::Function get_js_function() const;
    
    // Synchronization
    void wait_for_completion();
    void notify_completion();
};
```

## Migration Steps

### 1. **State Management Changes**

#### Before (TaskletData):
```cpp
static std::unordered_map<uint64_t, std::unique_ptr<TaskletData>> tasklet_data_map;
static std::mutex contexts_mutex;
static std::atomic<uint64_t> next_context_id{1};
```

#### After (Tasklet):
```cpp
static std::unordered_map<uint64_t, std::shared_ptr<Tasklet>> tasklets_map;
static std::mutex tasklets_mutex;
static std::atomic<uint64_t> next_tasklet_id{1};
```

### 2. **Tasklet Creation**

#### Before:
```cpp
auto tasklet_data = std::make_unique<TaskletData>(env, js_function);
tasklet_data_map[context_id] = std::move(tasklet_data);
```

#### After:
```cpp
auto tasklet = std::make_shared<Tasklet>(tasklet_id, env, js_function);
store_tasklet(tasklet_id, tasklet);
```

### 3. **JavaScript Function Execution**

#### Before:
```cpp
auto tasklet_data_it = tasklet_data_map.find(tasklet_id);
TaskletData* tasklet_data = tasklet_data_it->second.get();
bool success = tasklet_data->execute_js_function(env);
```

#### After:
```cpp
auto tasklet = get_tasklet(tasklet_id);
if (tasklet && tasklet->is_javascript_tasklet()) {
    bool success = tasklet->execute_js_function(env);
}
```

### 4. **Result Retrieval**

#### Before:
```cpp
std::string result = tasklet_data->result_value;
std::string error = tasklet_data->error_string;
```

#### After:
```cpp
std::string result = tasklet->get_result();
std::string error = tasklet->get_error();
```

### 5. **Cleanup**

#### Before:
```cpp
void cleanup_tasklet_data(uint64_t tasklet_id) {
    std::lock_guard<std::mutex> lock(contexts_mutex);
    tasklet_data_map.erase(tasklet_id);
}
```

#### After:
```cpp
void cleanup_tasklet(uint64_t tasklet_id) {
    std::lock_guard<std::mutex> lock(tasklets_mutex);
    tasklets_map.erase(tasklet_id);
}
```

## Benefits of Migration

### 1. **SOLID Compliance**
- ✅ **Single Responsibility**: Tasklet handles its own lifecycle
- ✅ **Open/Closed**: Easy to extend without modifying existing code
- ✅ **Dependency Inversion**: Depends on abstractions, not concrete implementations

### 2. **Better Architecture**
- ✅ **Unified State Management**: All state in one place
- ✅ **Clear Separation**: Native vs JavaScript tasklets
- ✅ **Improved Error Handling**: Centralized error management

### 3. **Enhanced Functionality**
- ✅ **Type Safety**: Strong typing for different tasklet types
- ✅ **Better Logging**: Context-aware logging
- ✅ **Memory Management**: Proper RAII and cleanup

### 4. **Developer Experience**
- ✅ **Easier Testing**: Isolated components
- ✅ **Better Debugging**: Clear state transitions
- ✅ **Extensibility**: Easy to add new features

## API Compatibility

### ✅ **Maintained APIs**
- `spawn(function)` → Returns tasklet ID
- `run(function)` → Returns promise with result
- `getResult(taskletId)` → Returns result object
- `hasError(taskletId)` → Returns boolean
- `getError(taskletId)` → Returns error string
- `isFinished(taskletId)` → Returns boolean

### 🔄 **Internal Changes**
- State management moved from `TaskletData` to `Tasklet`
- JavaScript execution integrated into `Tasklet` class
- Better error handling and logging
- Improved thread safety

## Testing the Migration

### 1. **Run the Migration Script**
```bash
./scripts/migrate_to_tasklet.sh
```

### 2. **Test Basic Functionality**
```javascript
const tasklets = require('./lib');

// Test spawn
const result = tasklets.spawn(() => 42);
console.log('Spawn result:', result);

// Test run
tasklets.run(() => 42).then(result => {
    console.log('Run result:', result);
});
```

### 3. **Test Batch Operations**
```javascript
// Test batch processing
const functions = [
    () => 1,
    () => 2,
    () => 3
];

tasklets.run(functions).then(result => {
    console.log('Batch result:', result);
});
```

## Rollback Plan

If issues arise, you can rollback using the backup:

```bash
# Restore original file
cp src/tasklets.cpp.backup src/tasklets.cpp

# Rebuild
npm run build
```

## Performance Impact

### ✅ **Improvements**
- **Memory Usage**: Reduced due to unified state management
- **Thread Safety**: Better synchronization with proper mutex usage
- **Error Recovery**: Faster error detection and handling

### ⚠️ **Considerations**
- **Initial Setup**: Slightly more complex constructor logic
- **Memory Overhead**: Shared pointers vs unique pointers (minimal impact)

## Future Enhancements

The new architecture enables:

1. **Plugin System**: Easy to add new tasklet types
2. **Monitoring**: Better integration with performance monitoring
3. **Caching**: Result caching and reuse
4. **Priority Queues**: Tasklet priority management
5. **Dependency Management**: Tasklet dependencies and ordering

## Conclusion

The migration from `TaskletData` to `Tasklet` represents a significant improvement in code organization, maintainability, and SOLID compliance. The new architecture provides a solid foundation for future enhancements while maintaining backward compatibility with existing APIs.

The refactored code is more testable, extensible, and follows software engineering best practices, making it easier to maintain and evolve over time. 