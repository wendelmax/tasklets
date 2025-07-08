/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file config.js
 * @brief Configuration management for tasklets
 */

const os = require('os');
const AdaptiveConfig = require('./adaptive');

/**
 * Configuration manager for tasklets
 */
class TaskletsConfig {
    constructor() {
        this.adaptive = new AdaptiveConfig();
        this.config = {
            workers: this.adaptive.getOptimalWorkerThreads(),
            timeout: 30000,
            logging: 'info',
            maxMemory: 'auto',
            memoryLimitPercent: this.adaptive.getAdaptiveMemoryLimitPercent(),
            cleanupInterval: 5000,
            microjobPoolInitialSize: this.adaptive.getAdaptiveMicrojobPoolInitialSize(),
            microjobPoolMaxSize: this.adaptive.getAdaptiveMicrojobPoolMaxSize(),
            adaptiveMode: true,
            workloadType: 'balanced'
        };
    }

    // =====================================================================
    // Basic Configuration
    // =====================================================================

    configure(options = {}) {
        if (options.workers) this.config.workers = options.workers;
        if (options.timeout) this.config.timeout = options.timeout;
        if (options.logging) this.config.logging = options.logging;
        if (options.maxMemory) this.config.maxMemory = options.maxMemory;
        if (options.memoryLimitPercent) this.config.memoryLimitPercent = options.memoryLimitPercent;
        if (options.cleanupInterval) this.config.cleanupInterval = options.cleanupInterval;
        if (options.microjobPoolInitialSize) this.config.microjobPoolInitialSize = options.microjobPoolInitialSize;
        if (options.microjobPoolMaxSize) this.config.microjobPoolMaxSize = options.microjobPoolMaxSize;
        if (options.adaptiveMode !== undefined) this.config.adaptiveMode = options.adaptiveMode;
        if (options.workloadType) this.config.workloadType = options.workloadType;

        // Apply adaptive optimization if enabled
        if (this.config.adaptiveMode && options.workloadType) {
            this.applyAdaptiveOptimization(options.workloadType);
        }
    }

    getConfig() {
        return { ...this.config };
    }

    resetToDefaults() {
        this.adaptive.resetAdaptiveSettings();
        this.config = {
            workers: this.adaptive.getOptimalWorkerThreads(),
            timeout: 30000,
            logging: 'info',
            maxMemory: 'auto',
            memoryLimitPercent: this.adaptive.getAdaptiveMemoryLimitPercent(),
            cleanupInterval: 5000,
            microjobPoolInitialSize: this.adaptive.getAdaptiveMicrojobPoolInitialSize(),
            microjobPoolMaxSize: this.adaptive.getAdaptiveMicrojobPoolMaxSize(),
            adaptiveMode: true,
            workloadType: 'balanced'
        };
    }

    // =====================================================================
    // Adaptive Configuration
    // =====================================================================

    enableAdaptiveMode() {
        this.config.adaptiveMode = true;
        this.applyAdaptiveOptimization(this.config.workloadType);
    }

    disableAdaptiveMode() {
        this.config.adaptiveMode = false;
    }

    isAdaptiveModeEnabled() {
        return this.config.adaptiveMode;
    }

    setWorkloadType(workloadType) {
        const validTypes = ['cpu-intensive', 'io-intensive', 'memory-intensive', 'balanced'];
        if (!validTypes.includes(workloadType)) {
            throw new Error(`Invalid workload type. Must be one of: ${validTypes.join(', ')}`);
        }
        this.config.workloadType = workloadType;
        
        if (this.config.adaptiveMode) {
            this.applyAdaptiveOptimization(workloadType);
        }
    }

    getWorkloadType() {
        return this.config.workloadType;
    }

    applyAdaptiveOptimization(workloadType) {
        const optimizedSettings = this.adaptive.optimizeForWorkload(workloadType);
        
        this.config.workers = optimizedSettings.workerThreads;
        this.config.memoryLimitPercent = optimizedSettings.memoryLimitPercent;
        this.config.microjobPoolInitialSize = optimizedSettings.microjobPoolInitialSize;
        this.config.microjobPoolMaxSize = optimizedSettings.microjobPoolMaxSize;
    }

    recordPerformanceMetrics(metrics) {
        if (this.config.adaptiveMode) {
            this.adaptive.recordPerformanceMetrics(metrics);
        }
    }

    getAdaptiveSettings() {
        return this.adaptive.getAdaptiveSettings();
    }

    getSystemInfo() {
        return this.adaptive.getSystemInfo();
    }

    // =====================================================================
    // Worker Thread Configuration
    // =====================================================================

    setWorkerThreadCount(count) {
        if (typeof count !== 'number' || count < 1) {
            throw new Error('Worker thread count must be a positive number');
        }
        const maxWorkers = this.getMaxWorkerThreads();
        if (count > maxWorkers) {
            throw new Error(`Worker thread count cannot exceed ${maxWorkers}`);
        }
        this.config.workers = count;
    }

    getWorkerThreadCount() {
        return this.config.workers;
    }

    getMaxWorkerThreads() {
        return this.adaptive.getMaxWorkerThreads();
    }

    getMinWorkerThreads() {
        return this.adaptive.getMinWorkerThreads();
    }

    getOptimalWorkerThreads() {
        return this.adaptive.getOptimalWorkerThreads();
    }

    // =====================================================================
    // Logging Configuration
    // =====================================================================

    setLogLevel(level) {
        const validLevels = ['off', 'error', 'warn', 'info', 'debug', 'trace'];
        if (!validLevels.includes(level)) {
            throw new Error(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
        }
        this.config.logging = level;
    }

    getLogLevel() {
        return this.config.logging;
    }

    // =====================================================================
    // Memory Configuration
    // =====================================================================

    setMemoryLimitPercent(percent) {
        if (typeof percent !== 'number' || percent < 0 || percent > 100) {
            throw new Error('Memory limit percent must be between 0 and 100');
        }
        this.config.memoryLimitPercent = percent;
    }

    getMemoryLimitPercent() {
        return this.config.memoryLimitPercent;
    }

    getAdaptiveMemoryLimitMB() {
        return this.adaptive.getAdaptiveMemoryLimitMB();
    }

    getPerTaskMemoryLimitMB() {
        return this.adaptive.getPerTaskMemoryLimitMB();
    }

    getMemoryPressureThreshold() {
        return this.adaptive.getMemoryPressureThreshold();
    }

    setCleanupIntervalMs(interval) {
        if (typeof interval !== 'number' || interval < 0) {
            throw new Error('Cleanup interval must be a positive number');
        }
        this.config.cleanupInterval = interval;
    }

    getCleanupIntervalMs() {
        return this.config.cleanupInterval;
    }

    // =====================================================================
    // Stack Configuration
    // =====================================================================

    getDefaultStackSize() {
        return this.adaptive.getAdaptiveStackSize();
    }

    getMaxStackSize() {
        return this.adaptive.getAdaptiveMaxStackSize();
    }

    getMinStackSize() {
        return this.adaptive.getAdaptiveMinStackSize();
    }

    // =====================================================================
    // Performance Configuration
    // =====================================================================

    getAdaptivePollIntervalMs() {
        return this.adaptive.getAdaptivePollIntervalMs();
    }

    getAdaptiveBatchSize() {
        return this.adaptive.getAdaptiveBatchSize();
    }

    getAdaptiveBufferSize() {
        return this.adaptive.getAdaptiveBufferSize();
    }

    // =====================================================================
    // Memory Pool Configuration
    // =====================================================================

    setMicrojobPoolInitialSize(size) {
        if (typeof size !== 'number' || size < 0) {
            throw new Error('Pool initial size must be a positive number');
        }
        this.config.microjobPoolInitialSize = size;
    }

    getMicrojobPoolInitialSize() {
        return this.config.microjobPoolInitialSize;
    }

    setMicrojobPoolMaxSize(size) {
        if (typeof size !== 'number' || size < 0) {
            throw new Error('Pool max size must be a positive number');
        }
        this.config.microjobPoolMaxSize = size;
    }

    getMicrojobPoolMaxSize() {
        return this.config.microjobPoolMaxSize;
    }

    // =====================================================================
    // Advanced Adaptive Features
    // =====================================================================

    getCPUAffinitySettings() {
        return this.adaptive.getCPUAffinitySettings();
    }

    getPerformanceHistory() {
        return this.adaptive.getPerformanceHistory();
    }

    // =====================================================================
    // Utility Methods
    // =====================================================================

    getConfigurationSummary() {
        const adaptiveSettings = this.adaptive.getAdaptiveSettings();
        const systemInfo = this.adaptive.getSystemInfo();
        
        return {
            current: this.config,
            adaptive: adaptiveSettings,
            system: systemInfo,
            recommendations: this.getRecommendations()
        };
    }

    getRecommendations() {
        const systemInfo = this.adaptive.getSystemInfo();
        const recommendations = [];

        if (systemInfo.isLowEnd) {
            recommendations.push({
                type: 'performance',
                message: 'Low-end system detected. Consider reducing batch sizes and worker threads.',
                suggested: {
                    workers: Math.max(2, systemInfo.cpu.count),
                    batchSize: Math.max(50, systemInfo.cpu.count * 50),
                    memoryLimitPercent: 60
                }
            });
        }

        if (systemInfo.isHighEnd) {
            recommendations.push({
                type: 'optimization',
                message: 'High-end system detected. You can increase batch sizes and worker threads.',
                suggested: {
                    workers: Math.min(systemInfo.cpu.count * 2, 512),
                    batchSize: systemInfo.cpu.count * 200,
                    memoryLimitPercent: 85
                }
            });
        }

        return recommendations;
    }
}

module.exports = TaskletsConfig; 