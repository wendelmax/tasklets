# Getting Started with Tasklets

Welcome to Tasklets! This guide will help you get up and running with high-performance tasklets in Node.js.

## What are Tasklets?

Tasklets are lightweight, cooperative tasks that provide true parallelism for CPU-intensive operations using a native C++ thread pool. This prevents heavy computations from blocking the main Node.js event loop.

##  **Why Choose Tasklets?**

- **Simple API**: An easy-to-use, Promise-based API with `await`.
- **High Performance**: Offload heavy work to a native C++ thread pool for maximum speed.
- **Promise-Native**: Built for modern JavaScript `async/await` patterns.
- **TypeScript First**: Complete type definitions included.

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

The easiest way to use tasklets is with the `run` function, which returns a Promise.

```javascript
const tasklets = require('tasklets');

async function main() {
  console.log('Running a task in parallel...');
  // Use tasklets.run and await the result
  const result = await tasklets.run(() => {
    // This code runs in a worker thread
    let sum = 0;
    for (let i = 0; i <= 100000000; i++) {
        sum += i;
    }
    return sum;
  });

  console.log('Result:', result);
}

main();
```

##  **Configuration**

You can configure certain aspects of the library, such as logging.

```javascript
const tasklets = require('tasklets');

// Configure once at startup
tasklets.config({
  logging: 'info'  // Set log level ('off', 'error', 'warn', 'info', 'debug', 'trace')
});

// Now use tasklets anywhere in your application
const result = await tasklets.run(() => 'My Task');
```

##  **Error Handling**

Errors are handled automatically using standard `try...catch` blocks with Promises.

```javascript
const tasklets = require('tasklets');

async function main() {
    try {
      const result = await tasklets.run(() => {
        if (Math.random() > 0.5) {
          throw new Error('This task failed randomly!');
        }
        return 'Success';
      });
      console.log('Result:', result);
    } catch (error) {
      console.error('Task failed:', error.message);
    }
}

main();
```

##  **Monitoring**

You can get performance statistics and health information from the library.

```javascript
const tasklets = require('tasklets');

// Get detailed performance statistics
const stats = tasklets.getStats();
console.log('Performance Stats:', stats);

// Check system health
const health = tasklets.getHealth();
console.log('System Health:', health.status);
```

## Advanced Usage: Low-Level API

For more complex scenarios where you need fine-grained control, you can use the low-level API. This involves manually managing tasklet IDs with `spawn` and `join`.

This approach can be useful for patterns where you fire off many tasks and check their results later without blocking.

```javascript
const tasklets = require('tasklets');

// Spawn a task but don't wait for it yet
const taskId = tasklets.spawn(() => {
  // some long-running task
  return 'done';
});

console.log(`Task ${taskId} was spawned.`);

// Later in your code...
console.log('Waiting for the task to finish...');
tasklets.join(taskId); // This will block until the task is done

const status = tasklets.getStatus(taskId);
if (status.hasError) {
    console.error('Task failed:', status.error);
} else {
    console.log('Task succeeded:', status.result);
}
```

For a full list of low-level functions, please see the **[API Reference](api-reference.md)**.  