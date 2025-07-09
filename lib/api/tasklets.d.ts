/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file tasklets.d.ts
 * @brief TypeScript definitions for modern tasklets API
 */

/**
 * Modern Tasklets API - Simple, Promise-based, and user-friendly
 *
 * This module provides a modern JavaScript API for high-performance tasklets,
 * with Promise-based execution, automatic error handling, and intuitive configuration.
 */

import {EventEmitter} from 'events';

/**
 * Configuration options for tasklets
 */
export interface TaskletConfig {
    /** Number of worker threads or 'auto' for automatic detection */
    workers?: number | 'auto';
    /** Default timeout in milliseconds for tasks */
    timeout?: number;
    /** Log level: 'off', 'error', 'warn', 'info', 'debug', 'trace' */
    logging?: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    /** Maximum memory usage (not yet implemented) */
    maxMemory?: string;
}

/**
 * Options for running individual tasks
 */
export interface TaskOptions {
    /** Timeout for this specific task in milliseconds */
    timeout?: number;

    /** Additional options passed to the native module */
    [key: string]: any;
}

/**
 * Configuration for batch task execution
 */
export interface BatchTaskConfig {
    /** Name of the task for identification */
    name?: string;
    /** Task function to execute */
    task: () => any;
    /** Options for this specific task */
    options?: TaskOptions;
}

/**
 * Progress information for batch operations
 */
export interface BatchProgress {
    /** Number of completed tasks */
    completed: number;
    /** Total number of tasks */
    total: number;
    /** Completion percentage */
    percentage: number;
}

/**
 * Result of a batch operation
 */
export interface BatchResult {
    /** Name of the task */
    name: string;
    /** Result of the task (if successful) */
    result?: any;
    /** Error message (if failed) */
    error?: string;
    /** Whether the task was successful */
    success: boolean;
}

/**
 * Options for batch operations
 */
export interface BatchOptions {
    /** Progress callback function */
    onProgress?: (progress: BatchProgress) => void;
}

/**
 * Options for retry operations
 */
export interface RetryOptions extends TaskOptions {
    /** Maximum number of retry attempts */
    attempts?: number;
    /** Initial delay between retries in milliseconds */
    delay?: number;
    /** Backoff multiplier for exponential backoff */
    backoff?: number;
}

/**
 * Performance statistics
 */
export interface TaskletStats {
    /** Number of worker threads */
    workers: number;
    /** Task execution statistics */
    tasks: {
        /** Number of completed tasks */
        completed: number;
        /** Number of currently active tasks */
        active: number;
        /** Number of queued tasks */
        queued: number;
        /** Total number of tasks processed */
        total: number;
    };
    /** Performance metrics */
    performance: {
        /** Tasks per second throughput */
        throughput: number;
        /** Average execution time per task */
        averageExecutionTime: number;
    };
    /** System information */
    system: {
        /** Number of CPU cores */
        cpuCores: number;
        /** Node.js memory usage */
        memoryUsage: NodeJS.MemoryUsage;
        /** Process uptime in seconds */
        uptime: number;
    };
    /** Current configuration */
    config: TaskletConfig;
}

/**
 * Health status information
 */
export interface TaskletHealth {
    /** Overall health status */
    status: 'healthy' | 'unhealthy';
    /** Worker thread information */
    workers: {
        /** Number of worker threads */
        count: number;
        /** Current utilization percentage */
        utilization: number;
    };
    /** Memory usage information */
    memory: {
        /** Used memory in MB */
        used: number;
        /** Total allocated memory in MB */
        total: number;
        /** Memory usage percentage */
        percentage: number;
    };
    /** Task information */
    tasks: {
        /** Number of completed tasks */
        completed: number;
        /** Number of currently active tasks */
        active: number;
        /** Number of queued tasks */
        queued: number;
    };
    /** Error message if unhealthy */
    error?: string;
}

/**
 * Options for shutdown operation
 */
export interface ShutdownOptions {
    /** Timeout to wait for tasks to complete */
    timeout?: number;
}

/**
 * Auto-scheduling recommendations
 */
export interface AutoSchedulingRecommendations {
    recommended_worker_count: number;
    should_scale_up: boolean;
    should_scale_down: boolean;
    worker_scaling_confidence: number;
    recommended_timeout_ms: number;
    should_adjust_timeout: boolean;
    timeout_confidence: number;
    recommended_priority: number;
    should_adjust_priority: boolean;
    priority_confidence: number;
    recommended_batch_size: number;
    should_batch: boolean;
    batching_confidence: number;
    should_rebalance: boolean;
    load_balance_confidence: number;
}

/**
 * Auto-scheduling metrics
 */
export interface AutoSchedulingMetrics {
    cpu_utilization: number;
    memory_usage_percent: number;
    worker_utilization: number;
    throughput_tasks_per_sec: number;
    average_execution_time_ms: number;
    success_rate: number;
    queue_length: number;
    active_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    timestamp: number;
}

/**
 * Auto-scheduling settings
 */
export interface AutoSchedulingSettings {
    enabled: boolean;
    strategy: number;
    metricsCount: number;
    lastAdjustment: {
        reason: string;
        changes_made: string;
        performance_impact: number;
        timestamp: number;
    };
}

/**
 * Main Tasklets class
 */
export declare class Tasklets extends EventEmitter {
    /**
     * Configure tasklets behavior
     * @param config Configuration object
     * @returns This instance for chaining
     */
    config(config?: TaskletConfig): this;

    /**
     * Run a single task
     * @param task Task function to execute
     * @param options Options for the task
     * @returns Promise that resolves with the task result
     */
    run<T>(task: () => T, options?: TaskOptions): Promise<T>;

    /**
     * Run multiple tasks in parallel
     * @param tasks Array of task functions
     * @param options Options for the tasks
     * @returns Promise that resolves with array of results
     */
    runAll<T>(tasks: (() => T)[], options?: TaskOptions): Promise<T[]>;

    /**
     * Run tasks in batches with progress tracking
     * @param taskConfigs Array of task configurations
     * @param options Batch options
     * @returns Promise that resolves with array of results
     */
    batch(taskConfigs: BatchTaskConfig[], options?: BatchOptions): Promise<BatchResult[]>;

    /**
     * Retry a task with exponential backoff
     * @param task Task function to retry
     * @param options Retry options
     * @returns Promise that resolves with the task result
     */
    retry<T>(task: () => T, options?: RetryOptions): Promise<T>;

    /**
     * Get system performance and statistics
     * @returns Performance statistics
     */
    getStats(): TaskletStats;

    /**
     * Get health status of the tasklets system
     * @returns Health information
     */
    getHealth(): TaskletHealth;

    /**
     * Gracefully shutdown the tasklets system
     * @param options Shutdown options
     * @returns Promise that resolves when shutdown is complete
     */
    shutdown(options?: ShutdownOptions): Promise<void>;

    // Performance and automation methods
    getPerformanceSummary(): any;
    enableAutomation(): this;
    disableAutomation(): this;
    getAutomationStatus(): any;
    optimizeForCPU(): this;
    optimizeForIO(): this;
    optimizeForMemory(): this;
    optimizeForBalanced(): this;
    getOptimizationStatus(): any;

    // Advanced processing methods
    processBatchAdaptive<T, R>(items: T[], processor: (item: T) => R, options?: any): Promise<R[]>;
    processCPUIntensive<T, R>(items: T[], processor: (item: T) => R): Promise<R[]>;
    processIOIntensive<T, R>(items: T[], processor: (item: T) => R): Promise<R[]>;
    processMemoryIntensive<T, R>(items: T[], processor: (item: T) => R): Promise<R[]>;
    processWithMemoryAwareness<T, R>(items: T[], processor: (item: T) => R, options?: any): Promise<R[]>;

    // Optimized execution methods
    runOptimized<T>(task: () => T, options?: TaskOptions): Promise<T>;
    runAllOptimized<T>(tasks: (() => T)[], options?: TaskOptions): Promise<T[]>;
    batchOptimized(taskConfigs: BatchTaskConfig[], options?: BatchOptions): Promise<BatchResult[]>;
    runWithWorkloadOptimization<T>(task: () => T, workloadType?: string, options?: TaskOptions): Promise<T>;
    runWithMemoryAwareness<T>(task: () => T, options?: TaskOptions): Promise<T>;

    // Memory management methods
    getMemoryStats(): any;
    forceCleanup(): any;

    // Adaptive and configuration methods
    enableAdaptiveMode(): this;
    disableAdaptiveMode(): this;
    isAdaptiveModeEnabled(): boolean;
    setWorkloadType(workloadType: string): this;
    getWorkloadType(): string;
    forceAdaptiveAdjustment(): this;
    getAdaptiveMetrics(): any;
    getLastAdjustment(): any;
    getAdaptiveSettings(): any;
    enableAutoScheduling(): this;
    disableAutoScheduling(): this;
    isAutoSchedulingEnabled(): boolean;
    getAutoSchedulingRecommendations(): AutoSchedulingRecommendations;
    applyAutoSchedulingRecommendations(): this;
    getAutoSchedulingMetricsHistory(): AutoSchedulingMetrics[];
    getAutoSchedulingSettings(): AutoSchedulingSettings;
    getSystemInfo(): any;
    getConfigurationSummary(): any;
    getRecommendations(): any;
    recordPerformanceMetrics(metrics: any): this;

    // Worker thread methods
    setWorkerThreadCount(count: number): this;
    getWorkerThreadCount(): number;
    getMaxWorkerThreads(): number;
    getMinWorkerThreads(): number;
    getOptimalWorkerThreads(): number;

    // Logging methods
    setLogLevel(level: string): this;
    getLogLevel(): string;

    // Memory configuration methods
    setMemoryLimitPercent(percent: number): this;
    getMemoryLimitPercent(): number;
    setCleanupIntervalMs(interval: number): this;
    getCleanupIntervalMs(): number;

    // Stack configuration methods
    getDefaultStackSize(): number;
    getMaxStackSize(): number;
    getMinStackSize(): number;

    // Adaptive configuration methods
    getAdaptivePollIntervalMs(): number;
    getAdaptiveBatchSize(): number;

    // Pool configuration methods
    setMicrojobPoolInitialSize(size: number): this;
    getMicrojobPoolInitialSize(): number;
    setMicrojobPoolMaxSize(size: number): this;
    getMicrojobPoolMaxSize(): number;

    // Configuration management methods
    resetToDefaults(): this;
    getCPUAffinitySettings(): any;
    getPerformanceHistory(): any;

    // Utility methods
    log(level: string, component: string, message: string): this;
    error(component: string, message: string): this;
    warn(component: string, message: string): this;
    info(component: string, message: string): this;
    debug(component: string, message: string): this;
    trace(component: string, message: string): this;

    // Backward compatibility methods
    get_memory_stats(): any;
    force_cleanup(): any;
    set_max_tasklets(max: number): this;
    set_cleanup_interval(interval: number): this;

    // Version and info
    getVersion(): string;
}

/**
 * Default tasklets instance
 */
declare const tasklets: Tasklets;

/**
 * Modern API Functions
 */

/**
 * Run a single task
 * @param task Task function to execute
 * @param options Options for the task
 * @returns Promise that resolves with the task result
 */
export function run<T>(task: () => T, options?: TaskOptions): Promise<T>;

/**
 * Run multiple tasks in parallel
 * @param tasks Array of task functions
 * @param options Options for the tasks
 * @returns Promise that resolves with array of results
 */
export function runAll<T>(tasks: (() => T)[], options?: TaskOptions): Promise<T[]>;

/**
 * Run tasks in batches with progress tracking
 * @param taskConfigs Array of task configurations
 * @param options Batch options
 * @returns Promise that resolves with array of results
 */
export function batch(taskConfigs: BatchTaskConfig[], options?: BatchOptions): Promise<BatchResult[]>;

/**
 * Retry a task with exponential backoff
 * @param task Task function to retry
 * @param options Retry options
 * @returns Promise that resolves with the task result
 */
export function retry<T>(task: () => T, options?: RetryOptions): Promise<T>;

/**
 * Configure tasklets behavior
 * @param config Configuration object
 * @returns The tasklets instance for chaining
 */
export function config(config?: TaskletConfig): Tasklets;

/**
 * Get system performance and statistics
 * @returns Performance statistics
 */
export function getStats(): TaskletStats;

/**
 * Get health status of the tasklets system
 * @returns Health information
 */
export function getHealth(): TaskletHealth;

/**
 * Gracefully shutdown the tasklets system
 * @param options Shutdown options
 * @returns Promise that resolves when shutdown is complete
 */
export function shutdown(options?: ShutdownOptions): Promise<void>;

/**
 * TaskletContext for structured logging
 */
export import TaskletContext = require('./taskletContext');

/**
 * Export the Tasklets class
 */
export {Tasklets};

/**
 * Default export
 */
export default tasklets; 