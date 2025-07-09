# Performance Guide

This guide provides comprehensive information on optimizing performance when using the Tasklets library.

## Table of Contents

- [Understanding Performance](#understanding-performance)
- [Thread Pool Configuration](#thread-pool-configuration)
- [Optimal Task Sizing](#optimal-task-sizing)
- [Memory Management](#memory-management)
- [Logging Impact](#logging-impact)
- [Benchmarking](#benchmarking)
- [Common Performance Patterns](#common-performance-patterns)
- [Avoiding Performance Pitfalls](#avoiding-performance-pitfalls)
- [Performance Monitoring](#performance-monitoring)
- [Platform-Specific Optimizations](#platform-specific-optimizations)

---

## Understanding Performance

### Native vs JavaScript Performance

Tasklets uses a native C++ implementation with libuv thread pool, providing:

- **True parallelism**: Multiple tasks execute simultaneously on different CPU cores
- **Low overhead**: Minimal context switching and memory allocation
- **Efficient scheduling**: Native thread pool management
- **Non-blocking**: Main thread remains responsive

### When Tasklets Provide Benefits

 **Good use cases:**
- CPU-intensive computations
- Mathematical operations
- Data processing
- File I/O operations
- Image/video processing
- Cryptographic operations

 **Poor use cases:**
- Simple synchronous operations
- Tasks with minimal computation
- Operations that are already async in Node.js
- Memory-intensive tasks with large data transfers

---

## Thread Pool Configuration

### Optimal Thread Count

**Auto-Detection (Default):** Tasklets automatically detects your CPU cores and configures the optimal number of worker threads. No manual configuration is needed for most cases.

```javascript
const tasklets = require('tasklets');
const os = require('os');

// Default: auto-detects CPU cores (recommended for most cases)
console.log(`Auto-detected threads: ${tasklets.getWorkerThreadCount()}`);

// Manual configuration for specific workloads:
// CPU-bound tasks: match CPU cores (default behavior)
tasklets.setWorkerThreadCount(os.cpus().length);

// I/O-bound tasks: can use more threads
tasklets.setWorkerThreadCount(os.cpus().length * 2);

// Memory-intensive tasks: fewer threads
tasklets.setWorkerThreadCount(Math.max(2, os.cpus().length / 2));
```

### Dynamic Thread Pool Sizing

```javascript
const tasklets = require('tasklets');

function configureThreadPool(workloadType) {
  const cpuCount = require('os').cpus().length;

  switch (workloadType) {
  case 'cpu-intensive':
  tasklets.setWorkerThreadCount(cpuCount);
  break;
  case 'mixed':
  tasklets.setWorkerThreadCount(cpuCount * 1.5);
  break;
  case 'memory-intensive':
  tasklets.setWorkerThreadCount(Math.max(2, cpuCount / 2));
  break;
  default:
  tasklets.setWorkerThreadCount(cpuCount);
  }
}

// Configure based on your workload
configureThreadPool('cpu-intensive');
```

### Thread Pool Monitoring

```javascript
const tasklets = require('tasklets');

function monitorThreadPool() {
  const stats = tasklets.getStats();
  const threadCount = tasklets.getWorkerThreadCount();

  console.log(`Thread utilization: ${(stats.activeTasklets / threadCount * 100).toFixed(2)}%`);

  if (stats.activeTasklets === threadCount) {
  console.warn('Thread pool is saturated - consider increasing thread count');
  }
}

setInterval(monitorThreadPool, 5000);
```

---

## Optimal Task Sizing

### Task Granularity

Find the optimal balance between parallelism and overhead:

```javascript
const tasklets = require('tasklets');

// Too fine-grained (inefficient)
function processArrayBad(array) {
  return Promise.all(array.map(item => 
    tasklets.run(() => item * 2)
  ));
}

// Well-balanced
function processArrayGood(array, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return Promise.all(chunks.map(chunk => 
    tasklets.run(() => chunk.map(item => item * 2))
  )).then(results => results.flat());
}
```

### Batch Processing

Process items in batches for optimal performance:

```javascript
const tasklets = require('tasklets');

async function batchProcess(items, batchSize = 100) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(item => 
      tasklets.run(() => processItem(item))
    ));
    results.push(...batchResults);
  }

  return results;
}
```

### Adaptive Batch Sizing

```javascript
const tasklets = require('tasklets');

class AdaptiveBatchProcessor {
  constructor() {
  this.batchSize = 100;
  this.performanceHistory = [];
  }

  async processBatch(items) {
  const startTime = Date.now();
  const results = await this.processItems(items.slice(0, this.batchSize));
  const endTime = Date.now();

  const throughput = this.batchSize / (endTime - startTime);
  this.performanceHistory.push(throughput);

  this.adjustBatchSize();
  return results;
  }

  adjustBatchSize() {
  if (this.performanceHistory.length < 5) return;

  const recent = this.performanceHistory.slice(-5);
  const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;

  if (average > 10) {
  this.batchSize = Math.min(this.batchSize * 1.2, 1000);
  } else if (average < 5) {
  this.batchSize = Math.max(this.batchSize * 0.8, 50);
  }
  }
}
```

---

## Memory Management

### Efficient Data Handling

```javascript
const tasklets = require('tasklets');

// Inefficient: large data copying
function processLargeDataBad(largeArray) {
  const taskletId = tasklets.spawn(() => {
  // Entire array is copied to worker
  return largeArray.map(item => item * 2);
  });
  tasklets.join(taskletId);
  return tasklets.getResult(taskletId);
}

// Efficient: process in chunks
function processLargeDataGood(largeArray, chunkSize = 1000) {
  const results = [];

  for (let i = 0; i < largeArray.length; i += chunkSize) {
  const chunk = largeArray.slice(i, i + chunkSize);
  const taskletId = tasklets.spawn(() => 
  chunk.map(item => item * 2)
  );
  tasklets.join(taskletId);
  results.push(...tasklets.getResult(taskletId));
  }

  return results;
}
```

### Memory Pool Pattern

```javascript
const tasklets = require('tasklets');

class MemoryPool {
  constructor(bufferSize = 1024 * 1024) {
  this.bufferSize = bufferSize;
  this.availableBuffers = [];
  this.inUseBuffers = new Set();
  }

  getBuffer() {
  if (this.availableBuffers.length > 0) {
  const buffer = this.availableBuffers.pop();
  this.inUseBuffers.add(buffer);
  return buffer;
  }

  const buffer = Buffer.alloc(this.bufferSize);
  this.inUseBuffers.add(buffer);
  return buffer;
  }

  releaseBuffer(buffer) {
  if (this.inUseBuffers.has(buffer)) {
  this.inUseBuffers.delete(buffer);
  this.availableBuffers.push(buffer);
  }
  }

  async processWithBuffer(data) {
  const buffer = this.getBuffer();
  try {
  const result = await tasklets.spawnAsync(() => {
  // Use buffer for processing
  return processData(data, buffer);
  });
  return result;
  } finally {
  this.releaseBuffer(buffer);
  }
  }
}
```

---

## Logging Impact

### Log Level Performance Impact

```javascript
const tasklets = require('tasklets');

// Benchmark different log levels
async function benchmarkLogLevels() {
  const logLevels = [0, 1, 2, 3, 4, 5];
  const results = [];

  for (const level of logLevels) {
  tasklets.setLogLevel(level);

  const startTime = Date.now();
  const taskletIds = tasklets.spawnMany(1000, () => Math.random() * 1000);
  tasklets.joinMany(taskletIds);
  const endTime = Date.now();

  results.push({
  level,
  time: endTime - startTime,
  throughput: 1000 / (endTime - startTime) * 1000
  });
  }

  console.log('Log Level Performance Impact:');
  results.forEach(({ level, time, throughput }) => {
  console.log(`Level ${level}: ${time}ms (${throughput.toFixed(2)} ops/sec)`);
  });
}
```

### Production Logging Configuration

```javascript
const tasklets = require('tasklets');

// Production settings
tasklets.setLogLevel(process.env.NODE_ENV === 'production' ? 1 : 4);

// Conditional logging
function setupLogging() {
  if (process.env.NODE_ENV === 'production') {
  tasklets.setLogLevel(1); // ERROR only
  } else if (process.env.NODE_ENV === 'development') {
  tasklets.setLogLevel(4); // DEBUG
  } else {
  tasklets.setLogLevel(0); // OFF for benchmarks
  }
}
```

---

## Benchmarking

### Built-in Benchmarking

```javascript
const tasklets = require('tasklets');

// Use built-in benchmark function
const results = tasklets.benchmark(() => {
  return fibonacci(30);
}, {
  iterations: 1000,
  warmup: 100
});

console.log(`Throughput: ${results.throughput.toFixed(2)} ops/sec`);
console.log(`Average time: ${results.averageTime.toFixed(2)}ms`);
```

### Custom Benchmarking

```javascript
const tasklets = require('tasklets');

class TaskletBenchmark {
  constructor() {
  this.results = [];
  }

  async benchmark(name, taskFn, options = {}) {
  const {
  iterations = 1000,
  warmup = 100,
  concurrent = false
  } = options;

  console.log(`Running benchmark: ${name}`);

  // Warmup
  for (let i = 0; i < warmup; i++) {
  if (concurrent) {
  await tasklets.spawnAsync(taskFn);
  } else {
  const taskletId = tasklets.spawn(taskFn);
  tasklets.join(taskletId);
  }
  }

  // Benchmark
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  if (concurrent) {
  const promises = Array.from({ length: iterations }, () => 
  tasklets.spawnAsync(taskFn)
  );
  await Promise.all(promises);
  } else {
  const taskletIds = tasklets.spawnMany(iterations, taskFn);
  tasklets.joinMany(taskletIds);
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage();

  const result = {
  name,
  iterations,
  totalTime: endTime - startTime,
  averageTime: (endTime - startTime) / iterations,
  throughput: iterations / (endTime - startTime) * 1000,
  memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
  concurrent
  };

  this.results.push(result);
  this.printResult(result);
  return result;
  }

  printResult(result) {
  console.log(`  Total time: ${result.totalTime}ms`);
  console.log(`  Average time: ${result.averageTime.toFixed(2)}ms`);
  console.log(`  Throughput: ${result.throughput.toFixed(2)} ops/sec`);
  console.log(`  Memory delta: ${(result.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  }

  printSummary() {
  console.log('=== Benchmark Summary ===');
  this.results.forEach(result => {
  console.log(`${result.name}: ${result.throughput.toFixed(2)} ops/sec`);
  });
  }
}
```

---

## Common Performance Patterns

### Producer-Consumer Pattern

```javascript
const tasklets = require('tasklets');

class ProducerConsumer {
  constructor(maxConcurrent = 10) {
  this.maxConcurrent = maxConcurrent;
  this.activeTasks = 0;
  this.queue = [];
  this.results = [];
  }

  async produce(data) {
  return new Promise((resolve) => {
  this.queue.push({ data, resolve });
  this.processQueue();
  });
  }

  async processQueue() {
  if (this.activeTasks >= this.maxConcurrent || this.queue.length === 0) {
  return;
  }

  const { data, resolve } = this.queue.shift();
  this.activeTasks++;

  try {
  const result = await tasklets.spawnAsync(() => this.processData(data));
  this.results.push(result);
  resolve(result);
  } finally {
  this.activeTasks--;
  this.processQueue();
  }
  }

  processData(data) {
  // Process data
  return data * 2;
  }
}
```

### Pipeline Pattern

```javascript
const tasklets = require('tasklets');

class TaskletPipeline {
  constructor(stages) {
  this.stages = stages;
  }

  async process(data) {
  let result = data;

  for (const stage of this.stages) {
  result = await tasklets.spawnAsync(() => stage(result));
  }

  return result;
  }

  async processMany(dataArray) {
  const results = await Promise.all(
  dataArray.map(data => this.process(data))
  );
  return results;
  }
}

// Usage
const pipeline = new TaskletPipeline([
  data => data.map(x => x * 2),
  data => data.filter(x => x > 10),
  data => data.reduce((sum, x) => sum + x, 0)
]);
```

---

## Avoiding Performance Pitfalls

### Common Mistakes

 **Spawning too many tasklets:**
```javascript
// Bad: creates 1 million tasklets
const taskletIds = largeArray.map(item => tasklets.spawn(() => item * 2));
```

 **Use batch processing:**
```javascript
// Good: processes in manageable chunks
const chunkSize = 1000;
for (let i = 0; i < largeArray.length; i += chunkSize) {
  const chunk = largeArray.slice(i, i + chunkSize);
  tasklets.spawn(() => chunk.map(item => item * 2));
}
```

 **Inefficient data transfer:**
```javascript
// Bad: large objects copied to workers
const taskletId = tasklets.spawn(() => processLargeObject(hugeObject));
```

 **Process data in chunks:**
```javascript
// Good: process data in smaller pieces
const chunks = chunkLargeObject(hugeObject, 1000);
const taskletIds = chunks.map(chunk => tasklets.spawn(() => processChunk(chunk)));
```

### Memory Leaks

```javascript
const tasklets = require('tasklets');

// Prevent memory leaks by cleaning up results
function processWithCleanup(data) {
  const taskletId = tasklets.spawn(() => expensiveOperation(data));
  tasklets.join(taskletId);

  try {
  return tasklets.getResult(taskletId);
  } finally {
  // Results are automatically cleaned up, but ensure you don't keep references
  // to completed tasklet IDs
  }
}
```

---

## Performance Monitoring

### Real-time Monitoring

```javascript
const tasklets = require('tasklets');

class PerformanceMonitor {
  constructor() {
  this.metrics = {
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  averageExecutionTime: 0,
  throughput: 0,
  lastReset: Date.now()
  };
  }

  startMonitoring() {
  setInterval(() => {
  this.updateMetrics();
  this.logMetrics();
  }, 5000);
  }

  updateMetrics() {
  const stats = tasklets.getStats();
  const elapsed = (Date.now() - this.metrics.lastReset) / 1000;

  this.metrics.totalTasks = stats.totalTaskletsCreated;
  this.metrics.completedTasks = stats.completedTasklets;
  this.metrics.failedTasks = stats.failedTasklets;
  this.metrics.averageExecutionTime = stats.averageExecutionTimeMs;
  this.metrics.throughput = stats.completedTasklets / elapsed;
  }

  logMetrics() {
  console.log('=== Performance Metrics ===');
  console.log(`Total tasks: ${this.metrics.totalTasks}`);
  console.log(`Completed: ${this.metrics.completedTasks}`);
  console.log(`Failed: ${this.metrics.failedTasks}`);
  console.log(`Average execution time: ${this.metrics.averageExecutionTime.toFixed(2)}ms`);
  console.log(`Throughput: ${this.metrics.throughput.toFixed(2)} tasks/sec`);
  console.log('============================');
  }
}
```

### Performance Alerts

```javascript
const tasklets = require('tasklets');

class PerformanceAlerts {
  constructor() {
  this.thresholds = {
  maxAverageExecutionTime: 1000,
  minThroughput: 10,
  maxFailureRate: 0.05
  };
  }

  checkPerformance() {
  const stats = tasklets.getStats();

  if (stats.averageExecutionTimeMs > this.thresholds.maxAverageExecutionTime) {
  this.alert('High average execution time', stats.averageExecutionTimeMs);
  }

  if (stats.successRate < (1 - this.thresholds.maxFailureRate)) {
  this.alert('High failure rate', (1 - stats.successRate) * 100);
  }

  const throughput = stats.completedTasklets / (Date.now() / 1000);
  if (throughput < this.thresholds.minThroughput) {
  this.alert('Low throughput', throughput);
  }
  }

  alert(message, value) {
  console.warn(`PERFORMANCE ALERT: ${message} - ${value}`);
  }
}
```

---

## Platform-Specific Optimizations

### Linux Optimizations

```javascript
const tasklets = require('tasklets');
const os = require('os');

if (os.platform() === 'linux') {
  // Linux-specific optimizations
  const cpuCount = os.cpus().length;

  // Use all CPU cores for CPU-intensive tasks
  tasklets.setWorkerThreadCount(cpuCount);

  // Set process priority (requires appropriate permissions)
  try {
  process.setpriority(process.pid, -10);
  } catch (error) {
  console.warn('Could not set process priority:', error.message);
  }
}
```

### Windows Optimizations

```javascript
const tasklets = require('tasklets');
const os = require('os');

if (os.platform() === 'win32') {
  // Windows-specific optimizations
  const cpuCount = os.cpus().length;

  // Windows may benefit from slightly fewer threads
  tasklets.setWorkerThreadCount(Math.max(1, cpuCount - 1));
}
```

### macOS Optimizations

```javascript
const tasklets = require('tasklets');
const os = require('os');

if (os.platform() === 'darwin') {
  // macOS-specific optimizations
  const cpuCount = os.cpus().length;

  // macOS handles threading well
  tasklets.setWorkerThreadCount(cpuCount);
}
```

---

## Performance Testing

### Load Testing

```javascript
const tasklets = require('tasklets');

async function loadTest() {
  const testDuration = 30000; // 30 seconds
  const startTime = Date.now();
  let completedTasks = 0;

  while (Date.now() - startTime < testDuration) {
  const taskletId = tasklets.spawn(() => {
  // Simulate work
  let sum = 0;
  for (let i = 0; i < 10000; i++) {
  sum += Math.random();
  }
  return sum;
  });

  tasklets.join(taskletId);
  completedTasks++;
  }

  const actualDuration = Date.now() - startTime;
  const throughput = completedTasks / (actualDuration / 1000);

  console.log(`Load test completed:`);
  console.log(`  Duration: ${actualDuration}ms`);
  console.log(`  Completed tasks: ${completedTasks}`);
  console.log(`  Throughput: ${throughput.toFixed(2)} tasks/sec`);

  tasklets.printStats();
}

loadTest();
```

### Stress Testing

```javascript
const tasklets = require('tasklets');

async function stressTest() {
  const taskCount = 100000;
  const batchSize = 1000;

  console.log(`Starting stress test with ${taskCount} tasks...`);
  const startTime = Date.now();

  for (let i = 0; i < taskCount; i += batchSize) {
  const batch = Math.min(batchSize, taskCount - i);
  const taskletIds = tasklets.spawnMany(batch, () => Math.random() * 1000);
  tasklets.joinMany(taskletIds);

  if (i % 10000 === 0) {
  console.log(`Progress: ${i}/${taskCount} tasks completed`);
  }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`Stress test completed in ${duration}ms`);
  console.log(`Throughput: ${(taskCount / duration * 1000).toFixed(2)} tasks/sec`);

  tasklets.printStats();
}

stressTest();
```

Remember to profile your specific use case and adjust these recommendations based on your actual workload characteristics and performance requirements. 