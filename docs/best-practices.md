# Best Practices This guide outlines recommended patterns and practices for using **Tasklets 1.0.0** modern API effectively in production applications. ## Table of Contents - [Modern API Guidelines](#modern-api-guidelines)
- [Task Design Patterns](#task-design-patterns)
- [Error Handling Best Practices](#error-handling-best-practices)
- [Performance Optimization](#performance-optimization)
- [Resource Management](#resource-management)
- [Production Deployment](#production-deployment)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Testing Strategies](#testing-strategies)
- [Security and Safety](#security-and-safety)
- [Common Patterns and Anti-patterns](#common-patterns-and-anti-patterns) --- ## Modern API Guidelines ### Configuration Best Practices **Configure Once at Startup** ```javascript
const tasklets = require('tasklets'); // Configure at application startup
tasklets.config({ workers: 'auto', // Auto-detect CPU cores timeout: 30000, // 30 second timeout logging: process.env.NODE_ENV === 'production' ? 'error' : 'info'
}); // Use throughout the application without reconfiguring
const result = await tasklets.run(() => heavyWork());
```  **Don't reconfigure repeatedly** ```javascript
// Bad - configuring in every function
async function processData() { tasklets.config({ workers: 4 }); // Unnecessary return await tasklets.run(() => work());
}
``` ### Modern Promise Patterns **Use async/await consistently** ```javascript
const tasklets = require('tasklets'); // Good: Clean Promise-based code
async function processItems(items) { const results = await tasklets.runAll( items.map(item => () => processItem(item)) ); return results;
} // Good: Error handling with try/catch
async function safeProcessing(data) { try { return await tasklets.run(() => processData(data)); } catch (error) { console.error('Processing failed:', error.message); throw error; }
}
```  **Don't mix callback patterns** ```javascript
// Bad: Mixing old patterns with new API
function badExample() { tasklets.run(() => work()).then(result => { // Old-style Promise chains }).catch(error => { // Mixed error handling });
}
``` --- ## Task Design Patterns ### Pure Function Tasks Design tasks as pure functions for predictability and testability: ```javascript
const tasklets = require('tasklets'); // Good: Pure function task
function calculateMetrics(data) { return { sum: data.reduce((a, b) => a + b, 0), average: data.reduce((a, b) => a + b, 0) / data.length, min: Math.min(...data), max: Math.max(...data), count: data.length };
} // Usage
const metrics = await tasklets.run(() => calculateMetrics(numbers)); //  Bad: Side effects in task
function badTask(data) { console.log('Processing...'); // Side effect fs.writeFileSync('temp.txt', data); // Side effect return processData(data);
}
``` ### Composable Task Architecture ```javascript
const tasklets = require('tasklets'); // Good: Composable pipeline
class DocumentProcessor { constructor() { this.stages = [ this.parseDocument, this.validateData, this.transformData, this.enrichData ]; } async process(document) { let result = document; for (const stage of this.stages) { result = await tasklets.run(() => stage(result)); } return result; } // Each stage is a pure function parseDocument(doc) { /* parsing logic */ } validateData(data) { /* validation logic */ } transformData(data) { /* transformation logic */ } enrichData(data) { /* enrichment logic */ }
} // Parallel composition
async function parallelPipeline(documents) { const processor = new DocumentProcessor(); return await tasklets.runAll( documents.map(doc => () => processor.process(doc)) );
}
``` ### Batch Processing Patterns ```javascript
const tasklets = require('tasklets'); // Good: Proper batch sizing
class BatchProcessor { constructor(options = {}) { this.batchSize = options.batchSize || 1000; this.maxConcurrency = options.maxConcurrency || 10; } async processLargeDataset(data) { const chunks = this.chunkArray(data, this.batchSize); // Process chunks in controlled batches const results = []; for (let i = 0; i < chunks.length; i += this.maxConcurrency) { const batch = chunks.slice(i, i + this.maxConcurrency); const batchResults = await tasklets.runAll( batch.map(chunk => () => this.processChunk(chunk)) ); results.push(...batchResults); // Optional: Progress reporting console.log(`Processed ${Math.min(i + this.maxConcurrency, chunks.length)}/${chunks.length} batches`); } return results.flat(); } chunkArray(array, size) { const chunks = []; for (let i = 0; i < array.length; i += size) { chunks.push(array.slice(i, i + size)); } return chunks; } processChunk(chunk) { return chunk.map(item => this.processItem(item)); } processItem(item) { // Individual item processing logic return { ...item, processed: true, timestamp: Date.now() }; }
}
``` --- ## Error Handling Best Practices ### Comprehensive Error Strategies ```javascript
const tasklets = require('tasklets'); // Good: Multi-level error handling
class ResilientProcessor { async processWithFallback(data) { try { // Primary processing return await tasklets.run(() => this.primaryProcess(data)); } catch (primaryError) { console.warn('Primary processing failed:', primaryError.message); try { // Fallback processing with retry return await tasklets.retry(() => this.fallbackProcess(data), { attempts: 3, delay: 1000, backoff: 2 }); } catch (fallbackError) { console.error('Both primary and fallback failed'); throw new Error(`Processing failed: ${fallbackError.message}`); } } } primaryProcess(data) { // Complex processing that might fail if (data.corrupted) { throw new Error('Data corruption detected'); } return this.complexTransformation(data); } fallbackProcess(data) { // Simpler, more reliable processing return this.simpleTransformation(data); }
} // Good: Batch error handling
async function processBatchWithErrors(items) { const tasks = items.map(item => ({ name: `process-${item.id}`, task: () => processItem(item) })); const results = await tasklets.batch(tasks, { onProgress: (progress) => { console.log(`Progress: ${progress.percentage}% (${progress.failed} failed)`); } }); // Separate successful and failed results const successful = results.filter(r => r.success); const failed = results.filter(r => !r.success); if (failed.length > 0) { console.warn(`${failed.length} items failed processing`); // Log failed items for debugging failed.forEach(failure => { console.error(`Failed ${failure.name}: ${failure.error}`); }); } return successful.map(r => r.result);
}
``` ### Retry Patterns ```javascript
const tasklets = require('tasklets'); // Good: Intelligent retry strategies
class RetryProcessor { async processWithCustomRetry(data) { return await tasklets.retry(async () => { const result = await this.unreliableOperation(data); // Custom validation if (!this.isValidResult(result)) { throw new Error('Invalid result from operation'); } return result; }, { attempts: 5, delay: 500, backoff: 1.5, // Custom retry condition shouldRetry: (error) => { // Only retry on specific errors return error.message.includes('timeout') || error.message.includes('network'); } }); } async batchProcessWithRetry(items) { const results = await Promise.allSettled( items.map(item => tasklets.retry(() => this.processItem(item), { attempts: 3, delay: 200, backoff: 2 })) ); return results.map((result, index) => ({ item: items[index], success: result.status === 'fulfilled', result: result.status === 'fulfilled' ? result.value : null, error: result.status === 'rejected' ? result.reason.message : null })); }
}
``` --- ## Performance Optimization ### Worker Configuration ```javascript
const tasklets = require('tasklets'); // Good: Environment-based configuration
function configureForEnvironment() { const isProduction = process.env.NODE_ENV === 'production'; const cpuCount = require('os').cpus().length; tasklets.config({ workers: isProduction ? cpuCount : Math.min(cpuCount, 4), timeout: isProduction ? 60000 : 30000, logging: isProduction ? 'error' : 'info' });
} // Good: Workload-specific optimization
function optimizeForWorkload(workloadType) { switch (workloadType) { case 'cpu-intensive': tasklets.config({ workers: require('os').cpus().length, timeout: 120000 }); break; case 'io-bound': tasklets.config({ workers: Math.min(require('os').cpus().length * 2, 16), timeout: 60000 }); break; case 'mixed': default: tasklets.config({ workers: 'auto', timeout: 30000 }); break; }
}
``` ### Memory Management ```javascript
const tasklets = require('tasklets'); // Good: Memory-conscious processing
class MemoryEfficientProcessor { constructor(options = {}) { this.maxMemoryUsage = options.maxMemoryUsage || 1024; // MB this.chunkSize = options.chunkSize || 1000; } async processLargeDataset(dataset) { const chunks = this.createChunks(dataset, this.chunkSize); const results = []; for (const chunk of chunks) { // Check memory before processing await this.checkMemoryUsage(); const chunkResult = await tasklets.run(() => this.processChunk(chunk)); results.push(chunkResult); // Optional: Force garbage collection if (global.gc && results.length % 10 === 0) { global.gc(); } } return results.flat(); } async checkMemoryUsage() { const health = tasklets.getHealth(); if (health.memory.used > this.maxMemoryUsage) { console.warn('High memory usage detected, pausing processing...'); await this.waitForMemoryToDecrease(); } } async waitForMemoryToDecrease() { return new Promise(resolve => { const check = () => { const health = tasklets.getHealth(); if (health.memory.used < this.maxMemoryUsage * 0.8) { resolve(); } else { setTimeout(check, 1000); } }; check(); }); }
}
``` ### Performance Monitoring ```javascript
const tasklets = require('tasklets'); // Good: Built-in performance monitoring
class PerformanceMonitor { constructor() { this.startTime = Date.now(); this.samples = []; } startMonitoring(intervalMs = 1000) { this.interval = setInterval(() => { this.recordSample(); }, intervalMs); } stopMonitoring() { if (this.interval) { clearInterval(this.interval); } } recordSample() { const stats = tasklets.getStats(); const health = tasklets.getHealth(); this.samples.push({ timestamp: Date.now(), throughput: stats.performance.throughput, memoryUsage: health.memory.used, workerUtilization: health.workers.utilization, completedTasks: stats.tasks.completed }); } getReport() { if (this.samples.length === 0) return null; const latest = this.samples[this.samples.length - 1]; const throughputs = this.samples.map(s => s.throughput); const memoryUsages = this.samples.map(s => s.memoryUsage); return { runtime: Date.now() - this.startTime, currentThroughput: latest.throughput, avgThroughput: throughputs.reduce((a, b) => a + b, 0) / throughputs.length, peakMemory: Math.max(...memoryUsages), currentMemory: latest.memoryUsage, completedTasks: latest.completedTasks, samples: this.samples.length }; }
} // Usage
const monitor = new PerformanceMonitor();
monitor.startMonitoring(); // ... run your tasks ... monitor.stopMonitoring();
console.log('Performance Report:', monitor.getReport());
``` --- ## Production Deployment ### Application Lifecycle Management ```javascript
const tasklets = require('tasklets'); // Good: Production-ready application setup
class TaskletApplication { constructor() { this.isShuttingDown = false; this.setupConfiguration(); this.setupHealthChecks(); this.setupGracefulShutdown(); } setupConfiguration() { const config = { workers: process.env.TASKLET_WORKERS || 'auto', timeout: parseInt(process.env.TASKLET_TIMEOUT) || 30000, logging: process.env.NODE_ENV === 'production' ? 'error' : 'info' }; tasklets.config(config); console.log('Tasklets configured:', config); } setupHealthChecks() { // Health check endpoint setInterval(() => { const health = tasklets.getHealth(); if (health.status === 'unhealthy') { console.error('System unhealthy:', health); // Implement alerting this.sendAlert('system_unhealthy', health); } // Log metrics for monitoring if (process.env.NODE_ENV === 'production') { this.logMetrics(health); } }, 30000); } setupGracefulShutdown() { const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT']; signals.forEach(signal => { process.on(signal, async () => { if (this.isShuttingDown) return; console.log(`Received ${signal}, starting graceful shutdown...`); this.isShuttingDown = true; try { await this.shutdown(); console.log('Graceful shutdown completed'); process.exit(0); } catch (error) { console.error('Shutdown error:', error); process.exit(1); } }); }); } async shutdown(timeoutMs = 10000) { // Stop accepting new work this.isShuttingDown = true; // Wait for current tasks to complete await tasklets.shutdown({ timeout: timeoutMs }); // Close other resources // Database connections, message queues, etc. } sendAlert(type, data) { // Implement your alerting logic console.error(`ALERT [${type}]:`, data); } logMetrics(health) { // Send metrics to monitoring system console.log('METRICS:', { memory_usage: health.memory.used, worker_utilization: health.workers.utilization, timestamp: new Date().toISOString() }); }
} // Initialize application
const app = new TaskletApplication();
``` ### Environment Configuration ```javascript
const tasklets = require('tasklets'); // Good: Environment-specific configuration
function configureEnvironment() { const env = process.env.NODE_ENV || 'development'; const configs = { development: { workers: 2, timeout: 10000, logging: 'debug' }, testing: { workers: 1, timeout: 5000, logging: 'off' }, staging: { workers: 'auto', timeout: 30000, logging: 'info' }, production: { workers: process.env.TASKLET_WORKERS || 'auto', timeout: parseInt(process.env.TASKLET_TIMEOUT) || 60000, logging: 'error' } }; const config = configs[env] || configs.development; tasklets.config(config); return config;
}
``` --- ## Monitoring and Health Checks ### Comprehensive Health Monitoring ```javascript
const tasklets = require('tasklets'); // Good: Production health monitoring
class HealthMonitor { constructor(options = {}) { this.thresholds = { memoryUsage: options.memoryThreshold || 0.8, workerUtilization: options.utilizationThreshold || 0.9, errorRate: options.errorThreshold || 0.1 }; this.metrics = { totalTasks: 0, errorCount: 0, lastHealthCheck: Date.now() }; } startMonitoring(intervalMs = 30000) { this.interval = setInterval(() => { this.performHealthCheck(); }, intervalMs); } stopMonitoring() { if (this.interval) { clearInterval(this.interval); } } performHealthCheck() { const health = tasklets.getHealth(); const stats = tasklets.getStats(); const issues = []; // Check memory usage if (health.memory.percentage > this.thresholds.memoryUsage) { issues.push(`High memory usage: ${health.memory.percentage}%`); } // Check worker utilization if (health.workers.utilization > this.thresholds.workerUtilization) { issues.push(`High worker utilization: ${Math.round(health.workers.utilization * 100)}%`); } // Check error rate const errorRate = this.metrics.errorCount / this.metrics.totalTasks; if (errorRate > this.thresholds.errorRate) { issues.push(`High error rate: ${Math.round(errorRate * 100)}%`); } this.metrics.lastHealthCheck = Date.now(); if (issues.length > 0) { this.reportIssues(issues, health, stats); } else { this.reportHealthy(health, stats); } } reportIssues(issues, health, stats) { console.warn('Health issues detected:', { issues, health: { status: health.status, memory: `${health.memory.used}MB (${health.memory.percentage}%)`, workers: `${Math.round(health.workers.utilization * 100)}% utilized` }, stats: { completed: stats.tasks.completed, throughput: stats.performance.throughput } }); // Implement alerting this.sendAlert('health_issues', { issues, health, stats }); } reportHealthy(health, stats) { if (process.env.NODE_ENV !== 'production') { console.log('System healthy:', { memory: `${health.memory.used}MB`, workers: `${health.workers.count} workers`, completed: stats.tasks.completed }); } } sendAlert(type, data) { // Implement your alerting system console.error(`ALERT [${type}]:`, data); } recordTaskCompletion(success = true) { this.metrics.totalTasks++; if (!success) { this.metrics.errorCount++; } }
} // Usage
const healthMonitor = new HealthMonitor({ memoryThreshold: 0.85, utilizationThreshold: 0.95, errorThreshold: 0.05
}); healthMonitor.startMonitoring();
``` --- ## Testing Strategies ### Unit Testing Tasks ```javascript
const tasklets = require('tasklets'); // Good: Testable task functions
describe('Task Functions', () => { // Test pure functions directly test('calculateMetrics should return correct metrics', () => { const data = [1, 2, 3, 4, 5]; const result = calculateMetrics(data); expect(result.sum).toBe(15); expect(result.average).toBe(3); expect(result.min).toBe(1); expect(result.max).toBe(5); }); // Test task execution test('task should execute correctly', async () => { const data = [1, 2, 3, 4, 5]; const result = await tasklets.run(() => calculateMetrics(data)); expect(result.sum).toBe(15); expect(result.average).toBe(3); }); // Test error handling test('task should handle errors correctly', async () => { await expect(tasklets.run(() => { throw new Error('Test error'); })).rejects.toThrow('Test error'); });
}); // Good: Integration testing
describe('Batch Processing', () => { test('should process batch correctly', async () => { const items = Array.from({ length: 100 }, (_, i) => ({ id: i, value: i * 2 })); const results = await tasklets.runAll( items.map(item => () => processItem(item)) ); expect(results).toHaveLength(100); expect(results[0].processed).toBe(true); }); test('should handle batch errors correctly', async () => { const tasks = [ { name: 'success', task: () => 'success' }, { name: 'failure', task: () => { throw new Error('fail'); } } ]; const results = await tasklets.batch(tasks); expect(results[0].success).toBe(true); expect(results[1].success).toBe(false); expect(results[1].error).toContain('fail'); });
});
``` ### Performance Testing ```javascript
const tasklets = require('tasklets'); // Good: Performance benchmarks
describe('Performance Tests', () => { test('should meet throughput requirements', async () => { const tasks = Array.from({ length: 1000 }, (_, i) => () => i * i); const startTime = Date.now(); const results = await tasklets.runAll(tasks); const duration = Date.now() - startTime; expect(results).toHaveLength(1000); expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds const throughput = 1000 / (duration / 1000); expect(throughput).toBeGreaterThan(200); // At least 200 ops/sec }); test('should handle load gracefully', async () => { const heavyTasks = Array.from({ length: 50 }, () => () => { // Simulate CPU-intensive work let sum = 0; for (let i = 0; i < 100000; i++) { sum += Math.sqrt(i); } return sum; }); const startTime = Date.now(); await tasklets.runAll(heavyTasks); const duration = Date.now() - startTime; // Should handle heavy load without timing out expect(duration).toBeLessThan(30000); // System should remain healthy const health = tasklets.getHealth(); expect(health.status).toBe('healthy'); });
});
``` --- ## Security and Safety ### Input Validation and Sanitization ```javascript
const tasklets = require('tasklets'); // Good: Input validation
class SecureProcessor { async processUserData(userData) { // Validate input before processing this.validateInput(userData); return await tasklets.run(() => this.safeProcess(userData)); } validateInput(data) { if (!data || typeof data !== 'object') { throw new Error('Invalid input: data must be an object'); } if (!data.id || typeof data.id !== 'string') { throw new Error('Invalid input: id is required and must be a string'); } if (data.id.length > 100) { throw new Error('Invalid input: id too long'); } // Sanitize input data.id = data.id.trim(); return data; } safeProcess(data) { // Process only validated and sanitized data return { id: data.id, processed: true, timestamp: Date.now() }; }
} // Good: Resource limits
async function processWithLimits(items, maxItems = 10000) { if (items.length > maxItems) { throw new Error(`Too many items: ${items.length} > ${maxItems}`); } // Process in controlled batches const batchSize = Math.min(1000, items.length); const batches = []; for (let i = 0; i < items.length; i += batchSize) { batches.push(items.slice(i, i + batchSize)); } const results = []; for (const batch of batches) { const batchResult = await tasklets.runAll( batch.map(item => () => processItem(item)) ); results.push(...batchResult); } return results;
}
``` --- ## Common Patterns and Anti-patterns ### Recommended Patterns ```javascript
const tasklets = require('tasklets'); // Pattern 1: Parallel Map
async function parallelMap(array, mapper) { return await tasklets.runAll( array.map(item => () => mapper(item)) );
} // Pattern 2: Controlled Concurrency
async function processWithConcurrencyLimit(items, limit = 10) { const results = []; for (let i = 0; i < items.length; i += limit) { const batch = items.slice(i, i + limit); const batchResults = await tasklets.runAll( batch.map(item => () => processItem(item)) ); results.push(...batchResults); } return results;
} // Pattern 3: Error Recovery Pipeline
async function resilientPipeline(data, stages) { let result = data; for (const stage of stages) { try { result = await tasklets.run(() => stage(result)); } catch (error) { console.warn(`Stage failed: ${stage.name}, trying fallback`); result = await tasklets.retry(() => stage.fallback(result), { attempts: 3, delay: 1000 }); } } return result;
}
``` ###  Anti-patterns to Avoid ```javascript
const tasklets = require('tasklets'); // Anti-pattern 1: Task for trivial operations
//  Bad
async function badTrivialTask() { return await tasklets.run(() => 1 + 1); // Too simple for parallel execution
} // Good
function goodTrivialOperation() { return 1 + 1; // Just do it synchronously
} // Anti-pattern 2: Excessive task creation
//  Bad
async function badExcessiveTasks() { const tasks = Array.from({ length: 100000 }, () => () => Math.random()); return await tasklets.runAll(tasks); // Too many tasks
} // Good
async function goodBatchedTasks() { const batchSize = 1000; const results = []; for (let i = 0; i < 100000; i += batchSize) { const batch = Array.from({ length: Math.min(batchSize, 100000 - i) }, () => () => Math.random()); const batchResults = await tasklets.runAll(batch); results.push(...batchResults); } return results;
} // Anti-pattern 3: Ignoring errors
//  Bad
async function badErrorIgnoring() { try { await tasklets.runAll([ () => riskyOperation1(), () => riskyOperation2(), () => riskyOperation3() ]); } catch (error) { // Ignoring error - bad! }
} // Good
async function goodErrorHandling() { const tasks = [ { name: 'op1', task: () => riskyOperation1() }, { name: 'op2', task: () => riskyOperation2() }, { name: 'op3', task: () => riskyOperation3() } ]; const results = await tasklets.batch(tasks); results.forEach(result => { if (!result.success) { console.error(`${result.name} failed: ${result.error}`); // Handle specific failures } }); return results.filter(r => r.success);
}
``` --- ## Summary The modern Tasklets API provides powerful abstractions for parallel processing while maintaining simplicity and safety. Key principles: 1. **Configure once** at application startup
2. **Use Promise-based patterns** consistently
3. **Design pure functions** for tasks
4. **Handle errors gracefully** with proper fallbacks
5. **Monitor performance** and health proactively
6. **Test thoroughly** including performance scenarios
7. **Validate inputs** and implement proper security measures