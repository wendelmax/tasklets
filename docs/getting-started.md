# Getting Started with Tasklets

Tasklets is a high-performance, intelligent multi-threading library for Node.js. It provides true parallelism for CPU-intensive operations using a native C++ thread pool, preventing the main event loop from blocking.

## Key Features

- **True Parallelism**: Real multi-threading (not just worker threads) using a native C++ core.
- **Intelligent Execution**: Automatically detects and redirects trivial tasks to native execution to avoid overhead.
- **Polymorphic API**: Seamlessly handle single tasks or arrays of tasks with one method.
- **Zero-Config Adaptive Mode**: Automatically optimizes thread counts, timeouts, and memory based on your workload.
- **Smart Serialization**: High-speed primitive transfer bypassing JSON overhead.

---

## Installation

```bash
npm install @wendelmax/tasklets
```

### Prerequisites
- **Node.js**: v18.0.0 or higher.
- **Build Tools**: Required for compiling the native addon (e.g., `build-essential` on Linux, `xcode-select --install` on macOS, or `windows-build-tools` on Windows).

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

### Multiple Tasks (Parallel)
`run()` is polymorphic—pass an array to execute them in parallel across the pool.

```javascript
const [res1, res2] = await tasklets.run([
  () => heavyTask(1),
  () => heavyTask(2)
]);
```

### Fast-Path Optimization
For extremely simple tasks that don't need monitoring or retries, use `runFast()`:

```javascript
const result = await tasklets.runFast(() => 'Direct Execution');
```

---

## Intelligent Performance

Tasklets includes a **Heuristic Redirection** system. If you try to run a task that is too small (causing more overhead than benefit), Tasklets will:
1. Detect the inefficiency (default threshold: <10ms).
2. Automatically redirect future calls to native Main Thread execution.
3. Log the optimization: `[Tasklets:Heuristic] Redirecting task to native execution...`

---

## Workload Profiles (Adaptive Mode)

You can tell Tasklets what type of work you're doing to auto-tune the core:

```javascript
// High-level quick configuration
tasklets.quickConfig('cpu-intensive'); 

// Professional manual config
tasklets.configure({
  workers: 8,
  heuristicMode: true,
  minTaskDuration: 20, // ms
  logging: 'info'
});
```

| Profile | Strategy |
| :--- | :--- |
| `cpu-intensive` | Maximize worker threads, larger timeouts. |
| `io-intensive` | Higher heuristic thresholds to avoid event-loop congestion. |
| `balanced` | Optimized for mixed general-purpose workloads. |

---

## Monitoring & Health

Keep track of your system performance in real-time.

```javascript
const stats = tasklets.getStats();
// { completed_threads: 154, failed_threads: 0, average_execution_time_ms: 45.2 }

const health = tasklets.getHealth();
// { status: 'healthy', memoryUsagePercent: 42 }
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

1. **Avoid Closures**: Task functions should be self-contained or use primitive inputs.
2. **Batch Large Arrays**: Use `runAll()` or pass arrays to `run()` for mass execution.
3. **Use runFast for I/O**: If a task is mostly waiting, `runFast` has the lowest overhead.
4. **Tune your Profile**: Use `quickConfig` to match your hardware's capabilities.