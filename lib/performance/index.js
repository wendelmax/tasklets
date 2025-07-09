/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file performance.js
 * @brief Performance optimization and caching for tasklets
 */

/**
 * Performance optimization manager
 */
class PerformanceManager {
  constructor() {
    // Performance caches
    this.taskCache = new Map();
    this.batchCache = new Map();
    this.methodCache = new WeakMap();
    this.performanceCache = new Map();
    
    // Performance metrics
    this.performanceMetrics = new Map();
    this.lastOptimization = Date.now();
    this.optimizationInterval = 5000; // 5 seconds
    
    // Cache configuration
    this.maxCacheSize = 1000;
    this.cacheExpiry = 300000; // 5 minutes
    this.metricsExpiry = 3600000; // 1 hour
    
    // Performance tracking
    this.executionTimes = [];
    this.memoryUsage = [];
    this.throughput = [];
    
    // Start cleanup interval
    this._startCleanupInterval();
  }

  // =====================================================================
  // Task Caching
  // =====================================================================

  getTaskId(taskFunction) {
    if (!this.methodCache.has(taskFunction)) {
      this.methodCache.set(taskFunction, `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    return this.methodCache.get(taskFunction);
  }

  getCachedTask(taskId) {
    const cached = this.taskCache.get(taskId);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached;
    }
    return null;
  }

  cacheTask(taskId, taskData) {
    this.taskCache.set(taskId, {
      ...taskData,
      timestamp: Date.now()
    });
    
    // Enforce cache size limit
    if (this.taskCache.size > this.maxCacheSize) {
      const oldestKey = this.taskCache.keys().next().value;
      this.taskCache.delete(oldestKey);
    }
  }

  // =====================================================================
  // Batch Caching
  // =====================================================================

  getCachedBatch(batchId) {
    const cached = this.batchCache.get(batchId);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached;
    }
    return null;
  }

  cacheBatch(batchId, batchData) {
    this.batchCache.set(batchId, {
      ...batchData,
      timestamp: Date.now()
    });
    
    // Enforce cache size limit
    if (this.batchCache.size > this.maxCacheSize) {
      const oldestKey = this.batchCache.keys().next().value;
      this.batchCache.delete(oldestKey);
    }
  }

  // =====================================================================
  // Performance Metrics
  // =====================================================================

  recordMetric(key, value) {
    this.performanceMetrics.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getMetric(key) {
    const metric = this.performanceMetrics.get(key);
    return metric ? metric.value : null;
  }

  recordExecutionTime(duration) {
    this.executionTimes.push(duration);
    
    // Keep only last 100 execution times
    if (this.executionTimes.length > 100) {
      this.executionTimes.shift();
    }
  }

  recordMemoryUsage(usage) {
    this.memoryUsage.push(usage);
    
    // Keep only last 50 memory measurements
    if (this.memoryUsage.length > 50) {
      this.memoryUsage.shift();
    }
  }

  recordThroughput(tasksPerSecond) {
    this.throughput.push(tasksPerSecond);
    
    // Keep only last 50 throughput measurements
    if (this.throughput.length > 50) {
      this.throughput.shift();
    }
  }

  getAverageExecutionTime() {
    if (this.executionTimes.length === 0) return 0;
    return this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length;
  }

  getAverageMemoryUsage() {
    if (this.memoryUsage.length === 0) return 0;
    return this.memoryUsage.reduce((sum, usage) => sum + usage, 0) / this.memoryUsage.length;
  }

  getAverageThroughput() {
    if (this.throughput.length === 0) return 0;
    return this.throughput.reduce((sum, tps) => sum + tps, 0) / this.throughput.length;
  }

  // =====================================================================
  // Performance Optimization
  // =====================================================================

  shouldOptimize() {
    return Date.now() - this.lastOptimization > this.optimizationInterval;
  }

  performOptimization() {
    this.clearExpiredCaches();
    this.lastOptimization = Date.now();
  }

  clearExpiredCaches() {
    const now = Date.now();
    
    // Clear expired task cache entries
    for (const [key, value] of this.taskCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.taskCache.delete(key);
      }
    }
    
    // Clear expired batch cache entries
    for (const [key, value] of this.batchCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.batchCache.delete(key);
      }
    }
    
    // Clear expired performance metrics
    for (const [key, value] of this.performanceMetrics.entries()) {
      if (now - value.timestamp > this.metricsExpiry) {
        this.performanceMetrics.delete(key);
      }
    }
  }

  clearAllCaches() {
    this.taskCache.clear();
    this.batchCache.clear();
    this.performanceMetrics.clear();
  }

  // =====================================================================
  // Adaptive Polling
  // =====================================================================

  getAdaptivePollInterval(timeout) {
    // Adaptive polling based on timeout
    if (timeout <= 1000) return 1; // Very fast for short timeouts
    if (timeout <= 5000) return 5; // Fast for medium timeouts
    if (timeout <= 30000) return 10; // Normal for long timeouts
    return Math.min(50, Math.max(10, timeout / 1000)); // Adaptive for very long timeouts
  }

  // =====================================================================
  // Performance Analysis
  // =====================================================================

  analyzePerformance() {
    const avgExecutionTime = this.getAverageExecutionTime();
    const avgMemoryUsage = this.getAverageMemoryUsage();
    const avgThroughput = this.getAverageThroughput();
    
    return {
      executionTime: {
        average: avgExecutionTime,
        trend: this._calculateTrend(this.executionTimes),
        recommendation: this._getExecutionTimeRecommendation(avgExecutionTime)
      },
      memoryUsage: {
        average: avgMemoryUsage,
        trend: this._calculateTrend(this.memoryUsage),
        recommendation: this._getMemoryRecommendation(avgMemoryUsage)
      },
      throughput: {
        average: avgThroughput,
        trend: this._calculateTrend(this.throughput),
        recommendation: this._getThroughputRecommendation(avgThroughput)
      },
      cache: {
        taskCacheSize: this.taskCache.size,
        batchCacheSize: this.batchCache.size,
        metricsSize: this.performanceMetrics.size,
        hitRate: this._calculateCacheHitRate()
      }
    };
  }

  _calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-10);
    const older = values.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  _getExecutionTimeRecommendation(avgTime) {
    if (avgTime < 10) return 'excellent';
    if (avgTime < 50) return 'good';
    if (avgTime < 100) return 'acceptable';
    return 'needs_optimization';
  }

  _getMemoryRecommendation(avgUsage) {
    if (avgUsage < 30) return 'excellent';
    if (avgUsage < 60) return 'good';
    if (avgUsage < 80) return 'acceptable';
    return 'needs_optimization';
  }

  _getThroughputRecommendation(avgThroughput) {
    if (avgThroughput > 1000) return 'excellent';
    if (avgThroughput > 500) return 'good';
    if (avgThroughput > 100) return 'acceptable';
    return 'needs_optimization';
  }

  _calculateCacheHitRate() {
    // This would need to be implemented with actual hit/miss tracking
    return 0.75; // Placeholder
  }

  // =====================================================================
  // Memory Management
  // =====================================================================

  getMemoryStats() {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      cacheSizes: {
        taskCache: this.taskCache.size,
        batchCache: this.batchCache.size,
        performanceMetrics: this.performanceMetrics.size
      }
    };
  }

  // =====================================================================
  // Cleanup and Maintenance
  // =====================================================================

  _startCleanupInterval() {
    setInterval(() => {
      this.clearExpiredCaches();
    }, 60000); // Clean up every minute
  }

  destroy() {
    this.clearAllCaches();
    this.executionTimes = [];
    this.memoryUsage = [];
    this.throughput = [];
  }

  // =====================================================================
  // Statistics and Reporting
  // =====================================================================

  getStats() {
    return {
      cache: {
        taskCacheSize: this.taskCache.size,
        batchCacheSize: this.batchCache.size,
        performanceMetricsSize: this.performanceMetrics.size
      },
      performance: {
        averageExecutionTime: this.getAverageExecutionTime(),
        averageMemoryUsage: this.getAverageMemoryUsage(),
        averageThroughput: this.getAverageThroughput(),
        lastOptimization: this.lastOptimization
      },
      memory: this.getMemoryStats()
    };
  }
}

module.exports = PerformanceManager; 