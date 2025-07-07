# Tasklets API Reference

## Overview

**Tasklets 1.0.0** introduces a revolutionary **Promise-based API** that's **80% simpler** to use while maintaining exceptional performance. This modern API eliminates complex ID management and error checking, providing a clean and intuitive interface for high-performance parallel processing.

## Installation

```bash
npm install tasklets
```

## Quick Start

```javascript
const tasklets = require('tasklets');

// Modern API - one line execution
const result = await tasklets.run(() => {
  return fibonacci(40);
});
```

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [Core API](#core-api)
  - [tasklets.run()](#taskletsrun)
  - [tasklets.runAll()](#taskletsrunall)
  - [tasklets.batch()](#taskletsbatch)
  - [tasklets.retry()](#taskletsretry)
  - [tasklets.config()](#taskletsconfig)
  - [tasklets.getStats()](#taskletsgetstats)
  - [tasklets.getHealth()](#taskletsgethealth)
  - [tasklets.shutdown()](#taskletsshutdown)
- [Error Handling](#error-handling)
- [Performance Tips](#performance-tips)
- [Examples](#examples)

---

## Core API

### tasklets.run(fn, options?)

Execute a single task with automatic Promise handling.

**Parameters:**
- `fn: Function` - Function to execute in parallel
- `options: Object` (optional) - Task options

**Options:**
- `timeout: number` - Timeout in milliseconds (overrides global timeout)

**Returns:** `Promise<T>` - Promise that resolves with the task result

**Example:**
```javascript
const tasklets = require('tasklets');

// Basic usage
const result = await tasklets.run(() => {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
  sum += i;
  }
  return sum;
});

// With custom timeout
const result = await tasklets.run(() => {
  return slowOperation();
}, { timeout: 5000 });
```

### tasklets.runAll(tasks, options?)

Execute multiple tasks in parallel.

**Parameters:**
- `tasks: Function[]` - Array of functions to execute
- `options: Object` (optional) - Task options applied to all tasks

**Returns:** `Promise<T[]>` - Promise that resolves with array of results

**Example:**
```javascript
const tasklets = require('tasklets');

// Run multiple tasks in parallel
const results = await tasklets.runAll([
  () => fibonacci(35),
  () => fibonacci(36),
  () => fibonacci(37)
]);

console.log('Results:', results); // [9227465, 14930352, 24157817]

// With custom timeout for all tasks
const results = await tasklets.runAll([
  () => fastTask(),
  () => mediumTask(),
  () => slowTask()
], { timeout: 10000 });
```

---

## Configuration

### tasklets.config(options)

Configure tasklets behavior globally.

**Parameters:**
- `options: Object` - Configuration options

**Options:**
- `workers: number | 'auto'` - Number of worker threads or 'auto' for CPU core detection
- `timeout: number` - Default timeout in milliseconds (default: 30000)
- `logging: string` - Log level: 'off', 'error', 'warn', 'info', 'debug', 'trace'
- `maxMemory: string` - Maximum memory usage (future feature)

**Returns:** `Tasklets` - The tasklets instance for chaining

**Example:**
```javascript
const tasklets = require('tasklets');

// Basic configuration
tasklets.config({
  workers: 'auto',
  timeout: 15000,
  logging: 'info'
});

// Chaining configuration
tasklets
  .config({ workers: 8 })
  .config({ logging: 'debug' })
  .config({ timeout: 20000 });

// Production configuration
tasklets.config({
  workers: require('os').cpus().length,
  timeout: 30000,
  logging: 'error'
});
```

---

## Batch Processing

### tasklets.batch(taskConfigs, options?)

Execute tasks in batches with progress tracking and error handling.

**Parameters:**
- `taskConfigs: BatchTaskConfig[]` - Array of task configurations
- `options: BatchOptions` (optional) - Batch options

**BatchTaskConfig:**
- `name: string` (optional) - Task name for identification
- `task: Function` - Task function to execute
- `options: Object` (optional) - Task-specific options

**BatchOptions:**
- `onProgress: Function` (optional) - Progress callback

**Returns:** `Promise<BatchResult[]>` - Promise that resolves with batch results

**Example:**
```javascript
const tasklets = require('tasklets');

// Basic batch processing
const results = await tasklets.batch([
  { name: 'task-1', task: () => processData(1) },
  { name: 'task-2', task: () => processData(2) },
  { name: 'task-3', task: () => processData(3) }
]);

// With progress tracking
const results = await tasklets.batch(largeTasks, {
  onProgress: (progress) => {
  console.log(`Progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
  }
});

// Handle mixed success/failure results
results.forEach(result => {
  if (result.success) {
  console.log(`${result.name}: ${result.result}`);
  } else {
  console.error(`${result.name} failed: ${result.error}`);
  }
});
```

---

## Retry Operations

### tasklets.retry(fn, options?)

Retry a task with exponential backoff.

**Parameters:**
- `fn: Function` - Function to retry
- `options: RetryOptions` (optional) - Retry options

**RetryOptions:**
- `attempts: number` - Maximum number of attempts (default: 3)
- `delay: number` - Initial delay in milliseconds (default: 1000)
- `backoff: number` - Backoff multiplier (default: 2)
- `timeout: number` - Timeout per attempt

**Returns:** `Promise<T>` - Promise that resolves with the successful result

**Example:**
```javascript
const tasklets = require('tasklets');

// Basic retry
const data = await tasklets.retry(() => {
  if (Math.random() < 0.7) {
  throw new Error('Random failure');
  }
  return 'Success!';
});

// Advanced retry configuration
const apiData = await tasklets.retry(async () => {
  const response = await fetch('/api/data');
  if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}, {
  attempts: 5,
  delay: 1000,
  backoff: 2,
  timeout: 5000
});
```

---

## Monitoring and Health

### tasklets.getStats()

Get comprehensive performance statistics.

**Returns:** `TaskletStats` - Performance statistics object

**TaskletStats:**
- `workers: number` - Number of worker threads
- `tasks: Object` - Task execution statistics
  - `completed: number` - Number of completed tasks
  - `active: number` - Number of currently active tasks
  - `queued: number` - Number of queued tasks
  - `total: number` - Total number of tasks processed
- `performance: Object` - Performance metrics
  - `throughput: number` - Tasks per second
  - `averageExecutionTime: number` - Average execution time
- `system: Object` - System information
  - `cpuCores: number` - Number of CPU cores
  - `memoryUsage: Object` - Node.js memory usage
  - `uptime: number` - Process uptime
- `config: Object` - Current configuration

**Example:**
```javascript
const tasklets = require('tasklets');

const stats = tasklets.getStats();
console.log('Performance Stats:', {
  workers: stats.workers,
  completedTasks: stats.tasks.completed,
  throughput: stats.performance.throughput,
  memoryUsage: Math.round(stats.system.memoryUsage.heapUsed / 1024 / 1024) + 'MB'
});
```

### tasklets.getHealth()

Get system health status.

**Returns:** `TaskletHealth` - Health information object

**TaskletHealth:**
- `status: string` - 'healthy' or 'unhealthy'
- `workers: Object` - Worker information
  - `count: number` - Number of workers
  - `utilization: number` - Worker utilization percentage
- `memory: Object` - Memory information
  - `used: number` - Used memory in MB
  - `total: number` - Total memory in MB
  - `percentage: number` - Memory usage percentage
- `tasks: Object` - Task information
  - `completed: number` - Completed tasks
  - `active: number` - Active tasks
  - `queued: number` - Queued tasks
- `error?: string` - Error message if unhealthy

**Example:**
```javascript
const tasklets = require('tasklets');

const health = tasklets.getHealth();
console.log('System Health:', health.status);

if (health.status === 'unhealthy') {
  console.error('Health issue:', health.error);
}

// Monitor worker utilization
if (health.workers.utilization > 0.9) {
  console.warn('High worker utilization:', health.workers.utilization);
}
```

### tasklets.shutdown(options?)

Gracefully shutdown the tasklets system.

**Parameters:**
- `options: ShutdownOptions` (optional) - Shutdown options

**ShutdownOptions:**
- `timeout: number` - Timeout to wait for tasks to complete (default: 10000)

**Returns:** `Promise<void>` - Promise that resolves when shutdown is complete

**Example:**
```javascript
const tasklets = require('tasklets');

// Graceful shutdown
await tasklets.shutdown();

// Shutdown with custom timeout
await tasklets.shutdown({ timeout: 5000 });

// Production shutdown handler
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  try {
  await tasklets.shutdown({ timeout: 10000 });
  console.log('Shutdown completed');
  process.exit(0);
  } catch (error) {
  console.error('Shutdown failed:', error);
  process.exit(1);
  }
});
```

---

## TypeScript Support

Full TypeScript support with intelligent type inference:

```typescript
import tasklets, { TaskletConfig, TaskletStats, BatchTaskConfig } from 'tasklets';

// Type-safe configuration
const config: TaskletConfig = {
  workers: 8,
  timeout: 5000,
  logging: 'debug'
};
tasklets.config(config);

// Type-safe task execution
const result: number = await tasklets.run((): number => {
  return Math.random() * 100;
});

// Type-safe parallel processing
const results: string[] = await tasklets.runAll([
  (): string => 'task1',
  (): string => 'task2'
]);

// Type-safe batch processing
const batchTasks: BatchTaskConfig[] = [
  {
  name: 'task-1',
  task: (): number => processData(1)
  }
];

// Type-safe statistics
const stats: TaskletStats = tasklets.getStats();
console.log(`Throughput: ${stats.performance.throughput}`);
```

---

## Migration Guide

### From 0.x to 1.0.0

| Old API (0.x) | New API (1.0.0) | Notes |
|---------------|-----------------|-------|
| `spawn()` + `join()` + `getResult()` | `run()` | Promise-based |
| `spawnMany()` + `joinMany()` | `runAll()` | Array of functions |
| `spawnAsync()` | `run()` | Same signature |
| `hasError()` + `getError()` | `try/catch` | Standard Promise errors |
| `setWorkerThreadCount()` | `config({ workers })` | Centralized config |
| `getStats()` | `getStats()` | Enhanced object |

### Migration Examples

```javascript
//  Old API (0.x)
const taskId = tasklets.spawn(() => work());
tasklets.join(taskId);
if (tasklets.hasError(taskId)) {
  throw new Error(tasklets.getError(taskId));
}
const result = tasklets.getResult(taskId);

//  New API (1.0.0)
const result = await tasklets.run(() => work());
```

```javascript
//  Old API (0.x)
const ids = tasklets.spawnMany(3, (index) => work(index));
tasklets.joinMany(ids);
const results = ids.map(id => tasklets.getResult(id));

//  New API (1.0.0)
const results = await tasklets.runAll([
  () => work(0),
  () => work(1),
  () => work(2)
]);
```

---

## Examples

### Basic Parallel Processing

```javascript
const tasklets = require('tasklets');

async function processDataParallel() {
  const datasets = ['data1.csv', 'data2.csv', 'data3.csv'];

  const results = await tasklets.runAll(
  datasets.map(file => () => processFile(file))
  );

  return results;
}
```

### CPU-Intensive Computation

```javascript
const tasklets = require('tasklets');

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

async function computeFibonacci() {
  const numbers = [35, 36, 37, 38, 39];

  const results = await tasklets.runAll(
  numbers.map(n => () => fibonacci(n))
  );

  console.log('Fibonacci results:', results);
}
```

### Batch Processing with Progress

```javascript
const tasklets = require('tasklets');

async function processBatchWithProgress() {
  const tasks = Array.from({ length: 100 }, (_, i) => ({
  name: `task-${i}`,
  task: () => processItem(i)
  }));

  const results = await tasklets.batch(tasks, {
  onProgress: (progress) => {
  process.stdout.write(`\rProgress: ${progress.percentage}%`);
  }
  });

  console.log('\nCompleted!', results.length, 'tasks processed');
}
```

### Error Handling

```javascript
const tasklets = require('tasklets');

async function handleErrors() {
  try {
  const result = await tasklets.run(() => {
  if (Math.random() < 0.5) {
  throw new Error('Random failure');
  }
  return 'Success';
  });
  console.log('Result:', result);
  } catch (error) {
  console.error('Task failed:', error.message);
  }
}
```

### Production Configuration

```javascript
const tasklets = require('tasklets');

// Production setup
tasklets.config({
  workers: 'auto',
  timeout: 30000,
  logging: 'error'
});

// Health monitoring
setInterval(() => {
  const health = tasklets.getHealth();
  if (health.status === 'unhealthy') {
  console.error('System unhealthy:', health.error);
  }
}, 30000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await tasklets.shutdown({ timeout: 10000 });
  process.exit(0);
});
```

---

For more examples, see the [Examples Guide](examples.md) and [Getting Started](getting-started.md). 