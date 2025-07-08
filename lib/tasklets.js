/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file tasklets.js
 * @brief Main tasklets API - High-level task execution and management
 */

const EventEmitter = require('events');
const TaskletsCore = require('./core');
const TaskletsConfig = require('./config');
const TaskletsLogger = require('./logger');
const TaskletsStats = require('./stats');

/**
 * Main Tasklets class - High-level API for task execution and management
 */
class Tasklets extends EventEmitter {
    constructor() {
        super();
        
        // Initialize components
        this.core = new TaskletsCore();
        this.config = new TaskletsConfig();
        this.logger = new TaskletsLogger();
        this.stats = new TaskletsStats(this.core, this.config);
        
        // Set initial log level
        this.logger.setLevel(this.config.getLogLevel());
    }

    // =====================================================================
    // Configuration Management
    // =====================================================================

    configure(options = {}) {
        this.config.configure(options);
        if (options.logging) {
            this.logger.setLevel(options.logging);
        }
    }

    // =====================================================================
    // High-Level Task Execution API
    // =====================================================================

    run(taskFunction, options = {}) {
        if (typeof taskFunction !== 'function') {
            throw new Error('Task must be a function');
        }
        
        const taskletId = this.core.spawn(taskFunction);
        const timeout = options.timeout || this.config.getConfig().timeout;
        return this.waitForCompletion(taskletId, timeout);
    }

    waitForCompletion(taskletId, timeout) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkCompletion = () => {
                try {
                    if (this.core.isFinished(taskletId)) {
                        if (this.core.hasError(taskletId)) {
                            reject(new Error(this.core.getError(taskletId)));
                        } else {
                            resolve('Task completed successfully');
                        }
                    } else {
                        // Check timeout
                        if (timeout && (Date.now() - startTime) > timeout) {
                            reject(new Error('Task timeout'));
                            return;
                        }
                        setTimeout(checkCompletion, 10);
                    }
                } catch (error) {
                    setTimeout(checkCompletion, 10);
                }
            };
            checkCompletion();
        });
    }

    runAll(tasks, options = {}) {
        if (!Array.isArray(tasks)) {
            throw new Error('Tasks must be an array of functions');
        }
        
        return Promise.all(tasks.map(task => this.run(task, options)));
    }

    batch(taskConfigs, options = {}) {
        if (!Array.isArray(taskConfigs)) {
            throw new Error('Task configurations must be an array');
        }
        
        const progressCallback = options.progress;
        let completedCount = 0;
        
        return Promise.all(taskConfigs.map((taskConfig, index) => {
            if (!taskConfig.task || typeof taskConfig.task !== 'function') {
                throw new Error('Each task configuration must have a task function');
            }
            
            return this.run(taskConfig.task, options).then(result => {
                completedCount++;
                if (progressCallback && typeof progressCallback === 'function') {
                    progressCallback(completedCount, taskConfigs.length, taskConfig.name || `task-${index}`);
                }
                
                return {
                    name: taskConfig.name || `task-${index}`,
                    result: result,
                    success: true
                };
            });
        }));
    }

    retry(task, options = {}) {
        if (typeof task !== 'function') {
            throw new Error('Task must be a function');
        }
        
        const attempts = options.attempts || 3;
        const delay = options.delay || 1000;
        
        return new Promise((resolve, reject) => {
            let attemptCount = 0;
            
            const tryTask = () => {
                attemptCount++;
                
                this.run(task, options).then(resolve).catch(error => {
                    if (attemptCount >= attempts) {
                        reject(error);
                    } else {
                        setTimeout(tryTask, delay);
                    }
                });
            };
            
            tryTask();
        });
    }

    // =====================================================================
    // Tasklet Management
    // =====================================================================

    spawn(taskFunction) {
        return this.core.spawn(taskFunction);
    }

    join(taskletId) {
        this.core.join(taskletId);
    }

    joinMany(taskletIds) {
        if (!Array.isArray(taskletIds)) {
            throw new Error('Tasklet IDs must be an array');
        }
        
        return Promise.all(taskletIds.map(id => {
            return new Promise((resolve) => {
                this.join(id);
                resolve();
            });
        }));
    }

    getResult(taskletId) {
        return this.core.getResult(taskletId);
    }

    hasError(taskletId) {
        return this.core.hasError(taskletId);
    }

    getError(taskletId) {
        return this.core.getError(taskletId);
    }

    isFinished(taskletId) {
        return this.core.isFinished(taskletId);
    }

    getStatus(taskletId) {
        return {
            id: taskletId,
            finished: this.isFinished(taskletId),
            hasError: this.hasError(taskletId),
            result: this.getResult(taskletId),
            error: this.getError(taskletId)
        };
    }

    findTasklet(id) {
        if (this.isFinished(id)) {
            return {
                id: id,
                finished: true,
                hasError: this.hasError(id),
                result: this.getResult(id),
                error: this.getError(id)
            };
        }
        return {
            id: id,
            finished: false,
            hasError: false,
            result: null,
            error: null
        };
    }

    // =====================================================================
    // System Management
    // =====================================================================

    shutdown(options = {}) {
        this.emit('shutdown');
        return Promise.resolve();
    }

    joinAll() {
        return Promise.resolve();
    }

    isRunning() {
        return true;
    }

    // =====================================================================
    // Statistics and Monitoring
    // =====================================================================

    getStats() {
        return this.stats.getStats();
    }

    getHealth() {
        return this.stats.getHealth();
    }

    getDetailedStats() {
        return this.stats.getDetailedStats();
    }

    getWorkerUtilization() {
        return this.stats.getWorkerUtilization();
    }

    getSuccessRate() {
        return this.stats.getSuccessRate();
    }

    getAverageExecutionTime() {
        return this.stats.getAverageExecutionTime();
    }

    // =====================================================================
    // System Information
    // =====================================================================

    getVersion() {
        return '1.0.0';
    }

    // =====================================================================
    // Configuration Delegation
    // =====================================================================

    // Worker Thread Configuration
    setWorkerThreadCount(count) { this.config.setWorkerThreadCount(count); }
    getWorkerThreadCount() { return this.config.getWorkerThreadCount(); }
    getMaxWorkerThreads() { return this.config.getMaxWorkerThreads(); }
    getMinWorkerThreads() { return this.config.getMinWorkerThreads(); }

    // Logging Configuration
    setLogLevel(level) { 
        this.config.setLogLevel(level);
        this.logger.setLevel(level);
    }
    getLogLevel() { return this.config.getLogLevel(); }

    // Memory Configuration
    setMemoryLimitPercent(percent) { this.config.setMemoryLimitPercent(percent); }
    getMemoryLimitPercent() { return this.config.getMemoryLimitPercent(); }
    setCleanupIntervalMs(interval) { this.config.setCleanupIntervalMs(interval); }
    getCleanupIntervalMs() { return this.config.getCleanupIntervalMs(); }

    // Stack Configuration
    getDefaultStackSize() { return this.config.getDefaultStackSize(); }
    getMaxStackSize() { return this.config.getMaxStackSize(); }
    getMinStackSize() { return this.config.getMinStackSize(); }

    // Performance Configuration
    getAdaptivePollIntervalMs() { return this.config.getAdaptivePollIntervalMs(); }
    getAdaptiveBatchSize() { return this.config.getAdaptiveBatchSize(); }

    // Memory Pool Configuration
    setMicrojobPoolInitialSize(size) { this.config.setMicrojobPoolInitialSize(size); }
    getMicrojobPoolInitialSize() { return this.config.getMicrojobPoolInitialSize(); }
    setMicrojobPoolMaxSize(size) { this.config.setMicrojobPoolMaxSize(size); }
    getMicrojobPoolMaxSize() { return this.config.getMicrojobPoolMaxSize(); }

    // Reset Configuration
    resetToDefaults() { this.config.resetToDefaults(); }

    // =====================================================================
    // Logging Delegation
    // =====================================================================

    log(level, component, message) { this.logger.log(level, component, message); }
    error(component, message) { this.logger.error(component, message); }
    warn(component, message) { this.logger.warn(component, message); }
    info(component, message) { this.logger.info(component, message); }
    debug(component, message) { this.logger.debug(component, message); }
    trace(component, message) { this.logger.trace(component, message); }

    // =====================================================================
    // Adaptive Configuration Methods
    // =====================================================================

    enableAdaptiveMode() {
        this.config.enableAdaptiveMode();
        this.core.setAdaptiveEnabled(true);
        this.info('AdaptiveConfig', 'Enabled native adaptive configuration');
    }

    disableAdaptiveMode() {
        this.config.disableAdaptiveMode();
        this.core.setAdaptiveEnabled(false);
        this.info('AdaptiveConfig', 'Disabled native adaptive configuration');
    }

    isAdaptiveModeEnabled() {
        return this.core.isAdaptiveEnabled();
    }

    setWorkloadType(workloadType) {
        this.config.setWorkloadType(workloadType);
        // Note: native.config is not implemented yet, so we skip it for now
        // this.native.config('workloadType', workloadType);
    }

    getWorkloadType() {
        return this.config.getWorkloadType();
    }

    forceAdaptiveAdjustment() {
        this.core.forceAdaptiveAdjustment();
        this.info('AdaptiveConfig', 'Forced adaptive configuration adjustment');
    }

    getAdaptiveMetrics() {
        return this.core.getAdaptiveMetrics();
    }

    getLastAdjustment() {
        return this.core.getLastAdjustment();
    }

    getAdaptiveSettings() {
        const nativeSettings = this.core.getAdaptiveMetrics();
        const jsSettings = this.config.getAdaptiveSettings();
        
        return {
            ...jsSettings,
            native: {
                metrics: nativeSettings,
                lastAdjustment: this.getLastAdjustment(),
                isEnabled: this.isAdaptiveModeEnabled()
            }
        };
    }

    // =====================================================================
    // Auto-Scheduler Methods
    // =====================================================================

    enableAutoScheduling() {
        this.core.enableAutoScheduling();
        this.info('AutoScheduler', 'Enabled intelligent auto-scheduling');
    }

    disableAutoScheduling() {
        this.core.disableAutoScheduling();
        this.info('AutoScheduler', 'Disabled auto-scheduling');
    }

    isAutoSchedulingEnabled() {
        return this.core.isAutoSchedulingEnabled();
    }

    getAutoSchedulingRecommendations() {
        return this.core.getAutoSchedulingRecommendations();
    }

    applyAutoSchedulingRecommendations() {
        this.core.applyAutoSchedulingRecommendations();
        this.info('AutoScheduler', 'Applied auto-scheduling recommendations');
    }

    getAutoSchedulingMetricsHistory() {
        return this.core.getAutoSchedulingMetricsHistory();
    }

    getAutoSchedulingSettings() {
        return {
            isEnabled: this.isAutoSchedulingEnabled(),
            recommendations: this.getAutoSchedulingRecommendations(),
            metricsHistory: this.getAutoSchedulingMetricsHistory()
        };
    }

    getSystemInfo() {
        return this.config.getSystemInfo();
    }

    getConfigurationSummary() {
        return this.config.getConfigurationSummary();
    }

    getRecommendations() {
        return this.config.getRecommendations();
    }

    recordPerformanceMetrics(metrics) {
        this.config.recordPerformanceMetrics(metrics);
    }

    // =====================================================================
    // Enhanced Memory Management
    // =====================================================================

    getAdaptiveMemoryLimitMB() {
        return this.config.getAdaptiveMemoryLimitMB();
    }

    getPerTaskMemoryLimitMB() {
        return this.config.getPerTaskMemoryLimitMB();
    }

    getMemoryPressureThreshold() {
        return this.config.getMemoryPressureThreshold();
    }

    getAdaptiveBufferSize() {
        return this.config.getAdaptiveBufferSize();
    }

    // =====================================================================
    // Enhanced CPU Management
    // =====================================================================

    getOptimalWorkerThreads() {
        return this.config.getOptimalWorkerThreads();
    }

    getCPUAffinitySettings() {
        return this.config.getCPUAffinitySettings();
    }

    // =====================================================================
    // Performance Monitoring
    // =====================================================================

    getPerformanceHistory() {
        return this.config.getPerformanceHistory();
    }

    // =====================================================================
    // Advanced Batch Processing
    // =====================================================================

    async processBatchAdaptive(items, processor, options = {}) {
        const adaptiveSettings = this.getAdaptiveSettings();
        const batchSize = options.batchSize || adaptiveSettings.batchSize;
        const results = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchStartTime = Date.now();

            const taskletIds = batch.map(item => this.spawn(() => processor(item)));
            await this.joinMany(taskletIds);
            
            const batchResults = taskletIds.map(id => this.getResult(id));
            results.push(...batchResults);

            // Record performance metrics for adaptive optimization
            const batchEndTime = Date.now();
            const throughput = batch.length / (batchEndTime - batchStartTime);
            
            this.recordPerformanceMetrics({
                throughput,
                batchSize: batch.length,
                executionTime: batchEndTime - batchStartTime,
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
            });
        }

        return results;
    }

    // =====================================================================
    // Workload-Specific Processing
    // =====================================================================

    async processCPUIntensive(items, processor) {
        this.setWorkloadType('cpu-intensive');
        return this.processBatchAdaptive(items, processor, {
            batchSize: this.getAdaptiveBatchSize() * 2
        });
    }

    async processIOIntensive(items, processor) {
        this.setWorkloadType('io-intensive');
        return this.processBatchAdaptive(items, processor, {
            batchSize: Math.max(50, this.getAdaptiveBatchSize() * 0.4)
        });
    }

    async processMemoryIntensive(items, processor) {
        this.setWorkloadType('memory-intensive');
        return this.processBatchAdaptive(items, processor, {
            batchSize: Math.max(25, this.getAdaptiveBatchSize() * 0.2)
        });
    }

    // =====================================================================
    // Smart Resource Management
    // =====================================================================

    async processWithMemoryAwareness(items, processor, options = {}) {
        const memoryThreshold = this.getMemoryPressureThreshold();
        const results = [];
        let currentBatchSize = options.batchSize || this.getAdaptiveBatchSize();

        for (let i = 0; i < items.length; i += currentBatchSize) {
            // Check memory pressure
            const memoryUsage = process.memoryUsage();
            const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

            if (memoryPercent > memoryThreshold.critical) {
                // Reduce batch size under memory pressure
                currentBatchSize = Math.max(10, currentBatchSize * 0.5);
                this.warn('Tasklets', `Memory pressure detected (${memoryPercent.toFixed(1)}%). Reducing batch size to ${currentBatchSize}`);
            } else if (memoryPercent < memoryThreshold.warning) {
                // Increase batch size when memory is available
                currentBatchSize = Math.min(this.getAdaptiveBatchSize(), currentBatchSize * 1.2);
            }

            const batch = items.slice(i, i + currentBatchSize);
            const batchResults = await this.processBatchAdaptive(batch, processor, {
                batchSize: currentBatchSize
            });
            results.push(...batchResults);
        }

        return results;
    }
}

module.exports = Tasklets; 