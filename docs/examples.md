# Tasklets Examples

Common usage patterns for @wendelmax/tasklets.

## 1. Heavy Computation (CPU Bound)

Offload blocking calculations to a worker thread.

```javascript
const tasklets = require('@wendelmax/tasklets');

async function calculateFibonacci(n) {
    return await tasklets.run((num) => {
        function fib(x) {
            if (x < 2) return x;
            return fib(x - 1) + fib(x - 2);
        }
        return fib(num);
    }, n);
}

calculateFibonacci(40).then(result => console.log(result));
```

## 2. Image Processing Simulation

Processing heavy data without blocking the event loop.

```javascript
const tasklets = require('@wendelmax/tasklets');

async function processData(buffer, factor) {
    return await tasklets.run((data) => {
        // Logic inside the worker
        const { buf, f } = data;
        // Transform the buffer...
        return `Processed ${buf.length} bytes with factor ${f}`;
    }, { buf: buffer, f: factor });
}
```

## 3. Parallel Batch Processing

Process a list of items concurrently.

```javascript
const tasklets = require('@wendelmax/tasklets');

const items = [1, 2, 3, 4, 5];

async function processAll() {
    console.time('Processing');
    // Using runAll with an array of anonymous functions
    const results = await tasklets.runAll(
        items.map(item => {
            // We create a self-contained task for each item
            return (val) => {
                const start = Date.now();
                while(Date.now() - start < 100); // Simulate 100ms work
                return val * 2;
            };
        })
    );
    
    // OR using the object syntax for clarity:
    const results2 = await tasklets.runAll(
        items.map(item => ({
            task: (val) => val * 2,
            args: [item]
        }))
    );
    
    console.timeEnd('Processing');
    console.log(results);
}

processAll();
```

## 4. Monitoring and Health Checks

Keep an eye on the pool status.

```javascript
const tasklets = require('@wendelmax/tasklets');

// Periodically log system health
setInterval(() => {
    const health = tasklets.getHealth();
    const stats = tasklets.getStats();
    
    console.log(`Pool Status: ${health.status}`);
    console.log(`Active Tasks: ${stats.activeTasks}`);
    console.log(`Throughput: ${stats.throughput.toFixed(2)} ops/sec`);
}, 5000);
## 5. Configuration and v2.2 Features

Tasklets v2.2 introduces several powerful configuration options.

```javascript
const tasklets = require('@wendelmax/tasklets');

tasklets.configure({
    maxWorkers: 4,      // Max threads
    workload: 'io',     // Optimize for I/O tasks
    adaptive: true,     // Auto-scale workers
    timeout: 5000,      // Kill tasks after 5s
    maxMemory: 80,      // Limit based on system RAM %
    logging: 'debug'    // Internal debugging logs
});

// Using MODULE: prefix for CJS modules (needed for require() in workers)
const result = await tasklets.run('MODULE:/path/to/worker.cjs', data);
```

For a deep dive into these features, see the [Configuration Guide](configuration.md) and the [Full Configuration Example](examples/basics/03-configuration.js).
