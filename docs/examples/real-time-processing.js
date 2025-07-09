/**
 * @file real-time-processing.js
 * @description This example simulates a real-time data processing system using Tasklets.
 * It consists of three main components:
 * 1. A `DataStreamSimulator` that generates a continuous stream of data events.
 * 2. A `LiveDataProcessor` that processes the incoming data in parallel, using a queue to manage
 *  backpressure and a limited number of concurrent tasks. Each data processing task is executed
 *  in a separate tasklet using `tasklets.run()`.
 * 3. A `RealTimeAnalytics` class that monitors the performance of the data processor and generates
 *  alerts based on predefined thresholds.
 * This example is a good demonstration of how to build a responsive, high-throughput, real-time
 * processing system.
 */
const tasklets = require('../../lib/tasklets');
const EventEmitter = require('events');

console.log('Tasklets - Real-time Data Processing Example\n');

class LiveDataProcessor extends EventEmitter {
  constructor(maxConcurrent = 10) {
  super();
  this.maxConcurrent = maxConcurrent;
  this.activeTasks = 0;
  this.queue = [];
  this.stats = {
  processed: 0,
  errors: 0,
  dropped: 0,
  startTime: Date.now(),
  totalProcessingTime: 0
  };
  this.isRunning = false;
  this.processingHistory = [];
  }

  async processData(data) {
  if (this.activeTasks >= this.maxConcurrent) {
  if (this.queue.length > 100) { // Drop data if queue is too long
  this.stats.dropped++;
  this.emit('dropped', {data, reason: 'queue_full'});
  return null;
  }

  return new Promise((resolve) => {
  this.queue.push({data, resolve});
  });
  }

  return this.executeTask(data);
  }

  async executeTask(data) {
  this.activeTasks++;
  const startTime = Date.now();

  try {
  const result = await tasklets.run(() => {
  // Simulate different types of data processing
  const processingTime = Math.random() * 200 + 50; // 50-250ms
  const start = Date.now();

  while (Date.now() - start < processingTime) {
  // Simulate CPU-intensive work
  Math.sqrt(Math.random() * 100000);
  }

  const processed = {
  id: data.id,
  type: data.type,
  value: data.value,
  processedValue: data.type === 'sensor' ? data.value * 1.5 : data.value * 0.8,
  timestamp: Date.now(),
  processingTime: Date.now() - start,
  processedBy: 'tasklet'
  };

  return processed;
  });

  const totalTime = Date.now() - startTime;
  this.stats.processed++;
  this.stats.totalProcessingTime += totalTime;

  // Keep processing history for analysis
  this.processingHistory.push({
  timestamp: Date.now(),
  processingTime: totalTime,
  dataType: data.type
  });

  // Keep only last 1000 entries
  if (this.processingHistory.length > 1000) {
  this.processingHistory.shift();
  }

  this.emit('processed', result);
  return result;

  } catch (error) {
  this.stats.errors++;
  this.emit('error', error);
  throw error;

  } finally {
  this.activeTasks--;
  this.processQueue();
  }
  }

  processQueue() {
  if (this.queue.length > 0 && this.activeTasks < this.maxConcurrent) {
  const {data, resolve} = this.queue.shift();
  resolve(this.executeTask(data));
  }
  }

  getStats() {
  const elapsed = (Date.now() - this.stats.startTime) / 1000;
  return {
  ...this.stats,
  throughput: this.stats.processed / elapsed,
  avgProcessingTime: this.stats.totalProcessingTime / this.stats.processed || 0,
  activeTasks: this.activeTasks,
  queueSize: this.queue.length,
  uptime: elapsed
  };
  }

  getPerformanceMetrics() {
  if (this.processingHistory.length === 0) return {};

  const times = this.processingHistory.map(h => h.processingTime);
  const sortedTimes = times.sort((a, b) => a - b);

  const typeStats = this.processingHistory.reduce((acc, h) => {
  if (!acc[h.dataType]) {
  acc[h.dataType] = {count: 0, totalTime: 0};
  }
  acc[h.dataType].count++;
  acc[h.dataType].totalTime += h.processingTime;
  return acc;
  }, {});

  Object.keys(typeStats).forEach(type => {
  typeStats[type].avgTime = typeStats[type].totalTime / typeStats[type].count;
  });

  return {
  min: Math.min(...times),
  max: Math.max(...times),
  avg: times.reduce((sum, t) => sum + t, 0) / times.length,
  median: sortedTimes[Math.floor(sortedTimes.length / 2)],
  p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
  p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
  typeStats
  };
  }
}

// Data stream simulator
class DataStreamSimulator extends EventEmitter {
  constructor(rate = 10) {
  super();
  this.rate = rate; // events per second
  this.isRunning = false;
  this.dataId = 0;
  this.interval = null;
  }

  start() {
  if (this.isRunning) return;

  this.isRunning = true;
  this.interval = setInterval(() => {
  this.generateData();
  }, 1000 / this.rate);

  console.log(`Data stream started at ${this.rate} events/second`);
  }

  stop() {
  if (!this.isRunning) return;

  this.isRunning = false;
  if (this.interval) {
  clearInterval(this.interval);
  this.interval = null;
  }

  console.log('Data stream stopped');
  }

  generateData() {
  const types = ['sensor', 'user_action', 'system_metric', 'transaction'];
  const type = types[Math.floor(Math.random() * types.length)];

  const data = {
  id: ++this.dataId,
  type,
  value: Math.random() * 1000,
  timestamp: Date.now(),
  source: `source_${Math.floor(Math.random() * 5) + 1}`
  };

  this.emit('data', data);
  }

  setRate(newRate) {
  this.rate = newRate;
  if (this.isRunning) {
  this.stop();
  this.start();
  }
  }
}

// Real-time analytics processor
class RealTimeAnalytics {
  constructor() {
  this.windowSize = 60; // seconds
  this.windows = new Map();
  this.alertThresholds = {
  high_throughput: 50,
  high_latency: 500,
  error_rate: 0.1
  };
  }

  async processMetrics(processor) {
  const stats = processor.getStats();
  const performance = processor.getPerformanceMetrics();

  return tasklets.run(() => {
  const analysis = {
  timestamp: Date.now(),
  throughput: stats.throughput,
  errorRate: stats.errors / (stats.processed + stats.errors) || 0,
  avgLatency: performance.avg || 0,
  p95Latency: performance.p95 || 0,
  queueSize: stats.queueSize,
  activeTasks: stats.activeTasks,
  alerts: []
  };

  // Check for alerts
  if (analysis.throughput > this.alertThresholds.high_throughput) {
  analysis.alerts.push({
  type: 'HIGH_THROUGHPUT',
  message: `Throughput ${analysis.throughput.toFixed(1)} exceeds threshold`,
  severity: 'info'
  });
  }

  if (analysis.p95Latency > this.alertThresholds.high_latency) {
  analysis.alerts.push({
  type: 'HIGH_LATENCY',
  message: `P95 latency ${analysis.p95Latency.toFixed(1)}ms exceeds threshold`,
  severity: 'warning'
  });
  }

  if (analysis.errorRate > this.alertThresholds.error_rate) {
  analysis.alerts.push({
  type: 'HIGH_ERROR_RATE',
  message: `Error rate ${(analysis.errorRate * 100).toFixed(1)}% exceeds threshold`,
  severity: 'error'
  });
  }

  return analysis;
  });
  }
}

async function simulateLiveDataProcessing() {
  console.log('Starting live data processing simulation...\n');

  const processor = new LiveDataProcessor(8);
  const simulator = new DataStreamSimulator(15); // 15 events/second
  const analytics = new RealTimeAnalytics();

  // Set up event handlers
  processor.on('processed', (result) => {
  if (result.id % 100 === 0) { // Log every 100th processed item
  console.log(`Processed item ${result.id}: ${result.type} -> ${result.processedValue.toFixed(2)}`);
  }
  });

  processor.on('error', (error) => {
  console.error(`Processing error: ${error.message}`);
  });

  processor.on('dropped', (info) => {
  console.warn(`Dropped data ${info.data.id}: ${info.reason}`);
  });

  // Handle incoming data
  simulator.on('data', async (data) => {
  try {
  await processor.processData(data);
  } catch (error) {
  console.error(`Failed to process data ${data.id}:`, error.message);
  }
  });

  // Start data stream
  simulator.start();

  // Periodic statistics reporting
  const statsInterval = setInterval(async () => {
  const stats = processor.getStats();
  const performance = processor.getPerformanceMetrics();

  console.log('\n--- Processing Statistics ---');
  console.log(`Throughput: ${stats.throughput.toFixed(1)} items/sec`);
  console.log(`Processed: ${stats.processed}, Errors: ${stats.errors}, Dropped: ${stats.dropped}`);
  console.log(`Queue size: ${stats.queueSize}, Active tasks: ${stats.activeTasks}`);

  if (performance.avg) {
  console.log(`Latency - Avg: ${performance.avg.toFixed(1)}ms, P95: ${performance.p95.toFixed(1)}ms, P99: ${performance.p99.toFixed(1)}ms`);
  }

  // Run analytics
  try {
  const analysis = await analytics.processMetrics(processor);

  if (analysis.alerts.length > 0) {
  console.log('\n--- Alerts ---');
  analysis.alerts.forEach(alert => {
  console.log(`[${alert.severity.toUpperCase()}] ${alert.message}`);
  });
  }
  } catch (error) {
  console.error('Analytics error:', error.message);
  }

  console.log('----------------------------\n');
  }, 3000);

  // Simulate changing load
  setTimeout(() => {
  console.log('Increasing data rate to 25 events/second...\n');
  simulator.setRate(25);
  }, 10000);

  setTimeout(() => {
  console.log('Increasing data rate to 40 events/second...\n');
  simulator.setRate(40);
  }, 20000);

  setTimeout(() => {
  console.log('Reducing data rate to 10 events/second...\n');
  simulator.setRate(10);
  }, 30000);

  // Stop after 40 seconds
  setTimeout(() => {
  console.log('Stopping simulation...\n');
  simulator.stop();
  clearInterval(statsInterval);

  // Final statistics
  setTimeout(() => {
  const finalStats = processor.getStats();
  const finalPerformance = processor.getPerformanceMetrics();

  console.log('=== Final Statistics ===');
  console.log(`Total processed: ${finalStats.processed}`);
  console.log(`Total errors: ${finalStats.errors}`);
  console.log(`Total dropped: ${finalStats.dropped}`);
  console.log(`Average throughput: ${finalStats.throughput.toFixed(1)} items/sec`);
  console.log(`Average processing time: ${finalStats.avgProcessingTime.toFixed(1)}ms`);
  console.log(`Uptime: ${finalStats.uptime.toFixed(1)} seconds`);

  if (finalPerformance.typeStats) {
  console.log('\nProcessing time by data type:');
  Object.entries(finalPerformance.typeStats).forEach(([type, stats]) => {
  console.log(`  ${type}: ${stats.count} items, avg ${stats.avgTime.toFixed(1)}ms`);
  });
  }

  console.log('\nReal-time processing example completed!');
  }, 1000);
  }, 40000);
}

// Batch processing with real-time monitoring
async function batchProcessingWithMonitoring() {
  console.log('\nBatch Processing with Real-time Monitoring:\n');

  const batchSize = 100;
  const totalItems = 1000;
  const processor = new LiveDataProcessor(6);

  // Generate batch data
  const batchData = Array.from({length: totalItems}, (_, i) => ({
  id: i + 1,
  type: ['sensor', 'user_action', 'system_metric'][Math.floor(Math.random() * 3)],
  value: Math.random() * 1000,
  timestamp: Date.now()
  }));

  console.log(`Processing ${totalItems} items in batches of ${batchSize}...`);

  let processed = 0;
  processor.on('processed', () => {
  processed++;
  if (processed % 50 === 0) {
  const progress = (processed / totalItems * 100).toFixed(1);
  console.log(`Progress: ${progress}% (${processed}/${totalItems})`);
  }
  });

  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < batchData.length; i += batchSize) {
  const batch = batchData.slice(i, i + batchSize);

  await Promise.all(
  batch.map(data => processor.processData(data))
  );

  console.log(`Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(batchData.length / batchSize)} completed`);
  }

  const endTime = Date.now();
  const finalStats = processor.getStats();

  console.log('\nBatch Processing Results:');
  console.log(`Total time: ${endTime - startTime}ms`);
  console.log(`Items processed: ${finalStats.processed}`);
  console.log(`Average processing time: ${finalStats.avgProcessingTime.toFixed(1)}ms`);
  console.log(`Throughput: ${(finalStats.processed / ((endTime - startTime) / 1000)).toFixed(1)} items/sec`);
}

// Run the examples
(async () => {
  try {
  await simulateLiveDataProcessing();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a bit
  await batchProcessingWithMonitoring();
  } catch (error) {
  console.error('Error:', error.message);
  }
})(); 