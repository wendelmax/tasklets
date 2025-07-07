# Getting Started with Tasklets

Welcome to Tasklets! This guide will help you get up and running with **modern high-performance tasklets** in Node.js using our revolutionary **Promise-based API**.

## What are Tasklets?

Tasklets are lightweight, cooperative virtual threads that provide true parallelism using a native C++ implementation and libuv thread pool. **Version 1.0.0** introduces a completely redesigned API that's **80% simpler** to use while maintaining exceptional performance.

##  **Why Choose Tasklets?**

- **Ultra-Simple API**: One-line task execution with `await`
- **Zero Configuration**: Smart defaults that auto-detect your system
- **Promise-Native**: Built for modern JavaScript patterns
- **Exceptional Performance**: Up to 45.45M operations/second
- **TypeScript First**: Complete type definitions included

## Installation

Install tasklets using npm:

```bash
npm install tasklets
```

### Prerequisites

- Node.js 18.0.0 or higher
- Native compilation tools (for building the C++ addon)

On Linux/macOS:
```bash
# Install build tools
sudo apt-get install build-essential  # Ubuntu/Debian
# or
xcode-select --install  # macOS
```

On Windows:
```bash
npm install --global windows-build-tools
```

##  **Your First Tasklet**

The new API is incredibly simple:

```javascript
const tasklets = require('tasklets');

// That's it - one line to execute a task in parallel!
const result = await tasklets.run(() => {
  return 42;
});

console.log('Result:', result); // Result: 42
```

Compare this to the old API:
```javascript
//  Old API (0.x) - Complex
const taskId = tasklets.spawn(() => 42);
tasklets.join(taskId);
const result = tasklets.getResult(taskId);

//  New API (1.0.0) - Simple
const result = await tasklets.run(() => 42);
```

##  **Configuration (Optional)**

Tasklets work great with zero configuration, but you can customize:

```javascript
const tasklets = require('tasklets');

// Configure once at startup (optional)
tasklets.config({
  workers: 'auto',  // Auto-detect CPU cores (default)
  timeout: 10000,  // 10 second timeout (default: 30s)
  logging: 'info'  // Log level (default: 'info')
});

// Now use tasklets anywhere in your application
const result = await tasklets.run(() => heavyComputation());
```

##  **Parallel Processing**

Run multiple tasks in parallel:

```javascript
const tasklets = require('tasklets');

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Run multiple tasks in parallel
const results = await tasklets.runAll([
  () => fibonacci(35),
  () => fibonacci(36),
  () => fibonacci(37)
]);

console.log('Results:', results);
```

##  **Batch Processing with Progress**

Process large datasets with progress tracking:

```javascript
const tasklets = require('tasklets');

const largeTasks = [
  { name: 'process-file-1', task: () => processFile('file1.csv') },
  { name: 'process-file-2', task: () => processFile('file2.csv') },
  { name: 'process-file-3', task: () => processFile('file3.csv') }
];

const results = await tasklets.batch(largeTasks, {
  onProgress: (progress) => {
  console.log(`Progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
  }
});

console.log('All files processed:', results);
```

##  **Error Handling**

Error handling is automatic and follows standard Promise patterns:

```javascript
const tasklets = require('tasklets');

try {
  const result = await tasklets.run(() => {
  if (Math.random() > 0.5) {
  throw new Error('Random failure');
  }
  return 'Success';
  });
  console.log('Result:', result);
} catch (error) {
  console.error('Task failed:', error.message);
}
```

##  **Retry with Exponential Backoff**

For unreliable operations:

```javascript
const tasklets = require('tasklets');

const data = await tasklets.retry(async () => {
  // Simulate unreliable API
  if (Math.random() < 0.7) {
  throw new Error('API temporarily unavailable');
  }
  return { data: 'important data' };
}, {
  attempts: 5,
  delay: 1000,
  backoff: 2
});

console.log('Data retrieved:', data);
```

##  **Monitoring and Health**

Monitor your application's performance:

```javascript
const tasklets = require('tasklets');

// Get detailed performance statistics
const stats = tasklets.getStats();
console.log('Performance Stats:', {
  workers: stats.workers,
  completedTasks: stats.tasks.completed,
  activeTasks: stats.tasks.active,
  throughput: stats.performance.throughput
});

// Check system health
const health = tasklets.getHealth();
console.log('System Health:', health.status);
console.log('Memory Usage:', health.memory.used + 'MB');
```

## **Advanced Configuration**

### Custom Timeout

Set different timeouts for different tasks:

```javascript
// Task with custom timeout
const result = await tasklets.run(() => {
  return slowOperation();
}, { timeout: 5000 });

// Global timeout configuration
tasklets.config({ timeout: 15000 });
```

### Worker Thread Configuration

```javascript
// Auto-detect CPU cores (default)
tasklets.config({ workers: 'auto' });

// Set specific number of workers
tasklets.config({ workers: 8 });

// Check current configuration
const stats = tasklets.getStats();
console.log(`Using ${stats.workers} worker threads`);
```

##  **Common Patterns**

### Parallel Map

Create a parallel version of Array.map:

```javascript
const tasklets = require('tasklets');

async function parallelMap(array, mapper) {
  const tasks = array.map(item => () => mapper(item));
  return await tasklets.runAll(tasks);
}

// Usage
const numbers = [1, 2, 3, 4, 5];
const squares = await parallelMap(numbers, x => x * x);
console.log(squares); // [1, 4, 9, 16, 25]
```

### Task Pipeline

Chain tasks together:

```javascript
const tasklets = require('tasklets');

async function pipeline(data) {
  // Step 1: Process data
  const processed = await tasklets.run(() => preprocessData(data));

  // Step 2: Analyze in parallel
  const analyses = await tasklets.runAll([
  () => analyzePattern(processed),
  () => analyzeStatistics(processed),
  () => analyzeAnomalies(processed)
  ]);

  // Step 3: Combine results
  const result = await tasklets.run(() => combineResults(analyses));

  return result;
}
```

### Batch Processing with Limits

Process large datasets in controlled batches:

```javascript
const tasklets = require('tasklets');

async function processBatches(items, batchSize = 100) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  const tasks = batch.map(item => () => processItem(item));

  const batchResults = await tasklets.runAll(tasks);
  results.push(...batchResults);

  console.log(`Processed batch ${Math.floor(i / batchSize) + 1}`);
  }

  return results;
}
```

##  **TypeScript Support**

Full TypeScript support with intelligent type inference:

```typescript
import tasklets from 'tasklets';

// Type-safe task execution
const result: number = await tasklets.run((): number => {
  return Math.random() * 100;
});

// Type-safe parallel processing
const results: string[] = await tasklets.runAll([
  (): string => 'task1',
  (): string => 'task2',
  (): string => 'task3'
]);

// Type-safe configuration
tasklets.config({
  workers: 8,
  timeout: 5000,
  logging: 'debug'
});

// Type-safe batch processing
interface ProcessingResult {
  id: number;
  value: number;
  processed: boolean;
}

const batchResults = await tasklets.batch([
  {
  name: 'process-1',
  task: (): ProcessingResult => ({
  id: 1,
  value: 100,
  processed: true
  })
  }
]);
```

##  **Production Usage**

### Error Handling and Monitoring

```javascript
const tasklets = require('tasklets');

// Configure for production
tasklets.config({
  workers: 'auto',
  timeout: 30000,
  logging: 'error'  // Minimal logging in production
});

// Monitor system health
setInterval(() => {
  const health = tasklets.getHealth();
  if (health.status === 'unhealthy') {
  console.error('System unhealthy:', health.error);
  // Implement alerting/recovery logic
  }
}, 30000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await tasklets.shutdown({ timeout: 10000 });
  process.exit(0);
});
```

### Memory Management

```javascript
const tasklets = require('tasklets');

// Process large datasets in chunks
async function processLargeDataset(dataset) {
  const chunkSize = 1000;
  const results = [];

  for (let i = 0; i < dataset.length; i += chunkSize) {
  const chunk = dataset.slice(i, i + chunkSize);
  const chunkResults = await tasklets.runAll(
  chunk.map(item => () => processItem(item))
  );
  results.push(...chunkResults);

  // Optional: Force garbage collection for large datasets
  if (global.gc) global.gc();
  }

  return results;
}
```

##  **Migration from 0.x**

### API Changes

| Old API (0.x) | New API (1.0.0) |
|---------------|-----------------|
| `spawn()` + `join()` | `run()` |
| `spawnMany()` + `joinMany()` | `runAll()` |
| `spawnAsync()` | `run()` |
| `setWorkerThreadCount()` | `config({ workers })` |
| `getStats()` | `getStats()`  |

### Migration Example

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

## 🎓 **Best Practices**

1. **Use `config()` once**: Configure tasklets at application startup
2. **Handle errors**: Always use try-catch with async/await
3. **Monitor performance**: Use `getStats()` and `getHealth()` for monitoring
4. **Batch large datasets**: Don't spawn thousands of tasks at once
5. **Use TypeScript**: Get better developer experience with type safety

##  **Next Steps**

- Read the [API Reference](api-reference.md) for detailed method documentation
- Check out [Examples](examples.md) for more real-world use cases
- Learn about [Performance Optimization](performance-guide.md)
- Explore [Best Practices](best-practices.md)

##  **Common Issues**

### Build Errors

If you encounter build errors:

```bash
# Clear cache and rebuild
npm run clean
npm run build
```

### Performance Issues

If performance is not as expected:

1. Check worker configuration: `tasklets.getStats().workers`
2. Monitor system health: `tasklets.getHealth()`
3. Reduce logging: `tasklets.config({ logging: 'off' })`

### Memory Issues

For applications with many tasklets:

1. Use batch processing: `tasklets.batch()` instead of `runAll()`
2. Monitor memory: `tasklets.getHealth().memory`
3. Process in chunks for large datasets

## 🆘 **Support**

- Check the [Troubleshooting Guide](troubleshooting.md)
- Visit the [GitHub repository](https://github.com/wendelmax/tasklets)
- Open an issue for bugs or feature requests

---

**Ready to build high-performance applications with modern tasklets!**  