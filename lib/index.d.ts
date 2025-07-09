/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file index.d.ts
 * @brief TypeScript definitions for modern tasklets library entry point
 */

/**
 * Modern Tasklets API - High-performance lightweight cooperative tasklets for Node.js
 *
 * Main entry point TypeScript definitions for the modern API
 */

// Export everything from the main modern tasklets module
export * from './api/tasklets';

// Default export
import tasklets from './api/tasklets';

export default tasklets;

/**
 * Quick Start Example:
 *
 * ```typescript
 * import tasklets from 'tasklets';
 *
 * // Simple tasklet execution
 * const result = await tasklets.run(() => {
 *     return heavyComputation();
 * });
 *
 * // Run multiple tasks in parallel
 * const results = await tasklets.runAll([
 *     () => processData1(),
 *     () => processData2(),
 *     () => processData3()
 * ]);
 *
 * // Batch processing with progress tracking
 * const batchResults = await tasklets.batch([
 *     { name: 'task1', task: () => processItem1() },
 *     { name: 'task2', task: () => processItem2() },
 *     { name: 'task3', task: () => processItem3() }
 * ], {
 *     onProgress: (progress) => {
 *         console.log(`Progress: ${progress.percentage}%`);
 *     }
 * });
 *
 * // Retry failed operations
 * const retryResult = await tasklets.retry(() => {
 *     return unreliableApiCall();
 * }, { attempts: 3, delay: 1000 });
 * ```
 */

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