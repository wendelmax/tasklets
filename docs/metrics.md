# Metrics & Health Monitoring

Tasklets v2.2 provides built-in instrumentation to monitor your application's parallel processing performance in real-time.

## Performance Metrics

The `getStats()` method returns a comprehensive snapshot of the system state.

```javascript
const stats = tasklets.getStats();

console.log(stats);
/*
{
  activeTasks: 2,          // Hardware tasks currently running
  activeWorkers: 2,        // Workers busy with tasks
  totalWorkers: 4,         // Total workers in the pool (idle + busy)
  queuedTasks: 0,          // Tasks waiting for a free worker
  throughput: 15,          // Tasks processed per second (rolling)
  avgTaskTime: 42.5,       // Average execution time in ms (last 100 tasks)
  totalTasks: 1500,        // Total tasks ever received
  processedTasks: 1498,    // Total tasks successfully completed
  config: { ... }          // Current configuration snapshot
}
*/
```

### Metrics Manager
The internal `MetricsManager` uses a rolling window (default: 100 tasks) to calculate the average execution time, providing a more accurate "current" performance view than a lifetime average.

## Health Monitoring

The `getHealth()` method provides a simplified view focused on system stability.

```javascript
const health = tasklets.getHealth();

console.log(health);
/*
{
  status: 'healthy',       // 'healthy' | 'pressured'
  workers: 4,              // Total active workers
  memoryUsagePercent: 45.2 // Current system RAM usage
}
*/
```

## Use Cases
- **Dynamic Load Balancing:** Use throughput and queue size to adjust your application's input rate.
- **Alerting:** Monitor `avgTaskTime` to detect performance regressions in your task functions.
- **Auto-Scaling:** Integrate `getStats()` with external cluster managers.

## Related Examples
- [Metrics Monitoring Example](examples/advanced/03-metrics-monitoring.js)
