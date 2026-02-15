# Configuration

Tasklets works out of the box with sensible defaults, but you can customize every aspect of the worker pool.

## Quick Start

```javascript
const Tasklets = require('@wendelmax/tasklets');
const tasklets = new Tasklets();

tasklets.configure({
    maxWorkers: 8,
    minWorkers: 4,
    workload: 'io',
    adaptive: true,
    timeout: 10000,
    maxMemory: 80,
    logging: 'warn',
});
```

## Options Reference

### `maxWorkers`
- **Type:** `number | 'auto'`
- **Default:** `os.cpus().length`

Maximum number of worker threads in the pool. Use `'auto'` to set based on CPU count.

```javascript
tasklets.configure({ maxWorkers: 4 });
tasklets.configure({ maxWorkers: 'auto' }); // same as os.cpus().length
```

---

### `minWorkers`
- **Type:** `number`
- **Default:** `1`

Minimum number of workers kept alive in the pool. These workers stay warm to reduce cold start latency when new tasks arrive.

```javascript
tasklets.configure({ minWorkers: 4 }); // always keep 4 workers ready
```

---

### `idleTimeout`
- **Type:** `number` (milliseconds)
- **Default:** `5000`

Time in milliseconds before an idle worker is terminated. Workers above `minWorkers` are cleaned up after this period of inactivity.

> **Note:** The `workload` option overrides this value with optimized defaults.

---

### `workload`
- **Type:** `'cpu' | 'io' | 'mixed'`
- **Default:** `'mixed'`

Optimizes the scheduler idle timeout based on your workload type:

| Value | Idle Timeout | Best For |
|-------|-------------|----------|
| `'cpu'` | 10,000ms | CPU-bound tasks (math, crypto, parsing) |
| `'io'` | 2,000ms | I/O-bound tasks (database, file system, network) |
| `'mixed'` | 5,000ms | General purpose workloads |

```javascript
tasklets.configure({ workload: 'cpu' }); // keep workers alive longer
tasklets.configure({ workload: 'io' });  // recycle workers faster
```

---

### `adaptive`
- **Type:** `boolean`
- **Default:** `false`

Enables adaptive auto-scaling. When active, the pool monitors system load and adjusts the number of workers dynamically, scaling up under heavy load and scaling down when idle.

```javascript
tasklets.configure({ adaptive: true });
```

---

### `timeout`
- **Type:** `number` (milliseconds)
- **Default:** `0` (disabled)

Global task timeout. If a task takes longer than this, it is automatically rejected with a `"Task timed out"` error and the stuck worker is terminated.

```javascript
tasklets.configure({ timeout: 5000 }); // reject tasks after 5 seconds
```

```javascript
try {
    await tasklets.run(() => { while(true) {} }); // infinite loop
} catch (err) {
    console.error(err.message); // "Task timed out after 5000ms"
}
```

---

### `maxMemory`
- **Type:** `number` (percentage, 0-100)
- **Default:** `0` (disabled)

Maximum system memory usage percentage. When the system memory exceeds this threshold, new workers will not be spawned. Existing workers continue to operate normally.

```javascript
tasklets.configure({ maxMemory: 80 }); // block new workers above 80% memory
```

The check uses `os.totalmem()` and `os.freemem()`, making it portable across machines with different memory sizes.

> **Note on Safety:** Even if set to `0`, Tasklets has internal safety thresholds. If free system memory drops below **15%**, it slows down new worker spawning. If it drops below **5%**, it limits the pool to **1 worker** maximum to prevent Out Of Memory (OOM) crashes. Setting `maxMemory` allows you to define a stricter limit.

---

### `logging`
- **Type:** `'debug' | 'info' | 'warn' | 'error' | 'none'`
- **Default:** `'error'`

Controls the verbosity of internal logging. Messages below the configured level are suppressed.

| Level | Shows |
|-------|-------|
| `'debug'` | Everything (worker spawn/terminate, task dispatch) |
| `'info'` | Info, warnings, and errors |
| `'warn'` | Warnings and errors (timeouts, memory limits) |
| `'error'` | Errors only (worker crashes, exit codes) |
| `'none'` | Silent mode |

```javascript
tasklets.configure({ logging: 'debug' });
// [tasklets:debug] Spawning worker 1/8
// [tasklets:debug] Terminating idle worker (idle for 5023ms)
// [tasklets:warn] Task 3 timed out after 5001ms (limit: 5000ms)
```

---

## Using MODULE: Prefix

Functions passed to `run()` are serialized via `.toString()` and executed inside a worker thread using `new Function()`. This means they **cannot** use `require()` or access the module system.

For tasks that need external packages (e.g., database drivers), create a CJS module and reference it with the `MODULE:` prefix:

```javascript
// insert-worker.cjs
const { Client } = require('pg');

module.exports = async function(items) {
    const client = new Client({ host: 'localhost', database: 'mydb' });
    await client.connect();
    for (const item of items) {
        await client.query('INSERT INTO users (name) VALUES ($1)', [item.name]);
    }
    await client.end();
    return items.length;
};
```

```javascript
// main.js
const path = require('path');
const workerPath = `MODULE:${path.resolve('./insert-worker.cjs')}`;

const count = await tasklets.run(workerPath, items);
console.log(`Inserted ${count} items`);
```

### Why MODULE: ?

| Approach | `require()` | Closures | Best For |
|----------|------------|----------|----------|
| Direct function | ❌ | ❌ | CPU-bound (math, parsing) |
| `MODULE:` prefix | ✅ | ❌ | I/O-bound (database, network) |

---

## Argument Validation

Tasklets validates arguments before sending them to workers. The following types are **not serializable** and will throw an error:

- **Functions** — cannot be cloned via `postMessage`
- **Symbols** — not supported by the Structured Clone Algorithm

```javascript
// ❌ This will throw an error
await tasklets.run(myTask, () => 'callback');
// Error: "Argument at index 0 is a function..."

// ✅ Pass plain data instead
await tasklets.run(myTask, { key: 'value' }, [1, 2, 3]);
```
