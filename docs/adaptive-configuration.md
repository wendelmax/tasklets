# Adaptive Configuration System

The Tasklets library now features an intelligent automated adaptive configuration system that automatically optimizes settings based on runtime performance metrics and system conditions. This system works similarly to the memory management system, providing automatic optimization without manual intervention.

## Overview

The adaptive configuration system continuously monitors system performance and automatically adjusts various parameters to maintain optimal performance:

- **Worker Thread Count**: Automatically scales based on CPU utilization and workload type
- **Memory Limits**: Adjusts based on memory pressure and usage patterns
- **Batch Sizes**: Optimizes for throughput and resource utilization
- **Cleanup Intervals**: Adjusts based on memory pressure and system load
- **Pool Sizes**: Scales object pools based on demand and memory availability

## Key Features

### 1. Automatic Performance Monitoring

The system continuously collects performance metrics:

```javascript
const tasklets = require('tasklets');

// Enable adaptive mode
tasklets.enableAdaptiveMode();

// The system automatically monitors:
// - CPU utilization
// - Memory usage
// - Worker thread utilization
// - Task throughput
// - Success rates
// - Execution times
```

### 2. Intelligent Configuration Adjustment

The system automatically adjusts settings based on performance analysis:

```javascript
// The system will automatically:
// - Increase worker threads when CPU is underutilized
// - Decrease worker threads when overloaded
// - Adjust memory limits based on pressure
// - Optimize batch sizes for throughput
// - Scale pool sizes based on demand
```

### 3. Workload-Specific Optimization

Different workload types trigger different optimization strategies:

```javascript
// CPU-intensive workloads
tasklets.setWorkloadType('cpu-intensive');
// System optimizes for maximum CPU utilization

// I/O-intensive workloads
tasklets.setWorkloadType('io-intensive');
// System increases worker threads for better I/O handling

// Memory-intensive workloads
tasklets.setWorkloadType('memory-intensive');
// System reduces batch sizes and memory limits

// Balanced workloads (default)
tasklets.setWorkloadType('balanced');
// System balances all resources
```

## API Reference

### Core Adaptive Methods

#### `enableAdaptiveMode()`
Enables the automated adaptive configuration system.

```javascript
tasklets.enableAdaptiveMode();
```

#### `disableAdaptiveMode()`
Disables the automated adaptive configuration system.

```javascript
tasklets.disableAdaptiveMode();
```

#### `isAdaptiveModeEnabled()`
Returns whether adaptive mode is currently enabled.

```javascript
const isEnabled = tasklets.isAdaptiveModeEnabled();
console.log('Adaptive mode:', isEnabled ? 'Enabled' : 'Disabled');
```

#### `setWorkloadType(workloadType)`
Sets the workload type for optimization strategies.

```javascript
// Valid workload types:
tasklets.setWorkloadType('cpu-intensive');
tasklets.setWorkloadType('io-intensive');
tasklets.setWorkloadType('memory-intensive');
tasklets.setWorkloadType('balanced');
```

#### `getWorkloadType()`
Returns the current workload type.

```javascript
const workloadType = tasklets.getWorkloadType();
console.log('Current workload type:', workloadType);
```

### Performance Monitoring

#### `getAdaptiveMetrics()`
Returns the history of performance metrics collected by the adaptive system.

```javascript
const metrics = tasklets.getAdaptiveMetrics();
console.log('Total metrics recorded:', metrics.length);

if (metrics.length > 0) {
    const latest = metrics[metrics.length - 1];
    console.log('CPU utilization:', latest.cpu_utilization + '%');
    console.log('Memory usage:', latest.memory_usage_percent + '%');
    console.log('Worker utilization:', latest.worker_utilization + '%');
    console.log('Throughput:', latest.throughput_tasks_per_sec + ' tasks/sec');
    console.log('Success rate:', (latest.success_rate * 100) + '%');
}
```

#### `getLastAdjustment()`
Returns information about the last configuration adjustment made by the adaptive system.

```javascript
const adjustment = tasklets.getLastAdjustment();
console.log('Reason:', adjustment.reason);
console.log('Changes made:', adjustment.changes_made);
console.log('Performance impact:', adjustment.performance_impact);
console.log('Timestamp:', new Date(adjustment.timestamp));
```

#### `forceAdaptiveAdjustment()`
Forces an immediate adaptive configuration adjustment.

```javascript
tasklets.forceAdaptiveAdjustment();
console.log('Forced adaptive adjustment completed');
```

### Configuration Access

#### `getAdaptiveSettings()`
Returns comprehensive adaptive configuration settings.

```javascript
const settings = tasklets.getAdaptiveSettings();
console.log('Worker threads:', settings.workerThreads);
console.log('Memory limit:', settings.memoryLimitPercent + '%');
console.log('Batch size:', settings.batchSize);
console.log('Poll interval:', settings.pollIntervalMs + 'ms');

// Native metrics
console.log('Native metrics:', settings.native.metrics);
console.log('Last adjustment:', settings.native.lastAdjustment);
console.log('Adaptive enabled:', settings.native.isEnabled);
```

## Adaptive Rules and Thresholds

The system uses configurable thresholds for making adjustment decisions:

### CPU Utilization Thresholds
- **High threshold**: 85% - Triggers worker thread reduction
- **Low threshold**: 30% - Triggers worker thread increase

### Memory Usage Thresholds
- **High threshold**: 80% - Triggers memory limit reduction
- **Low threshold**: 40% - Triggers memory limit increase

### Worker Utilization Thresholds
- **High threshold**: 90% - Triggers worker thread increase
- **Low threshold**: 50% - Triggers worker thread decrease

### Throughput Thresholds
- **Decline threshold**: 0.8 (20% decline) - Triggers optimization
- **Improvement threshold**: 1.2 (20% improvement) - Maintains current settings

### Success Rate Thresholds
- **Minimum**: 95% - Triggers optimization if below
- **Target**: 99% - Optimal success rate

## Adjustment Strategies

The system supports three adjustment strategies:

### Conservative
- Small, gradual changes
- Minimizes disruption
- Good for production systems

### Moderate (Default)
- Balanced changes
- Good balance of responsiveness and stability

### Aggressive
- Larger, faster changes
- Maximum responsiveness
- Good for development/testing

## Performance Monitoring

The adaptive system monitors these key metrics:

### System Metrics
- CPU utilization percentage
- Memory usage percentage
- System memory pressure

### Task Metrics
- Worker thread utilization
- Active tasklet count
- Queued tasklet count
- Task throughput (tasks/second)
- Average execution time
- Success rate

### Health Scoring
The system calculates an overall health score (0-100) based on:
- CPU overload (-20 points)
- Memory pressure (-20 points)
- Worker overload (-15 points)
- Throughput decline (-15 points)
- Low success rate (-20 points)
- Underutilization penalties (-5 to -10 points)

## Examples

### Basic Usage

```javascript
const tasklets = require('tasklets');

// Enable adaptive mode
tasklets.enableAdaptiveMode();

// Run tasks - system automatically optimizes
const results = await tasklets.runAll([
    () => heavyComputation(),
    () => dataProcessing(),
    () => fileOperations()
]);

// Check adaptive metrics
const metrics = tasklets.getAdaptiveMetrics();
console.log('Performance metrics:', metrics);
```

### Workload-Specific Processing

```javascript
// CPU-intensive processing
await tasklets.processCPUIntensive(data, processor);

// I/O-intensive processing
await tasklets.processIOIntensive(files, fileProcessor);

// Memory-intensive processing
await tasklets.processMemoryIntensive(largeData, memoryProcessor);

// Adaptive processing with memory awareness
await tasklets.processWithMemoryAwareness(items, processor);
```

### Monitoring and Analysis

```javascript
// Get comprehensive adaptive information
const settings = tasklets.getAdaptiveSettings();
const metrics = tasklets.getAdaptiveMetrics();
const lastAdjustment = tasklets.getLastAdjustment();

console.log('Current configuration:', settings);
console.log('Performance history:', metrics);
console.log('Last optimization:', lastAdjustment);
```

## Best Practices

### 1. Enable Early
Enable adaptive mode early in your application lifecycle:

```javascript
const tasklets = require('tasklets');
tasklets.enableAdaptiveMode();
```

### 2. Set Workload Type
Specify your workload type for better optimization:

```javascript
// For CPU-intensive applications
tasklets.setWorkloadType('cpu-intensive');

// For I/O-heavy applications
tasklets.setWorkloadType('io-intensive');
```

### 3. Monitor Performance
Regularly check adaptive metrics to understand system behavior:

```javascript
setInterval(() => {
    const metrics = tasklets.getAdaptiveMetrics();
    const lastAdjustment = tasklets.getLastAdjustment();
    
    console.log('System health:', metrics.length > 0 ? 
        metrics[metrics.length - 1].overall_health_score : 'N/A');
}, 30000);
```

### 4. Use Workload-Specific Methods
Use the provided workload-specific processing methods:

```javascript
// Instead of generic processing
const results = await tasklets.runAll(tasks);

// Use workload-specific methods
const results = await tasklets.processCPUIntensive(data, processor);
```

## Troubleshooting

### Adaptive Mode Not Working
1. Ensure adaptive mode is enabled: `tasklets.enableAdaptiveMode()`
2. Check if the system has enough metrics: `tasklets.getAdaptiveMetrics().length`
3. Verify system resources are available

### Performance Issues
1. Check current adaptive settings: `tasklets.getAdaptiveSettings()`
2. Review performance metrics: `tasklets.getAdaptiveMetrics()`
3. Force adjustment if needed: `tasklets.forceAdaptiveAdjustment()`

### Memory Pressure
1. Check memory usage in metrics
2. Consider using `processWithMemoryAwareness()`
3. Set workload type to 'memory-intensive'

## Integration with Existing Code

The adaptive system is designed to work seamlessly with existing Tasklets code:

```javascript
// Existing code continues to work
const taskletId = tasklets.spawn(() => heavyTask());
const result = tasklets.getResult(taskletId);

// Adaptive system works in background
tasklets.enableAdaptiveMode();

// System automatically optimizes for better performance
```

The adaptive configuration system provides intelligent, automated optimization that adapts to your specific workload and system conditions, similar to how the memory management system automatically handles memory cleanup and optimization. 