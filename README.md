# Tasklets — Lightweight Parallelism for Node.js

Zero-dependency Worker Threads library. Offload CPU-intensive and synchronous I/O tasks to worker threads with a simple promise-based API.

```
npm install @wendelmax/tasklets
```

Requires **Node >= 22**.

## Quick Start

```js
const Tasklets = require('@wendelmax/tasklets');

// Singleton — no configuration needed for most cases
const result = await Tasklets.run(() => {
  let sum = 0;
  for (let i = 0; i < 1e7; i++) sum += Math.sqrt(i);
  return sum;
});

console.log(result); // 2.108185e10
```

Or create an isolated pool:

```js
const pool = new Tasklets({ maxWorkers: 4, logging: 'warn' });
const result = await pool.run(myTask, arg1, arg2);
await pool.shutdown();
```

## Why v3.0?

Complete rewrite from v2.x focused on performance, maintainability, and Node 22+ features.

- **O(1) idle worker dispatch** — idle workers tracked in a Set, not an array scan
- **WeakMap worker lookup** — message handler resolves workers by reference, no linear search
- **Ring-buffer queue** — tasks are dequeued by incrementing an offset instead of `Array.shift()`
- **Function string cache** — repeated `run()` calls with the same function object skip `toString()`
- **Ring-buffer metrics** — rolling execution-time window uses a pre-allocated ring buffer

## Core API

### `run(task, ...args)`

Execute a function in a worker thread. The function must be self-contained — closures do not cross the thread boundary.

```js
await Tasklets.run((a, b) => a + b, 3, 4); // 7
```

Strings are also accepted (see [MODULE: prefix](#module-prefix)):

```js
await Tasklets.run('MODULE:./path/to/module.js', arg);
```

### `runAll(tasks)`

Dispatch multiple tasks in parallel:

```js
const [a, b] = await Tasklets.runAll([
  () => 1 + 1,
  () => 2 + 2,
]);
```

### `batch(tasks, options?)`

Run a set of named tasks with progress tracking:

```js
const results = await Tasklets.batch(
  data.map(item => ({
    name: `task-${item.id}`,
    task: (x) => process(x),
    args: [item],
  })),
  {
    onProgress: ({ completed, total, percentage }) =>
      console.log(`${percentage.toFixed(0)}% done`),
  }
);
// [{ name, result, success }, ...]
```

### `retry(task, options?)`

Automatically retry on failure:

```js
const result = await Tasklets.retry(unstableTask, {
  attempts: 5,
  delay: 200,
  backoff: 2,      // 200, 400, 800, 1600ms
});
```

### `configure(config)`

Update pool settings at runtime:

```js
Tasklets.configure({
  maxWorkers: 8,
  minWorkers: 2,
  timeout: 10000,          // kill tasks exceeding 10s
  workload: 'cpu',         // 'cpu' | 'io' | 'mixed'
  adaptive: true,          // auto-scale with system load
  maxMemory: 80,           // % – block spawning above this
  logging: 'warn',         // 'debug' | 'info' | 'warn' | 'error' | 'none'
  allowedModules: ['./workers'],
});
```

### `getStats()` / `getHealth()`

```js
console.log(Tasklets.getStats());
// { activeTasks, activeWorkers, totalWorkers, queuedTasks,
//   idleWorkers, throughput, avgTaskTime, totalTasks,
//   processedTasks, config }

console.log(Tasklets.getHealth());
// { status: 'healthy', workers: 3, memoryUsagePercent: 62.1 }
```

### `shutdown()`

Gracefully terminate all workers:

```js
await Tasklets.shutdown();
```

---

## Patterns & Best Practices

### 1. Self-contained tasks

The task function is **stringified** and `new Function()`-deserialized inside the worker. It does not capture its closure. Pass everything as arguments:

```js
// Good
await Tasklets.run((x, y) => x + y, a, b);

// Bad — `ctx` will be undefined inside the worker
await Tasklets.run(() => ctx.doWork());
```

### 2. Offload synchronous I/O

Use the `MODULE:` prefix to load Node.js built-ins inside a worker:

```js
// Slow — blocks the event loop
fs.readFileSync('/large/file');

// Fast — offloads blocking I/O to a worker
const content = await Tasklets.run('MODULE:fs', 'readFileSync', '/large/file');
```

Works with any module that exports a callable:

```js
// Write a helper
// helpers/read-csv.js
module.exports = (path) => require('fs').readFileSync(path, 'utf8').split('\n');

// Use it
const lines = await Tasklets.run('MODULE:./helpers/read-csv.js', '/data/file.csv');
```

### 3. Batch large workloads

`batch()` with progress tracking is ideal for map-style parallelism:

```js
const BATCH = items.map(item => ({
  name: `img-${item.id}`,
  task: (img) => sharp(img).resize(300, 300).toBuffer(),
  args: [item.data],
}));

const results = await Tasklets.batch(BATCH, {
  onProgress: (p) => console.log(`${p.completed}/${p.total}`),
});
```

### 4. Reuse function references for caching

Passing the **same function object** to `run()` repeatedly enables the internal string cache:

```js
const add = (a, b) => a + b;

// First call: toString() + cache
await Tasklets.run(add, 1, 2);
// Second call: cache hit, no toString()
await Tasklets.run(add, 3, 4);
// Third call: cache hit
await Tasklets.run(add, 5, 6);
```

### 5. Configure workload type

```js
Tasklets.setWorkloadType('cpu'); // longer idle timeout (10s) — keep workers warm
Tasklets.setWorkloadType('io');  // shorter idle timeout (2s) — reclaim quickly
Tasklets.setWorkloadType('mixed'); // default (5s)
```

### 6. Memory safety

Built-in protection even without explicit config:

| Free RAM | Behavior |
|----------|----------|
| < 5%     | Pool capped at **1 worker** |
| < 15%    | Pool capped at **70%** of configured max |
| >= 15%   | Normal operation |

Set `maxMemory` for an explicit ceiling:

```js
new Tasklets({ maxMemory: 80 }); // block spawning above 80% used
```

### 7. Error handling

Errors inside workers are propagated as rejected promises:

```js
try {
  await Tasklets.run(() => { throw new Error('boom'); });
} catch (err) {
  console.log(err.message); // 'boom'
}
```

`batch()` captures per-task errors instead of failing fast:

```js
const results = await Tasklets.batch([...]);
results.forEach(r => {
  if (!r.success) console.error(`Task ${r.name} failed:`, r.error);
});
```

### 8. Argument restrictions

Functions and Symbols cannot cross the thread boundary:

```js
await Tasklets.run(myTask, () => {});    // TypeError
await Tasklets.run(myTask, Symbol('a')); // TypeError
```

BigInt and Symbol return values are also rejected.

### 9. Singleton vs. instance

The module default export is the `Tasklets` class. Static methods operate on a hidden default instance:

```js
Tasklets.run(...);       // singleton — convenient
new Tasklets({...});     // isolated pool — when you need separate configs
```

Both share the same interface.

---

## Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxWorkers` | `number` \| `'auto'` | CPU count | Max worker threads |
| `minWorkers` | `number` | `1` | Workers kept alive when idle |
| `idleTimeout` | `number` | `5000` | ms before killing idle workers |
| `timeout` | `number` | `0` | Global task timeout (0 = no limit) |
| `logging` | `string` | `'error'` | `'debug'` \| `'info'` \| `'warn'` \| `'error'` \| `'none'` |
| `workload` | `string` | `'mixed'` | `'cpu'` \| `'io'` \| `'mixed'` |
| `adaptive` | `boolean` | `false` | Auto-scale based on system load |
| `maxMemory` | `number` | `0` | Max memory % before blocking spawns (0 = no limit) |
| `allowedModules` | `string[]` | `null` | Allowlist for `MODULE:` paths |

---

## Benchmarks

Run the benchmarks yourself:

```sh
node benches/overhead.js              # per-task overhead
node benches/crypto-hash.js           # CPU-bound throughput
node benches/optimization-benchmark.js # 1000-task batch
node benches/scaling-test.js          # pool scaling behaviour
node benches/sync-io-comparison.js    # file I/O offloading
```

For three-way comparisons (blocking vs raw workers vs Tasklets), see:
- [ErickWendel/parallelizing-nodejs-ops](https://github.com/ErickWendel/parallelizing-nodejs-ops) — blocking baseline
- [wendelmax/parallelizing-nodejs-ops](https://github.com/wendelmax/parallelizing-nodejs-ops) — Tasklets version

---

## Architecture

```
main thread                    worker thread
┌─────────────────┐           ┌──────────────────┐
│  Tasklets pool  │  postMessage(task, args)    │
│  ┌───────────┐  │ ──────────→  │  authenticate │
│  │ idleWorkers│  │           │  deserialize   │
│  │ (Set)      │  │           │  execute fn    │
│  │ workerMap  │  │ ←──────────  postMessage   │
│  │ (WeakMap)  │  │  { result/error, taskId }  │
│  │ fnCache    │  │           └──────────────────┘
│  │ queue      │  │
│  │ metrics    │  │
│  └───────────┘  │
└─────────────────┘
```

- **Fast Path**: idle worker available → dispatch immediately
- **Slow Path**: all workers busy → enqueue, dispatch when one frees
- **Secret auth**: every instance generates a 32-byte hex token; workers validate every message

---

## License

MIT — see [LICENSE](LICENSE).
