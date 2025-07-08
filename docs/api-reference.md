# Tasklets API Reference

## Overview

**Tasklets** provides a powerful yet simple API to run CPU-intensive tasks in a separate thread pool, preventing them from blocking the Node.js event loop.

The API is divided into two main parts:
- **High-Level API**: A modern, Promise-based API (`run`, `getStatus`) that is easy to use and covers most use cases. This is the recommended API for most users.
- **Low-Level API**: The core native functions (`spawn`, `join`, etc.) that offer fine-grained control for more complex scenarios.

---

## High-Level API

This is the recommended API for interacting with tasklets.

### tasklets.run(fn, options?)

Executes a task asynchronously and returns a Promise that resolves with the result. This is a wrapper around the low-level `spawn` and result-checking functions.

**Parameters:**
- `fn: Function` - The function to execute in a worker thread.
- `options: Object` (optional) - Task options.
  - `fastMode: boolean` - (Experimental) Uses a more direct, but potentially less safe, way of transferring results. Defaults to `false`.

**Returns:** `Promise<any>` - A Promise that resolves with the task's return value or rejects with an error.

**Example:**
```javascript
const tasklets = require('tasklets');

try {
  const result = await tasklets.run(() => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  });
  console.log('Result:', result);
} catch (error) {
  console.error('Tasklet failed:', error);
}
```

### tasklets.getStatus(taskletId)

Retrieves the complete status and result of a tasklet created with the low-level `spawn` function.

**Parameters:**
- `taskletId: number` - The ID of the tasklet returned by `spawn`.

**Returns:** `Object | null` - An object containing the tasklet's status, or `null` if the ID is invalid.
- `isFinished: boolean` - True if the task has completed.
- `hasError: boolean` - True if the task completed with an error.
- `result: any` - The result of the tasklet (if finished and successful).
- `error: string` - The error message (if finished with an error).

**Example:**
```javascript
const taskletId = tasklets.spawn(() => 'Hello');
// ... wait some time or use join ...
tasklets.join(taskletId);
const status = tasklets.getStatus(taskletId);
console.log(status);
// { isFinished: true, hasError: false, result: 'Hello', error: '' }
```

### tasklets.getStats()

Returns an object containing performance statistics from the native thread pool.

**Returns:** `Object` - An object with various statistics like active threads, completed tasks, etc.

**Example:**
```javascript
const stats = tasklets.getStats();
console.log(stats);
```

### tasklets.getHealth()

Returns a health-check object with information about worker utilization and memory. Note: This is a high-level summary.

**Returns:** `Object` - An object containing health information.

**Example:**
```javascript
const health = tasklets.getHealth();
console.log(health);
```

---

## Configuration

### tasklets.config(options)

Configures the tasklets library behavior.

**Parameters:**
- `options: Object` - Configuration options.
  - `logging: string` - Sets the internal log level. Can be `'off'`, `'error'`, `'warn'`, `'info'`, `'debug'`, or `'trace'`.

**Example:**
```javascript
const tasklets = require('tasklets');

// Set logging to debug level
tasklets.config({
  logging: 'debug'
});
```

---

## Low-Level API

This API provides direct access to the native bindings for fine-grained control. It's recommended for advanced use cases that require manual management of tasklet IDs.

### tasklets.spawn(fn, options?)
Submits a function to be executed in the thread pool and returns its ID. This is a non-blocking call.

- **Returns:** `number` (Tasklet ID)

### tasklets.join(taskletId)
Blocks the main thread until the specified tasklet has finished execution. **Use with caution**, as this can freeze the event loop if the task takes a long time.

### tasklets.is_tasklet_finished(taskletId)
Checks if a tasklet has finished. Returns `boolean`.

### tasklets.has_tasklet_error(taskletId)
Checks if a finished tasklet has an error. Returns `boolean`.

### tasklets.get_result(taskletId)
Gets the result of a finished tasklet. The result is typically a string. For other types, they are JSON-serialized.

### tasklets.get_native_result(taskletId)
(Experimental) Gets the result using a faster, more direct method.

### tasklets.get_tasklet_error(taskletId)
Gets the error message of a failed tasklet. Returns `string`. 