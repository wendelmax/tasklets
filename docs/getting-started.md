# Getting Started with Tasklets

Tasklets is a high-performance, intelligent multi-threading library for Node.js. It provides true parallelism for CPU-intensive operations using native **Worker Threads**, preventing the main event loop from blocking.

## Key Features

- **True Parallelism**: Real multi-threading using native Node.js Workers.
- **Zero Dependencies**: Pure JavaScript implementation.
- **Polymorphic API**: Seamlessly handle single tasks or arrays of tasks with one method.
- **Cross-Platform**: Works on Windows, Linux, and macOS without compilation.

---

## Installation

```bash
npm install @wendelmax/tasklets
```

### Prerequisites
- **Node.js**: v14.0.0 or higher.
- **No Build Tools Required**: Unlike previous versions, you do **not** need Python or C++ compilers.

---

## Basic Usage

### Single Task Execution
The simplest way to offload work is using `run()`.

```javascript
const tasklets = require('@wendelmax/tasklets');

async function main() {
  // Pass a function directly
  const result = await tasklets.run(() => {
    let sum = 0;
    for (let i = 0; i < 1e8; i++) sum += i;
    return sum;
  });
  console.log('Result:', result);
}
main();
```

### Passing Data safely

Worker threads run in a separate context. You cannot access variables from the main thread directly (closures won't work). Pass data as arguments:

```javascript
const data = { offset: 100 };

// CORRECT: Pass 'data' as second argument
const result = await tasklets.run((input) => {
    // 'input' is a clone of 'data'
    return 500 + input.offset;
}, data);
```

### Monitoring

Monitor performance and health using the built-in methods:

```javascript
const stats = tasklets.getStats();
const health = tasklets.getHealth();

console.log(`Throughput: ${stats.throughput} ops/sec`);
console.log(`Memory Usage: ${health.memoryUsagePercent}%`);
```

### Multiple Tasks (Parallel)

`runAll()` executes tasks in parallel.

```javascript
const [res1, res2] = await tasklets.runAll([
    () => heavyTask(1),
    () => heavyTask(2)
]);
```

---

## Configuration

Tasklets works out of the box, but you can customize the worker pool.

```javascript
// Initialize with specific settings
const Tasklets = require('@wendelmax/tasklets');
const tasklets = new Tasklets({ maxWorkers: 8 });
```

---

## Error Handling

Tasklets automatically catches exceptions in worker threads and projects them back to the main thread Promise.

```javascript
try {
  await tasklets.run(() => { throw new Error('Worker crash!'); });
} catch (err) {
  console.error('Caught in main thread:', err.message);
}
```

---

## Best Practices

1. **Use Arguments**: Always pass external data as arguments to `run()`.
2. **Batch Tasks**: Use `runAll()` for executing multiple independent tasks.
3. **Heavy Tasks Only**: Use Tasklets for tasks taking >10ms. For trivial operations, the overhead of creating a thread outweighs the benefit.