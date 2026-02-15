# Tasklets - Lightweight Parallelism for Node.js

A zero-dependency library for managing **Worker Threads** in Node.js with a promise-based API. Tasklets simplifies parallel execution, helping you offload CPU-intensive tasks without blocking the main event loop.

[![NPM Version](https://img.shields.io/npm/v/@wendelmax/tasklets.svg)](https://www.npmjs.com/package/@wendelmax/tasklets)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Tasklets v2.0?

Tasklets v1.x was an experiment with native C++ addons (`node-gyp`). While fast, it proved to be a maintenance nightmare—build failures on different OS versions, compiler dependency hell, and fragility across Node.js updates.

v2.0 is a complete rewrite in 100% native JavaScript using Worker Threads. It matches the "bare metal" performance of v1.x (thanks to the new "Fast Path" engine) but with zero compilation headaches. It just works.

## Features

- **Simple API**: Run functions in parallel using standard `async/await`.
- **Low Overhead**: Features a "Fast Path" optimization to bypass queuing when workers are available.
- **Zero Dependencies**: Written in 100% native JavaScript. No C++ bindings or `node-gyp` required.
- **Automatic Scaling**: Optionally configures the worker pool based on CPU availability and load.
- **TypeScript Support**: Includes comprehensive type definitions.

## Installation

```bash
npm install @wendelmax/tasklets
```

Requires Node.js 14.0.0 or higher.

## Usage

### Basic Example

```javascript
const Tasklets = require('@wendelmax/tasklets');
const tasklets = new Tasklets();

// Define a function to run in a worker
function heavyComputation(limit) {
    let sum = 0;
    for (let i = 0; i < limit; i++) {
        sum += Math.sqrt(i);
    }
    return sum;
}

(async () => {
    // Run a single task
    const result = await tasklets.run(heavyComputation, 1000000);
    console.log('Result:', result);

    // Run multiple tasks in parallel
    const results = await tasklets.runAll([
        () => heavyComputation(500000),
        () => heavyComputation(1000000)
    ]);
    console.log('Results:', results);
    
    // Clean up
    await tasklets.terminate();
})();
```

### Advanced Configuration

You can tune the pool to fit your specific workload requirements.

```javascript
const tasklets = new Tasklets();

tasklets.configure({
    maxWorkers: 8,         // Number of worker threads (or 'auto' for CPU count)
    minWorkers: 4,         // Keep 4 workers ready
    workload: 'io',        // Optimize for I/O-bound tasks
    adaptive: true,        // Auto-scale workers based on system load
    timeout: 10000,        // Reject tasks that exceed 10s
    maxMemory: 80,         // Block new workers above 80% system memory
    logging: 'warn',       // Log level: 'debug' | 'info' | 'warn' | 'error' | 'none'
});
```

For full documentation of all options, `MODULE:` prefix usage, and argument validation, see [Configuration Guide](docs/configuration.md).

### Batch Processing

For processing arrays of data efficiently:

```javascript
const data = [10, 20, 30, 40];

const results = await tasklets.batch(data.map(val => ({
    task: (n) => n * 2,
    args: [val]
})));

console.log(results); 
// [{ result: 20, success: true }, { result: 40, success: true }, ...]
```

## Performance Note

Tasklets is designed to be as close to "bare metal" as possible. When a worker is free, tasks are dispatched immediately without entering a queue, resulting in minimal latency overhead.

## License

MIT License - see [LICENSE](LICENSE) file for details.