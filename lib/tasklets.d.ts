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

import { EventEmitter } from 'events';

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
export { Tasklets };

/**
 * Default export
 */
export default tasklets; 