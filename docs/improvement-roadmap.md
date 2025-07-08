# Improvement Roadmap for Tasklets

This document outlines critical improvements needed based on test results and benchmarks.

## 🚨 Critical Issues (High Priority)

### 1. Native Module Result Handling
**Problem:** JavaScript tasks don't return actual computed values, only "Task completed successfully"

**Impact:** Core functionality is broken - users can't get task results
**Current State:** 95+ tests failing due to this issue
**Fix Required:** Complete rewrite of result capture in `ThreadSafeFunction`

```cpp
// Current problematic code in native_thread_pool.cpp:
auto status = tsfn.BlockingCall([result_holder, error_holder, has_error_holder](Napi::Env env, Napi::Function jsCallback) {
  try {
  Napi::Value result = jsCallback.Call({});
  //  Result is not properly captured and serialized
  }
  // ...
});
```

**Solution:**
- Implement proper value serialization for all JavaScript types
- Add type detection and appropriate conversion to string
- Test with primitives, objects, arrays, and complex data structures

### 2. Error Propagation
**Problem:** JavaScript errors are not propagated to the calling thread

**Impact:** Error handling is completely broken
**Current State:** All error tests pass incorrectly (errors are silently ignored)

**Solution:**
- Fix exception catching in worker threads
- Implement proper error serialization
- Add error type preservation (Error, TypeError, etc.)

### 3. N-API Fatal Exceptions
**Problem:** Uncaught N-API callback exceptions causing process termination

**Impact:** Application crashes in production
**Current State:** Random crashes during test execution

```
(node:2001010) [DEP0168] DeprecationWarning: Uncaught N-API callback exception detected
FATAL ERROR: Error::New napi_get_last_error_info
```

**Solution:**
- Audit all N-API calls for proper error handling
- Add try-catch blocks around all callback functions
- Implement proper resource cleanup on errors

##  Performance Optimizations (Medium Priority)

### 1. Task Overhead for Simple Operations
**Current Performance:**
- Simple tasks: ~37k ops/sec  
- Native execution: ~6k ops/sec (but with complex computation)
- **Issue:** High overhead for lightweight tasks

**Improvements:**
- Implement task batching at native level
- Add fast-path for simple computations
- Consider task pooling to reduce allocation overhead

### 2. Memory Management
**Issues Identified:**
- No explicit memory cleanup in benchmarks
- Potential memory leaks in long-running applications
- ThreadSafeFunction resources not properly released

**Solutions:**
- Add automatic cleanup for completed tasks
- Implement memory pool for frequently used objects
- Add memory usage monitoring and alerts

### 3. Worker Thread Efficiency
**Current Issues:**
- Fixed worker pool size
- No dynamic scaling based on workload
- Suboptimal work distribution

**Improvements:**
- Implement adaptive worker scaling
- Add work-stealing algorithm
- Optimize thread affinity for CPU-bound tasks

##  API and Usability Improvements (Medium Priority)

### 1. Enhanced Configuration
**Current Limitations:**
```javascript
// Limited configuration options
tasklets.config({
  workers: 'auto',  // Only supports basic values
  timeout: 30000,  // Global timeout only
  logging: 'info'  // Basic logging levels
});
```

**Proposed Enhancements:**
```javascript
tasklets.config({
  workers: {
  min: 2,
  max: 'cpu_count * 2',
  scaling: 'adaptive'
  },
  timeout: {
  default: 30000,
  perTask: true
  },
  memory: {
  limit: '2GB',
  cleanup: 'aggressive'
  },
  logging: {
  level: 'info',
  format: 'json',
  destination: 'file'
  }
});
```

### 2. Better Error Information
**Current State:** Generic error messages
**Proposed:** Detailed error context with stack traces

```javascript
// Current
catch(error) { console.log(error.message); } // "Task failed"

// Proposed
catch(error) { 
  console.log(error.taskId);  // 12345
  console.log(error.workerThread);  // 2
  console.log(error.duration);  // 1250ms
  console.log(error.stackTrace);  // Full JS stack
  console.log(error.nativeTrace);  // C++ stack if available
}
```

### 3. Advanced Task Management
**Missing Features:**
- Task cancellation
- Task prioritization
- Progress tracking for long-running tasks
- Task dependencies

**Implementation:**
```javascript
const taskId = await tasklets.run(longTask, {
  priority: 'high',
  cancellable: true,
  onProgress: (percent) => console.log(`${percent}% complete`)
});

// Later...
await tasklets.cancel(taskId);
```

##  Monitoring and Observability (Low Priority)

### 1. Enhanced Metrics
**Current Metrics:** Basic worker count, task counts
**Needed Metrics:**
- Task execution time histograms
- Memory usage per worker
- Error rates by error type
- Queue depth over time
- Worker utilization heat maps

### 2. Health Checks
**Implementation:**
```javascript
const health = tasklets.getHealth();
// {
//  status: 'healthy',
//  workers: { active: 4, idle: 2, crashed: 0 },
//  memory: { used: '245MB', available: '1.2GB' },
//  latency: { p50: 12, p95: 45, p99: 120 },
//  errors: { rate: 0.02, recent: [] }
// }
```

### 3. Debugging Tools
- Task execution tracing
- Performance profiling integration
- Visual queue monitoring
- Worker thread debugging

##  Infrastructure Improvements (Low Priority)

### 1. Build System
**Current Issues:**
- Complex build configuration
- Platform-specific build failures
- Missing prebuilt binaries

**Solutions:**
- Simplify build process
- Add comprehensive CI/CD for all platforms
- Distribute prebuilt binaries for major platforms

### 2. Testing Infrastructure
**Current State:** 163 tests, many failing due to native module issues
**Improvements:**
- Add native module mocking for unit tests
- Implement integration test environment
- Add performance regression testing
- Cross-platform testing automation

### 3. Documentation
**Missing Documentation:**
- Architecture overview
- Performance tuning guide
- Migration guide from other libraries
- Real-world usage patterns

##  Implementation Priority

### Phase 1 (Critical - 2-4 weeks)
1. Fix native module result handling
2. Fix error propagation
3. Resolve N-API exceptions

### Phase 2 (Performance - 4-6 weeks)
1. Optimize task overhead
2. Implement memory management
3. Add worker scaling

### Phase 3 (Features - 6-8 weeks)
1. Enhanced configuration
2. Task management features
3. Better error reporting

### Phase 4 (Infrastructure - 4-6 weeks)
1. Monitoring and metrics
2. Build system improvements
3. Documentation completion

##  Success Metrics

### Phase 1 Success Criteria:
- [ ] All 163 tests pass
- [ ] No N-API fatal exceptions
- [ ] Proper JavaScript value return
- [ ] Correct error propagation

### Phase 2 Success Criteria:
- [ ] <1ms overhead for simple tasks
- [ ] Memory usage stable over time
- [ ] Adaptive worker scaling functional

### Phase 3 Success Criteria:
- [ ] Comprehensive configuration API
- [ ] Task cancellation working
- [ ] Detailed error context available

### Phase 4 Success Criteria:
- [ ] Full monitoring dashboard
- [ ] Automated multi-platform builds
- [ ] Complete documentation coverage

---

*This roadmap should be reviewed and updated as implementation progresses and new issues are discovered.* 

## Proposed Modern API (Future)

This section outlines a proposed "modern" API that aims to simplify common patterns. This is not yet implemented.

### `tasklets.runAll(tasks, options?)`
Execute multiple tasks in parallel and return a single Promise that resolves when all tasks are complete.

- **`tasks: Function[]`**: An array of functions to execute.
- **`options: Object`**: Options to apply to all tasks.
- **Returns**: `Promise<T[]>`

**Example:**
```javascript
const results = await tasklets.runAll([
  () => fibonacci(35),
  () => fibonacci(36),
]);
```

### `tasklets.batch(taskConfigs, options?)`
A more advanced method for executing tasks in batches with progress tracking.

- **`taskConfigs: { name: string, task: Function }[]`**: Array of named task configurations.
- **`options: { onProgress: Function }`**: Options including a progress callback.
- **Returns**: `Promise<{name: string, success: boolean, result?: any, error?: any}[]>`

**Example:**
```javascript
const results = await tasklets.batch(largeTaskList, {
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  }
});
```

### `tasklets.retry(fn, options?)`
Automatically retry a task if it fails, with configurable exponential backoff.

- **`fn: Function`**: The function to retry.
- **`options: { attempts: number, delay: number, backoff: number }`**: Retry strategy options.
- **Returns**: `Promise<T>`

**Example:**
```javascript
const data = await tasklets.retry(() => fetchFromFlakyApi(), {
  attempts: 5,
  delay: 200, // ms
  backoff: 2
});
```

### `tasklets.shutdown(options?)`
Gracefully shut down the thread pool, waiting for active tasks to complete.

- **`options: { timeout: number }`**: Timeout to wait for tasks to finish.
- **Returns**: `Promise<void>`

### Advanced `tasklets.config(options)`
The configuration will be expanded to include more options for controlling the thread pool.

- **`workers: number | 'auto'`**: Number of worker threads.
- **`timeout: number`**: Default timeout for tasks.
- **`maxMemory: string`**: A future feature to limit memory usage. 