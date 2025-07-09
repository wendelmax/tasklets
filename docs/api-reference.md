# Tasklets API Reference

## Overview

Tasklets provides a unified, intelligent API for parallel task execution that automatically optimizes for single tasks, arrays of tasks, or large batches. The system includes advanced auto-configuration, auto-scheduling, multiprocessing, and comprehensive monitoring capabilities.

## Core API

### `run(taskFunction, options?)`

Execute a single task and wait for completion.

```javascript
const result = await tasklets.run(() => {
  return 'Hello from task!';
});
```

**Returns:** The result of the task function directly.

### `runAll(tasks, options?)`

Execute multiple tasks in parallel.

```javascript
const results = await tasklets.runAll([
  () => 'Task 1 completed',
  () => 'Task 2 completed',
  () => 'Task 3 completed'
]);
```

**Returns:** Array of results from all tasks.

### `batch(taskConfigs, options?)`

Execute tasks in batch with progress tracking.

```javascript
const results = await tasklets.batch([
  { name: 'task1', task: () => 'Result 1' },
  { name: 'task2', task: () => 'Result 2' },
  { name: 'task3', task: () => 'Result 3' }
], {
  progress: (completed, total, name) => {
    console.log(`Progress: ${completed}/${total} - ${name}`);
  }
});
```

**Returns:** Array of results with task names.

### `getStats()`

Get basic system statistics.

```javascript
const stats = tasklets.getStats();
```

**Returns:** Object with basic performance statistics.

### `getHealth()`

Get system health information.

```javascript
const health = tasklets.getHealth();
```

**Returns:** Object with system health status.

### `getDetailedStats()`

Get comprehensive system statistics.

```javascript
const stats = tasklets.getDetailedStats();
```

**Returns:** Object with detailed performance metrics.

## Configuration APIs

### `configure(options)`

Configure tasklets with various options.

```javascript
tasklets.configure({
  workers: 4,
  timeout: 30000,
  logging: 'info'
});
```

### `config(options)`

Alias for configure method.

```javascript
tasklets.config({
  workers: 'auto',
  timeout: 10000
});
```

### `setWorkerThreadCount(count)`

Set the number of worker threads.

```javascript
tasklets.setWorkerThreadCount(8);
```

### `getWorkerThreadCount()`

Get the current number of worker threads.

```javascript
const count = tasklets.getWorkerThreadCount();
```

### `setLogLevel(level)`

Set the logging level.

```javascript
tasklets.setLogLevel('info');
```

### `getLogLevel()`

Get the current logging level.

```javascript
const level = tasklets.getLogLevel();
```
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