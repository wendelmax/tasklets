# Tasklets API Reference

## Overview

Tasklets provides a unified, intelligent API for parallel task execution that automatically optimizes for single tasks, arrays of tasks, or large batches. The system includes advanced auto-configuration, auto-scheduling, multiprocessing, and comprehensive monitoring capabilities.

## Core API

### `run(task | tasks | count, task)`

The unified execution API that automatically detects and optimizes the execution strategy based on the input.

#### Single Task Execution
```javascript
const result = await tasklets.run(() => {
    return 'Hello from task!';
});
```

**Returns:**
```javascript
{
    success: true,
    data: "Hello from task!",
    error: "",
    taskId: BigInt(123),
    type: "single"
}
```

#### Array of Tasks (Auto-batch)
```javascript
const results = await tasklets.run([
    () => 'Task 1 completed',
    () => 'Task 2 completed',
    () => 'Task 3 completed'
]);
```

**Returns:**
```javascript
{
    success: true,
    totalTasks: 3,
    successfulTasks: 3,
    failedTasks: 0,
    results: ["Task 1 completed", "Task 2 completed", "Task 3 completed"],
    errors: ["", "", ""],
    taskIds: [BigInt(123), BigInt(124), BigInt(125)],
    type: "array"
}
```

#### Batch with Count (Auto-batch)
```javascript
const batchResults = await tasklets.run(1000, (index) => {
    return `Task ${index}: ${Math.pow(index, 2)}`;
});
```

**Returns:**
```javascript
{
    success: true,
    totalTasks: 1000,
    successfulTasks: 1000,
    failedTasks: 0,
    results: ["Task 0: 0", "Task 1: 1", "Task 2: 4", ...],
    errors: ["", "", "", ...],
    taskIds: [BigInt(123), BigInt(124), BigInt(125), ...],
    type: "batch"
}
```

### `getSystemInfo()`

Get comprehensive system information and statistics.

```javascript
const info = await tasklets.getSystemInfo();
```

**Returns:**
```javascript
{
    cpuCores: 8,
    threadPoolSize: 8,
    memoryUsage: "45.2 MB",
    activeTasks: 0,
    completedTasks: 1500,
    failedTasks: 3,
    status: {
        memory_manager_initialized: true,
        auto_config_initialized: true,
        auto_scheduler_initialized: true,
        multiprocessor_initialized: true,
        active_tasklets: 0,
        worker_threads: 8,
        memory_usage_percent: 12.5,
        cpu_utilization: 15.2
    },
    memory: {
        active_tasklets: 0,
        total_created: 1500,
        memory_usage_mb: 45.2,
        system_memory_percent: 12.5
    },
    threadPool: {
        worker_threads: 8,
        active_jobs: 0,
        completed_jobs: 1500,
        failed_jobs: 3,
        jobs_per_second: 1250.5
    },
    autoConfig: {
        enabled: true,
        recommendedWorkerCount: 8,
        shouldScaleUp: false,
        shouldScaleDown: false,
        workerScalingConfidence: 0.85,
        recommendedMemoryLimitPercent: 80.0,
        shouldAdjustMemory: false,
        memoryConfidence: 0.92,
        recommendedTimeoutMs: 30000,
        shouldAdjustTimeout: false,
        timeoutConfidence: 0.78
    },
    autoScheduler: {
        enabled: true,
        recommendedWorkerCount: 8,
        shouldScaleUp: false,
        shouldScaleDown: false,
        workerScalingConfidence: 0.85,
        recommendedTimeoutMs: 30000,
        shouldAdjustTimeout: false,
        timeoutConfidence: 0.78,
        recommendedPriority: 0,
        shouldAdjustPriority: false,
        priorityConfidence: 0.65,
        recommendedBatchSize: 1000,
        shouldBatch: true,
        batchingConfidence: 0.95,
        shouldRebalance: false,
        loadBalanceConfidence: 0.88
    },
    multiprocessor: {
        enabled: true,
        optimalThreadCount: 8,
        processCount: 8,
        totalOperations: 5000,
        successfulOperations: 4980,
        failedOperations: 20,
        averageProcessingTimeMs: 15.2,
        totalProcessingTimeMs: 76000,
        operationsPerSecond: 65.8
    }
}
```

## Advanced Configuration APIs

### `getAutoConfigRecommendations()`

Get intelligent auto-configuration recommendations based on current system performance.

```javascript
const recommendations = await tasklets.getAutoConfigRecommendations();
```

**Returns:**
```javascript
{
    recommendedWorkerCount: 8,
    shouldScaleUp: false,
    shouldScaleDown: false,
    workerScalingConfidence: 0.85,
    recommendedMemoryLimitPercent: 80.0,
    shouldAdjustMemory: false,
    memoryConfidence: 0.92,
    recommendedTimeoutMs: 30000,
    shouldAdjustTimeout: false,
    timeoutConfidence: 0.78
}
```

### `getAutoSchedulerRecommendations()`

Get auto-scheduler recommendations for optimal task execution.

```javascript
const schedulerRecs = await tasklets.getAutoSchedulerRecommendations();
```

**Returns:**
```javascript
{
    recommendedWorkerCount: 8,
    shouldScaleUp: false,
    shouldScaleDown: false,
    workerScalingConfidence: 0.85,
    recommendedTimeoutMs: 30000,
    shouldAdjustTimeout: false,
    timeoutConfidence: 0.78,
    recommendedPriority: 0,
    shouldAdjustPriority: false,
    priorityConfidence: 0.65,
    recommendedBatchSize: 1000,
    shouldBatch: true,
    batchingConfidence: 0.95,
    shouldRebalance: false,
    loadBalanceConfidence: 0.88
}
```

### `forceOptimization()`

Force immediate analysis and optimization of the system.

```javascript
const result = await tasklets.forceOptimization();
```

**Returns:**
```javascript
{
    success: true,
    message: "Optimization analysis completed",
    timestamp: 1703123456789
}
```

## Monitoring and Analytics APIs

### `getPerformanceMetrics()`

Get historical performance metrics for analysis and trending.

```javascript
const metrics = await tasklets.getPerformanceMetrics();
```

**Returns:**
```javascript
{
    autoConfig: [
        {
            timestamp: 1703123456789,
            cpuUtilization: 45.2,
            memoryUsagePercent: 12.5,
            workerCount: 8,
            activeJobs: 5,
            completedJobs: 1500,
            failedJobs: 3,
            workerUtilization: 0.625,
            averageExecutionTimeMs: 15.2
        }
        // ... more historical data
    ],
    autoScheduler: [
        {
            timestamp: 1703123456789,
            cpuUtilization: 45.2,
            memoryUsagePercent: 12.5,
            workerCount: 8,
            activeJobs: 5,
            completedJobs: 1500,
            failedJobs: 3,
            workerUtilization: 0.625,
            averageExecutionTimeMs: 15.2
        }
        // ... more historical data
    ]
}
```

### `getWorkloadPattern()`

Get detected workload pattern for understanding system behavior.

```javascript
const pattern = await tasklets.getWorkloadPattern();
```

**Returns:**
```javascript
{
    pattern: "CPU_INTENSIVE", // CPU_INTENSIVE, IO_INTENSIVE, MEMORY_INTENSIVE, MIXED
    description: "CPU-intensive workload detected",
    timestamp: 1703123456789
}
```

### `getMultiprocessorStats()`

Get detailed multiprocessor statistics and performance metrics.

```javascript
const stats = await tasklets.getMultiprocessorStats();
```

**Returns:**
```javascript
{
    enabled: true,
    optimalThreadCount: 8,
    processCount: 8,
    totalOperations: 5000,
    successfulOperations: 4980,
    failedOperations: 20,
    averageProcessingTimeMs: 15.2,
    totalProcessingTimeMs: 76000,
    operationsPerSecond: 65.8
}
```

## Advanced APIs (C++ Direct Access)

For maximum performance, you can use the C++ APIs directly:

### `spawn(task)`
Spawn a single task without waiting.

```javascript
const taskId = tasklets.spawn(() => {
    return 'Task result';
});
```

### `join(taskId)`
Wait for a specific task to complete.

```javascript
tasklets.join(taskId);
```

### `getResult(taskId)`
Get the result of a completed task.

```javascript
const result = tasklets.getResult(taskId);
```

### `getError(taskId)`
Get the error of a failed task.

```javascript
const error = tasklets.getError(taskId);
```

### `batch(count, task)`
Create a batch of tasks.

```javascript
const taskIds = tasklets.batch(1000, (index) => {
    return `Task ${index} result`;
});
```

### `joinBatch(taskIds)`
Wait for all tasks in a batch to complete.

```javascript
tasklets.joinBatch(taskIds);
```

### `batchFinished(taskIds)`
Check if all tasks in a batch are completed.

```javascript
const finished = tasklets.batchFinished(taskIds);
```

## Error Handling

All APIs provide comprehensive error handling:

```javascript
try {
    const result = await tasklets.run(() => {
        throw new Error('Task failed');
    });
} catch (error) {
    console.error('Task execution failed:', error.message);
}
```

For batch operations with mixed results:

```javascript
const batchResult = await tasklets.run([
    () => 'Success',
    () => { throw new Error('Failed'); },
    () => 'Another success'
]);

console.log('Successful tasks:', batchResult.successfulTasks);
console.log('Failed tasks:', batchResult.failedTasks);
console.log('Errors:', batchResult.errors);
```

## Performance Considerations

- **Single tasks**: Use `run(task)` for individual tasks
- **Small batches (2-10 tasks)**: Use `run([task1, task2, ...])` for arrays
- **Large batches (100+ tasks)**: Use `run(count, task)` for optimal performance
- **Maximum performance**: Use C++ APIs directly (`spawn`, `join`, etc.)
- **Auto-optimization**: The system automatically optimizes based on workload patterns
- **Monitoring**: Use `getPerformanceMetrics()` to track system performance over time

## Automatic Optimization

The unified `run` API automatically:

1. **Detects execution type** based on input parameters
2. **Optimizes thread pool usage** for the detected pattern
3. **Applies batch optimizations** when multiple tasks are detected
4. **Records patterns** for future automatic configuration
5. **Provides consistent result format** regardless of execution type
6. **Analyzes workload patterns** for intelligent optimization
7. **Generates recommendations** for system tuning
8. **Monitors performance** continuously for adaptive behavior

## Examples

See the [examples directory](../examples/) for comprehensive usage examples:

- [Basic usage](../examples/basic.js)
- [Batch processing](../examples/data-processing.js)
- [Error handling](../examples/error-handling.js)
- [Performance monitoring](../examples/performance-monitoring.js)
- [Advanced APIs](../examples/user-friendly-apis.js) 