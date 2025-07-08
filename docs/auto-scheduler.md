# Intelligent Auto-Scheduler

The Tasklets intelligent auto-scheduler is a sophisticated system that automatically optimizes `MicroJob` and `NativeThreadPool` behavior based on runtime metrics and workload patterns. It provides intelligent recommendations for worker scaling, timeout adjustments, priority management, batching strategies, and load balancing.

## Overview

The auto-scheduler continuously monitors system performance and workload characteristics to make intelligent decisions about resource allocation and optimization strategies. It analyzes patterns in job execution, system utilization, and throughput to automatically adjust configuration parameters for optimal performance.

## Key Features

### 1. Workload Pattern Detection
- **CPU-Intensive**: Detects CPU-bound workloads and recommends appropriate worker scaling
- **I/O-Intensive**: Identifies I/O-bound workloads and suggests higher worker counts
- **Memory-Intensive**: Recognizes memory-bound workloads and recommends conservative scaling
- **Burst Workloads**: Detects sudden spikes in workload and adjusts accordingly
- **Steady Workloads**: Maintains stable configuration for consistent workloads
- **Mixed Workloads**: Handles complex workloads with varying characteristics

### 2. Job Complexity Estimation
- **Trivial**: < 1ms execution time
- **Simple**: 1-10ms execution time
- **Moderate**: 10-100ms execution time
- **Complex**: 100ms-1s execution time
- **Heavy**: > 1s execution time

### 3. Automatic Optimizations
- **Worker Thread Scaling**: Automatically adjusts worker thread count based on utilization
- **Timeout Management**: Recommends optimal timeout values based on job complexity
- **Priority Adjustment**: Suggests priority levels based on workload patterns
- **Batching Strategies**: Recommends batch sizes for optimal throughput
- **Load Balancing**: Suggests worker assignment optimizations

### 4. Performance Monitoring
- **Real-time Metrics**: Collects comprehensive performance data
- **Trend Analysis**: Analyzes performance trends over time
- **Confidence Scoring**: Provides confidence levels for recommendations
- **Historical Data**: Maintains metrics history for pattern analysis

## API Reference

### Core Methods

#### `enableAutoScheduling()`
Enables the intelligent auto-scheduler system.

```javascript
tasklets.enableAutoScheduling();
```

#### `disableAutoScheduling()`
Disables the auto-scheduler system.

```javascript
tasklets.disableAutoScheduling();
```

#### `isAutoSchedulingEnabled()`
Returns whether auto-scheduling is currently enabled.

```javascript
const enabled = tasklets.isAutoSchedulingEnabled();
```

#### `getAutoSchedulingRecommendations()`
Returns current auto-scheduling recommendations.

```javascript
const recommendations = tasklets.getAutoSchedulingRecommendations();
```

**Returns:**
```javascript
{
  // Worker scaling recommendations
  recommended_worker_count: 8,
  should_scale_up: true,
  should_scale_down: false,
  worker_scaling_confidence: 0.85,

  // Timeout recommendations
  recommended_timeout_ms: 15000,
  should_adjust_timeout: true,
  timeout_confidence: 0.72,

  // Priority recommendations
  recommended_priority: 5,
  should_adjust_priority: true,
  priority_confidence: 0.68,

  // Batching recommendations
  recommended_batch_size: 25,
  should_batch: true,
  batching_confidence: 0.75,

  // Load balancing recommendations
  should_rebalance: false,
  load_balance_confidence: 0.45
}
```

#### `applyAutoSchedulingRecommendations()`
Applies the current auto-scheduling recommendations.

```javascript
tasklets.applyAutoSchedulingRecommendations();
```

#### `getAutoSchedulingMetricsHistory()`
Returns historical performance metrics.

```javascript
const metricsHistory = tasklets.getAutoSchedulingMetricsHistory();
```

**Returns:**
```javascript
[
  {
    // Queue metrics
    queue_length: 15,
    active_jobs: 8,
    completed_jobs: 150,
    failed_jobs: 2,

    // Timing metrics
    avg_queue_wait_time_ms: 25.5,
    avg_execution_time_ms: 45.2,
    avg_total_time_ms: 70.7,

    // Throughput metrics
    jobs_per_second: 12.5,
    throughput_trend: 1.2,

    // Worker metrics
    worker_utilization: 85.5,
    worker_idle_time: 14.5,
    worker_count: 8,

    // Load metrics
    cpu_usage: 78.3,
    memory_usage: 45.2,
    load_balance_score: 92.1,

    // Pattern detection
    detected_pattern: 0, // CPU_INTENSIVE
    avg_complexity: 2,   // MODERATE
    timestamp: 1640995200000
  }
]
```

#### `getAutoSchedulingSettings()`
Returns comprehensive auto-scheduler settings and state.

```javascript
const settings = tasklets.getAutoSchedulingSettings();
```

## Adjustment Strategies

### Conservative Strategy
- Small, gradual changes
- High confidence thresholds
- Minimal risk of performance regression
- Suitable for production environments

### Moderate Strategy (Default)
- Balanced changes
- Medium confidence thresholds
- Good balance of performance and stability
- Suitable for most use cases

### Aggressive Strategy
- Larger, faster changes
- Lower confidence thresholds
- Maximum performance optimization
- Suitable for development/testing

## Performance Metrics

### Queue Metrics
- **Queue Length**: Number of jobs waiting to be processed
- **Active Jobs**: Number of jobs currently executing
- **Completed Jobs**: Total number of successfully completed jobs
- **Failed Jobs**: Total number of failed jobs

### Timing Metrics
- **Average Queue Wait Time**: Average time jobs spend waiting in queue
- **Average Execution Time**: Average time jobs take to execute
- **Average Total Time**: Average total time from enqueue to completion

### Throughput Metrics
- **Jobs Per Second**: Current throughput rate
- **Throughput Trend**: Rate of change in throughput

### Worker Metrics
- **Worker Utilization**: Percentage of worker threads actively processing
- **Worker Idle Time**: Percentage of time workers are idle
- **Worker Count**: Current number of worker threads

### Load Metrics
- **CPU Usage**: Current CPU utilization percentage
- **Memory Usage**: Current memory utilization percentage
- **Load Balance Score**: How well work is distributed across workers (0-100)

## Workload Pattern Analysis

### CPU-Intensive Pattern
**Characteristics:**
- High CPU utilization (>80%)
- Low memory usage (<50%)
- Long execution times
- Low I/O activity

**Recommendations:**
- Scale up worker threads moderately
- Increase timeouts for complex jobs
- Use moderate priority levels
- Avoid excessive batching

### I/O-Intensive Pattern
**Characteristics:**
- Low CPU utilization (<50%)
- Short execution times
- High I/O wait times
- Many concurrent operations

**Recommendations:**
- Scale up worker threads aggressively
- Use shorter timeouts
- Higher priority for I/O jobs
- Larger batch sizes

### Memory-Intensive Pattern
**Characteristics:**
- High memory usage (>70%)
- Moderate CPU usage
- Large memory allocations
- Potential memory pressure

**Recommendations:**
- Conservative worker scaling
- Longer timeouts for memory operations
- Lower priority to prevent memory pressure
- Smaller batch sizes

### Burst Pattern
**Characteristics:**
- Sudden increase in workload
- High throughput variation
- Temporary resource pressure
- Unpredictable patterns

**Recommendations:**
- Rapid worker scaling
- Adaptive timeouts
- Dynamic priority adjustment
- Flexible batching strategies

## Best Practices

### 1. Enable Auto-Scheduling Early
```javascript
// Enable auto-scheduling at application startup
tasklets.enableAutoScheduling();
```

### 2. Monitor Recommendations
```javascript
// Periodically check recommendations
setInterval(() => {
  const recommendations = tasklets.getAutoSchedulingRecommendations();
  if (recommendations.worker_scaling_confidence > 0.8) {
    tasklets.applyAutoSchedulingRecommendations();
  }
}, 30000); // Check every 30 seconds
```

### 3. Analyze Performance Trends
```javascript
// Analyze metrics history for patterns
const metricsHistory = tasklets.getAutoSchedulingMetricsHistory();
const recentMetrics = metricsHistory.slice(-10);

const avgUtilization = recentMetrics.reduce((sum, m) => 
  sum + m.worker_utilization, 0) / recentMetrics.length;

console.log(`Average worker utilization: ${avgUtilization.toFixed(1)}%`);
```

### 4. Customize for Specific Workloads
```javascript
// For CPU-intensive workloads
if (workloadType === 'cpu-intensive') {
  // Auto-scheduler will automatically detect and optimize
  tasklets.enableAutoScheduling();
}

// For I/O-intensive workloads
if (workloadType === 'io-intensive') {
  // Auto-scheduler will recommend higher worker counts
  tasklets.enableAutoScheduling();
}
```

### 5. Handle Recommendations Carefully
```javascript
// Apply recommendations with confidence thresholds
const recommendations = tasklets.getAutoSchedulingRecommendations();

if (recommendations.worker_scaling_confidence > 0.7) {
  if (recommendations.should_scale_up) {
    console.log(`Scaling up to ${recommendations.recommended_worker_count} workers`);
  } else if (recommendations.should_scale_down) {
    console.log(`Scaling down to ${recommendations.recommended_worker_count} workers`);
  }
  tasklets.applyAutoSchedulingRecommendations();
}
```

## Troubleshooting

### Common Issues

#### 1. High Worker Utilization
**Symptoms:**
- Worker utilization consistently >90%
- Long queue wait times
- Low throughput

**Solutions:**
- Check if auto-scheduling is enabled
- Verify worker scaling recommendations
- Monitor for CPU-intensive patterns

#### 2. Low Worker Utilization
**Symptoms:**
- Worker utilization <30%
- Excessive idle time
- Unnecessary resource usage

**Solutions:**
- Check for I/O-intensive patterns
- Verify timeout recommendations
- Monitor for burst workload patterns

#### 3. Memory Pressure
**Symptoms:**
- High memory usage
- Frequent garbage collection
- Out of memory errors

**Solutions:**
- Check for memory-intensive patterns
- Verify batching recommendations
- Monitor memory usage trends

#### 4. Inconsistent Performance
**Symptoms:**
- Variable throughput
- Unpredictable response times
- Frequent pattern changes

**Solutions:**
- Check for mixed workload patterns
- Monitor pattern detection accuracy
- Verify confidence scores

### Debugging

#### Enable Debug Logging
```javascript
tasklets.setLogLevel('debug');
```

#### Monitor Metrics in Real-time
```javascript
setInterval(() => {
  const metrics = tasklets.getAutoSchedulingMetricsHistory();
  const latest = metrics[metrics.length - 1];
  
  console.log('Current metrics:', {
    pattern: latest.detected_pattern,
    complexity: latest.avg_complexity,
    utilization: latest.worker_utilization,
    throughput: latest.jobs_per_second
  });
}, 5000);
```

#### Check Recommendation Confidence
```javascript
const recommendations = tasklets.getAutoSchedulingRecommendations();
console.log('Confidence scores:', {
  worker_scaling: recommendations.worker_scaling_confidence,
  timeout: recommendations.timeout_confidence,
  priority: recommendations.priority_confidence,
  batching: recommendations.batching_confidence
});
```

## Integration with Existing Systems

### Adaptive Configuration Integration
The auto-scheduler works seamlessly with the existing adaptive configuration system:

```javascript
// Enable both systems for comprehensive optimization
tasklets.enableAdaptiveMode();
tasklets.enableAutoScheduling();
```

### Memory Management Integration
Auto-scheduler recommendations consider memory constraints:

```javascript
// Memory-aware recommendations
const recommendations = tasklets.getAutoSchedulingRecommendations();
const memoryUsage = tasklets.getMemoryUsage();

if (memoryUsage > 80 && recommendations.should_scale_up) {
  console.log('Memory pressure detected, scaling conservatively');
}
```

### Performance Monitoring Integration
Combine auto-scheduler with performance monitoring:

```javascript
// Comprehensive performance analysis
const autoSchedulerSettings = tasklets.getAutoSchedulingSettings();
const adaptiveSettings = tasklets.getAdaptiveSettings();
const stats = tasklets.getStats();

const performanceReport = {
  autoScheduler: autoSchedulerSettings,
  adaptiveConfig: adaptiveSettings,
  systemStats: stats
};
```

## Conclusion

The intelligent auto-scheduler provides a sophisticated, automated approach to optimizing Tasklets performance. By continuously monitoring workload patterns and system metrics, it makes intelligent decisions about resource allocation and configuration adjustments, ensuring optimal performance across diverse workload types.

The system is designed to be transparent, configurable, and safe, providing confidence scores for all recommendations and allowing fine-grained control over when and how optimizations are applied. 