# tasklets

Zero-dependency Node.js Worker Threads library. CommonJS. Source lives in `lib/` (no build step — `.js` files are hand-written, TypeScript types only cover the public API).

## Commands

```sh
npm test              # jest --forceExit (node env, 10s timeout, verbose)
npm run test:typescript  # ts-node tests/js/test-typescript.ts
npm run test:all      # both of the above
npm run example       # runs docs/examples/basics/01-hello-parallel.js
node benches/<file>   # benchmarks (uses `benchmark` package, run directly; sync-io-comparison creates a temp file cleaned up on exit)
node docs/examples/*  # all examples are runnable standalone
```

No lint, no format, no typecheck configured.

## Architecture

- **Singleton proxy pattern**: `require('@wendelmax/tasklets')` exports the `Tasklets` class. Static methods (`Tasklets.run()`, etc.) operate on a hidden default instance. `new Tasklets(config)` creates an independent pool.
- **Fast Path**: task dispatches immediately when a worker is idle; only queues when all workers busy.
- **O(1) idle worker lookup**: idle workers tracked in a Set — no linear scan.
- **WeakMap worker resolution**: message handler resolves worker objects by thread reference.
- **Ring-buffer queue**: tasks dequeued via offset increment, not `Array.shift()`.
- **Function string cache**: `WeakMap` avoids repeated `toString()` for reused function objects.
- **Secret auth**: every instance generates a random 32-byte hex token. Workers validate every message against it. Not configurable.
- **`MODULE:` prefix**: pass a string `'MODULE:/path/to/module'` to `require()` inside a worker. An `allowedModules` config option can restrict which paths are permitted.
- **Memory safety** (built-in, even with `maxMemory: 0`): free RAM < 5% → cap pool to 1 worker; < 15% → cap to 70% of configured max.
- **No ESM**: CommonJS only (`require` / `module.exports`).

## Testing

- `afterEach` must call `tasklets.shutdown()` wrapped in try/catch to prevent test interference.
- `jest --forceExit` is required because worker threads may not terminate cleanly.
- Tests import via `require('../../lib/index')`.

## CI & Release

- **CI** (`.github/workflows/ci.yml`): 3 OS × Node 22/24/26, `npm ci` → `npm test` → run hello-parallel example as smoke test. No build step.
- **Release** (`.github/workflows/release.yml`): manual `workflow_dispatch` or GitHub Release publication → `npm publish --access public`. Requires `secrets.NPM_TOKEN`.

## Key constraints

- Node `>=22.0.0` (v3.x baseline)
- No runtime dependencies (dev-only: jest, ts-node, typescript, benchmark)
- Worker tasks are stringified functions deserialized via `new Function()` — must be self-contained (closures do not cross the thread boundary)
- BigInt and Symbol return values are explicitly rejected (throws before serialization)
