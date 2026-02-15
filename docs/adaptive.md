# Adaptive Scaling & Workload Optimization

Tasklets v2.2 introduces intelligent scaling mechanisms that automatically adjust the worker pool based on system load, queue size, and resource availability.

## Adaptive Mode

When enabled, Tasklets will proactively spawn new workers if it detects a building queue, even before the next task is scheduled. It also monitors system health to throttle spawning if memory is low.

```javascript
const tasklets = require('@wendelmax/tasklets');

tasklets.configure({
  adaptive: true,
  maxWorkers: 'auto'
});

// Or enable via method
tasklets.enableAdaptiveMode();
```

### Proactive Spawning
The `AdaptiveManager` monitors the internal task queue. If the queue length exceeds 3 tasks and there is room in the pool, a new worker is spawned immediately to handle the burst.

### System Health Protection
The manager checks system memory every 1000ms. If free memory falls below 5%, it throttles the pool to a maximum of 1 worker until resources are reclaimed, preventing OOM (Out Of Memory) crashes.

## Workload Optimization

You can tune the internal scheduler behavior based on the type of work your tasklets perform.

```javascript
// Optimization for CPU-intensive tasks
// Keeps workers alive longer (10s idle timeout) to avoid re-spawn overhead
tasklets.setWorkloadType('cpu');

// Optimization for I/O-intensive tasks
// Reclaims workers faster (2s idle timeout) to free up memory
tasklets.setWorkloadType('io');

// Default (Balanced)
// 5s idle timeout
tasklets.setWorkloadType('mixed');
```

## Related Examples
- [Adaptive Scaling Example](examples/advanced/02-adaptive-scaling.js)
