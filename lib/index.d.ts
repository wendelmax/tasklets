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
export * from './tasklets';

// Default export
import tasklets from './tasklets';
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