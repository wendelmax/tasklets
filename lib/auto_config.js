/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file auto_config.js
 * @brief Simplified automatic configuration system - no manual configuration required
 */

const os = require('os');

/**
 * Simplified automatic configuration system
 * 
 * This system automatically handles ALL configuration aspects:
 * - Worker thread scaling
 * - Memory management  
 * - Timeout optimization
 * - Priority management
 * - Batching strategies
 * - Pool sizing
 * - Load balancing
 * - Cleanup intervals
 * 
 * NO MANUAL CONFIGURATION REQUIRED - everything is automatic.
 */
class AutoConfig {
    constructor() {
        this.isEnabled = true; // Always enabled by default
        this.systemInfo = this.detectSystemCapabilities();
        this.performanceHistory = [];
        this.lastAdjustment = null;
    }

    // =====================================================================
    // System Detection (Automatic)
    // =====================================================================

    detectSystemCapabilities() {
        return {
            cpuCores: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version
        };
    }

    // =====================================================================
    // Automatic Configuration (No Manual Override)
    // =====================================================================

    getOptimalWorkerThreads() {
        // Automatically determine optimal worker count
        const cores = this.systemInfo.cpuCores;
        
        // For CPU-intensive workloads, use more workers
        if (this.isCPUIntensive()) {
            return Math.min(cores * 2, 16);
        }
        
        // For I/O-intensive workloads, use even more workers
        if (this.isIOIntensive()) {
            return Math.min(cores * 4, 32);
        }
        
        // For memory-intensive workloads, be conservative
        if (this.isMemoryIntensive()) {
            return Math.max(cores / 2, 2);
        }
        
        // Default: balanced approach
        return Math.min(cores * 1.5, 12);
    }

    getOptimalMemoryLimit() {
        // Automatically determine memory limit based on system
        const totalMemory = this.systemInfo.totalMemory;
        const freeMemory = this.systemInfo.freeMemory;
        const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
        
        // If memory pressure is high, be conservative
        if (memoryUsage > 80) {
            return 60; // 60% limit
        }
        
        // If memory is plentiful, be more generous
        if (memoryUsage < 40) {
            return 85; // 85% limit
        }
        
        // Default: balanced approach
        return 75; // 75% limit
    }

    getOptimalTimeout() {
        // Automatically determine timeout based on workload patterns
        const avgExecutionTime = this.getAverageExecutionTime();
        
        if (avgExecutionTime < 10) {
            return 5000; // 5 seconds for fast jobs
        } else if (avgExecutionTime < 100) {
            return 15000; // 15 seconds for moderate jobs
        } else if (avgExecutionTime < 1000) {
            return 60000; // 1 minute for complex jobs
        } else {
            return 300000; // 5 minutes for heavy jobs
        }
    }

    getOptimalBatchSize() {
        // Automatically determine batch size based on workload
        const cores = this.systemInfo.cpuCores;
        
        if (this.isCPUIntensive()) {
            return Math.min(cores * 10, 100);
        }
        
        if (this.isIOIntensive()) {
            return Math.min(cores * 20, 200);
        }
        
        if (this.isMemoryIntensive()) {
            return Math.max(cores * 2, 10);
        }
        
        return Math.min(cores * 15, 150);
    }

    getOptimalPoolSize() {
        // Automatically determine pool sizes
        const cores = this.systemInfo.cpuCores;
        
        return {
            initial: Math.min(cores * 5, 50),
            max: Math.min(cores * 20, 200)
        };
    }

    getOptimalCleanupInterval() {
        // Automatically determine cleanup interval
        const memoryUsage = this.getMemoryUsage();
        
        if (memoryUsage > 80) {
            return 2000; // 2 seconds if high memory pressure
        } else if (memoryUsage > 60) {
            return 5000; // 5 seconds if moderate memory pressure
        } else {
            return 10000; // 10 seconds if low memory pressure
        }
    }

    // =====================================================================
    // Workload Pattern Detection (Automatic)
    // =====================================================================

    isCPUIntensive() {
        const recentMetrics = this.performanceHistory.slice(-5);
        if (recentMetrics.length === 0) return false;
        
        const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpu_utilization, 0) / recentMetrics.length;
        const avgExecutionTime = recentMetrics.reduce((sum, m) => sum + m.average_execution_time_ms, 0) / recentMetrics.length;
        
        return avgCPU > 70 && avgExecutionTime > 50;
    }

    isIOIntensive() {
        const recentMetrics = this.performanceHistory.slice(-5);
        if (recentMetrics.length === 0) return false;
        
        const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpu_utilization, 0) / recentMetrics.length;
        const avgExecutionTime = recentMetrics.reduce((sum, m) => sum + m.average_execution_time_ms, 0) / recentMetrics.length;
        
        return avgCPU < 50 && avgExecutionTime < 20;
    }

    isMemoryIntensive() {
        const recentMetrics = this.performanceHistory.slice(-5);
        if (recentMetrics.length === 0) return false;
        
        const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory_usage_percent, 0) / recentMetrics.length;
        
        return avgMemory > 70;
    }

    // =====================================================================
    // Performance Monitoring (Automatic)
    // =====================================================================

    recordPerformanceMetrics(metrics) {
        this.performanceHistory.push({
            ...metrics,
            timestamp: Date.now()
        });
        
        // Keep only recent history
        if (this.performanceHistory.length > 20) {
            this.performanceHistory.shift();
        }
        
        // Automatically adjust if needed
        this.autoAdjust();
    }

    getAverageExecutionTime() {
        if (this.performanceHistory.length === 0) return 100; // Default
        
        const recent = this.performanceHistory.slice(-10);
        return recent.reduce((sum, m) => sum + m.average_execution_time_ms, 0) / recent.length;
    }

    getMemoryUsage() {
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        return ((totalMemory - freeMemory) / totalMemory) * 100;
    }

    // =====================================================================
    // Automatic Adjustment (No Manual Intervention)
    // =====================================================================

    autoAdjust() {
        // Only adjust if we have enough data
        if (this.performanceHistory.length < 3) return;
        
        const currentMetrics = this.performanceHistory[this.performanceHistory.length - 1];
        const previousMetrics = this.performanceHistory[this.performanceHistory.length - 2];
        
        // Check if adjustment is needed
        const needsAdjustment = this.needsAdjustment(currentMetrics, previousMetrics);
        
        if (needsAdjustment) {
            this.performAdjustment(currentMetrics);
        }
    }

    needsAdjustment(current, previous) {
        // Check for significant performance changes
        const cpuChange = Math.abs(current.cpu_utilization - previous.cpu_utilization);
        const memoryChange = Math.abs(current.memory_usage_percent - previous.memory_usage_percent);
        const throughputChange = Math.abs(current.throughput_tasks_per_sec - previous.throughput_tasks_per_sec);
        
        return cpuChange > 20 || memoryChange > 15 || throughputChange > 5;
    }

    performAdjustment(metrics) {
        const adjustments = [];
        
        // Worker thread adjustment
        const optimalWorkers = this.getOptimalWorkerThreads();
        if (Math.abs(metrics.worker_count - optimalWorkers) > 1) {
            adjustments.push(`workers: ${optimalWorkers}`);
        }
        
        // Memory limit adjustment
        const optimalMemory = this.getOptimalMemoryLimit();
        if (Math.abs(metrics.memory_usage_percent - optimalMemory) > 10) {
            adjustments.push(`memory_limit: ${optimalMemory}%`);
        }
        
        // Timeout adjustment
        const optimalTimeout = this.getOptimalTimeout();
        adjustments.push(`timeout: ${optimalTimeout}ms`);
        
        // Batch size adjustment
        const optimalBatchSize = this.getOptimalBatchSize();
        adjustments.push(`batch_size: ${optimalBatchSize}`);
        
        // Pool size adjustment
        const optimalPool = this.getOptimalPoolSize();
        adjustments.push(`pool_initial: ${optimalPool.initial}, pool_max: ${optimalPool.max}`);
        
        // Cleanup interval adjustment
        const optimalCleanup = this.getOptimalCleanupInterval();
        adjustments.push(`cleanup_interval: ${optimalCleanup}ms`);
        
        if (adjustments.length > 0) {
            this.lastAdjustment = {
                reason: `Automatic adjustment based on ${this.getWorkloadType()} workload`,
                changes_made: adjustments.join(', '),
                performance_impact: this.calculatePerformanceImpact(metrics),
                timestamp: Date.now()
            };
        }
    }

    getWorkloadType() {
        if (this.isCPUIntensive()) return 'cpu-intensive';
        if (this.isIOIntensive()) return 'io-intensive';
        if (this.isMemoryIntensive()) return 'memory-intensive';
        return 'balanced';
    }

    calculatePerformanceImpact(metrics) {
        // Calculate overall performance score
        const cpuScore = Math.min(metrics.cpu_utilization / 100, 1);
        const memoryScore = Math.min(metrics.memory_usage_percent / 100, 1);
        const throughputScore = Math.min(metrics.throughput_tasks_per_sec / 100, 1);
        const successScore = metrics.success_rate || 0.95;
        
        return (cpuScore + memoryScore + throughputScore + successScore) / 4;
    }

    // =====================================================================
    // Public API (Read-only, No Manual Configuration)
    // =====================================================================

    getSettings() {
        return {
            isEnabled: this.isEnabled,
            systemInfo: this.systemInfo,
            currentWorkload: this.getWorkloadType(),
            optimalWorkers: this.getOptimalWorkerThreads(),
            optimalMemory: this.getOptimalMemoryLimit(),
            optimalTimeout: this.getOptimalTimeout(),
            optimalBatchSize: this.getOptimalBatchSize(),
            optimalPool: this.getOptimalPoolSize(),
            optimalCleanup: this.getOptimalCleanupInterval(),
            lastAdjustment: this.lastAdjustment,
            performanceHistory: this.performanceHistory
        };
    }

    getRecommendations() {
        return {
            worker_threads: this.getOptimalWorkerThreads(),
            memory_limit_percent: this.getOptimalMemoryLimit(),
            timeout_ms: this.getOptimalTimeout(),
            batch_size: this.getOptimalBatchSize(),
            pool_initial_size: this.getOptimalPoolSize().initial,
            pool_max_size: this.getOptimalPoolSize().max,
            cleanup_interval_ms: this.getOptimalCleanupInterval(),
            workload_type: this.getWorkloadType(),
            confidence: 0.95 // High confidence since it's automatic
        };
    }

    // =====================================================================
    // Utility Methods (Read-only)
    // =====================================================================

    getSystemInfo() {
        return this.systemInfo;
    }

    getPerformanceHistory() {
        return this.performanceHistory;
    }

    getLastAdjustment() {
        return this.lastAdjustment;
    }

    isEnabled() {
        return this.isEnabled;
    }

    // =====================================================================
    // No Manual Configuration Methods
    // =====================================================================
    
    // These methods are intentionally not provided:
    // - setWorkerThreadCount()
    // - setMemoryLimit()
    // - setTimeout()
    // - setBatchSize()
    // - setPoolSize()
    // - setCleanupInterval()
    // - configure()
    // - resetToDefaults()
    
    // Everything is automatic - no manual configuration needed!
}

module.exports = AutoConfig; 