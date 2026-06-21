# Benchmarks

This page documents how to measure the performance of Tasklets and points to real-world benchmark comparisons.

---

## Included Benchmarks

The `benches/` directory contains ready-to-run benchmark scripts.

| Script | What It Measures |
|--------|-----------------|
| `benches/overhead.js` | Per-task overhead: native JS vs. `tasklets.run()` for a small Fibonacci computation |
| `benches/crypto-hash.js` | Throughput for a CPU-bound hashing workload: blocking main thread vs. offloading to a worker |
| `benches/optimization-benchmark.js` | End-to-end throughput when dispatching 1,000 tasks via `runAll()` |
| `benches/scaling-test.js` | Worker-pool scaling behaviour: burst spawning and idle-timeout scale-down |

### Running the benchmarks

```bash
# Install dev dependencies first (benchmark package is used by crypto-hash and overhead)
npm install

# Overhead: native execution vs. a single tasklets.run()
node benches/overhead.js

# Throughput for a CPU-bound hash workload
node benches/crypto-hash.js

# Pool scaling and throughput for 1,000 tasks
node benches/optimization-benchmark.js

# Worker-pool scaling behaviour (takes ~8 s)
node benches/scaling-test.js
```

---

## Real-World Comparison

For a side-by-side benchmark of a realistic Node.js application — comparing the **blocking (sync) approach**, **raw Worker Threads**, and **Tasklets** — see these two companion repositories maintained by the project author:

| Repository | Description |
|---|---|
| [ErickWendel/parallelizing-nodejs-ops](https://github.com/ErickWendel/parallelizing-nodejs-ops) | Reference implementation — blocking libuv operations |
| [wendelmax/parallelizing-nodejs-ops](https://github.com/wendelmax/parallelizing-nodejs-ops) | Optimized version using Tasklets |

Clone both repositories and follow their README instructions to run the benchmarks on your own hardware.

---

## Understanding the Numbers

### When Tasklets is faster

Tasklets shines when tasks are **CPU-bound** and take longer than the thread-dispatch overhead (~1–3 ms per task):

- Cryptographic hashing / encoding
- Image / video processing
- Large data-set transformations
- Parsing (JSON, CSV, XML) of large payloads

### When Tasklets adds overhead

For **very short** operations (< 1 ms of actual work), the cost of serializing arguments, spawning or waking a worker, and deserializing the result can exceed the savings. In those cases, run the operation directly on the main thread or batch many small operations into a single `run()` call.

### I/O-bound tasks

Tasklets can also help I/O-bound workloads by preventing slow synchronous I/O (`fs.readFileSync`, synchronous database drivers) from blocking the event loop. Use the `MODULE:` prefix to load the appropriate driver inside the worker. See the [Configuration Guide](configuration.md#using-module-prefix) for details.
