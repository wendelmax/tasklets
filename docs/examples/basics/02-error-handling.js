/**
 * @file error-handling.js
 * @description This example demonstrates various error handling patterns when working with Tasklets.
 * It covers several strategies for building robust and resilient applications:
 * - Basic error handling using .catch() with `tasklets.run()`.
 * - A retry pattern with exponential backoff to handle transient failures.
 * - A circuit breaker pattern to prevent a system from repeatedly trying to execute an operation that is likely to fail.
 * - Error categorization to handle different types of errors in different ways.
 * - Graceful degradation with fallback tasks.
 * - A bulkhead pattern to isolate failures between different groups of tasks.
 */
const tasklets = require('../../../lib');

console.log('Tasklets - Error Handling Example\n');

// Simulated unreliable task that randomly fails
function unreliableTask(id, failureRate = 0.3) {
  if (Math.random() < failureRate) {
    throw new Error(`Task ${id} failed randomly`);
  }

  // Simulate some work
  const workTime = Math.random() * 100 + 50;
  const start = Date.now();
  while (Date.now() - start < workTime) {
    Math.sqrt(Math.random() * 1000);
  }

  return `Task ${id} completed successfully after ${Date.now() - start}ms`;
}

// Task that might throw different types of errors
function taskWithVariousErrors(id) {
  const errorTypes = [
    () => {
      throw new Error('Generic error');
    },
    () => {
      throw new TypeError('Type error');
    },
    () => {
      throw new RangeError('Range error');
    },
    () => {
      throw new SyntaxError('Syntax error');
    },
    () => 'Success'
  ];

  const randomChoice = Math.floor(Math.random() * errorTypes.length);
  const result = errorTypes[randomChoice]();

  return typeof result === 'string' ? `Task ${id}: ${result}` : result;
}

// Async task that might fail
async function asyncUnreliableTask(id, delay = 100) {
  await new Promise(resolve => setTimeout(resolve, delay));

  if (Math.random() < 0.4) {
    throw new Error(`Async task ${id} failed`);
  }

  return `Async task ${id} completed`;
}

async function basicErrorHandling() {
  console.log('1. Basic Error Handling:');

  const taskCount = 10;
  const results = [];
  const errors = [];

  const promises = Array.from({ length: taskCount }, (_, i) =>
    tasklets.run(unreliableTask, i + 1)
      .then(result => ({ taskId: i + 1, success: true, result }))
      .catch(error => ({ taskId: i + 1, success: false, error: error.message }))
  );

  const outcomes = await Promise.all(promises);

  outcomes.forEach(outcome => {
    if (outcome.success) {
      results.push(outcome);
    } else {
      errors.push(outcome);
    }
  });

  console.log(`  Successful tasks: ${results.length}`);
  console.log(`  Failed tasks: ${errors.length}`);

  if (errors.length > 0) {
    console.log('  Errors:');
    errors.forEach(error => {
      console.log(`  Task ${error.taskId}: ${error.error}`);
    });
  }

  console.log();
  return { results, errors };
}

async function retryPattern() {
  console.log('2. Retry Pattern:');

  async function taskWithRetry(taskArg, maxRetries = 3, id = 0, failureRate = 0.5) {
    let delayVal = 100;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await tasklets.run(unreliableTask, id, failureRate);
        return { success: true, result, attempts: attempt };
      } catch (error) {
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message,
            attempts: attempt,
            finalError: `Failed after ${maxRetries} attempts`
          };
        }

        console.log(`  Attempt ${attempt} failed for task ${id}, retrying in ${delayVal}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayVal));
        delayVal *= 2; // Exponential backoff
      }
    }
  }

  const taskConfigs = [
    { id: 1, rate: 0.7 }, // High failure rate
    { id: 2, rate: 0.5 },
    { id: 3, rate: 0.3 },
    { id: 4, rate: 0.8 }, // Very high failure rate
    { id: 5, rate: 0.1 }  // Low failure rate
  ];

  const results = await Promise.all(
    taskConfigs.map(c => taskWithRetry(unreliableTask, 3, c.id, c.rate))
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`  Successful with retries: ${successful.length}`);
  console.log(`  Failed after retries: ${failed.length}`);

  results.forEach((result, index) => {
    const status = result.success ? 'SUCCESS' : 'FAILED';
    console.log(`  Task ${index + 1}: ${status} (${result.attempts} attempts)`);
    if (!result.success) {
      console.log(`  Error: ${result.finalError}`);
    }
  });

  console.log();
  return results;
}

async function circuitBreakerPattern() {
  console.log('3. Circuit Breaker Pattern:');

  class CircuitBreaker {
    constructor(threshold = 5, timeout = 10000) {
      this.threshold = threshold;
      this.timeout = timeout;
      this.failures = 0;
      this.lastFailureTime = 0;
      this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }

    async execute(taskFn) {
      if (this.state === 'OPEN') {
        if (Date.now() - this.lastFailureTime > this.timeout) {
          this.state = 'HALF_OPEN';
          console.log('  Circuit breaker: HALF_OPEN');
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      try {
        const result = await taskFn();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }

    onSuccess() {
      this.failures = 0;
      this.state = 'CLOSED';
    }

    onFailure() {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
        console.log('  Circuit breaker: OPEN');
      }
    }
  }

  const circuitBreaker = new CircuitBreaker(3, 2000);
  const results = [];

  // Simulate multiple calls, some will fail and trigger circuit breaker
  for (let i = 0; i < 15; i++) {
    try {
      const result = await circuitBreaker.execute(() =>
        tasklets.run(unreliableTask, i + 1, 0.6)
      );
      results.push({ taskId: i + 1, success: true, result });
    } catch (error) {
      results.push({ taskId: i + 1, success: false, error: error.message });
    }

    // Small delay between calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const circuitBreakerErrors = failed.filter(r => r.error.includes('Circuit breaker'));

  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Circuit breaker rejections: ${circuitBreakerErrors.length}`);
  console.log();

  return results;
}

async function errorCategorizationPattern() {
  console.log('4. Error Categorization Pattern:');

  function categorizeError(error) {
    if (error.name === 'TypeError') {
      return { category: 'TYPE_ERROR', severity: 'HIGH', retryable: false };
    } else if (error.name === 'RangeError') {
      return { category: 'RANGE_ERROR', severity: 'MEDIUM', retryable: false };
    } else if (error.name === 'SyntaxError') {
      return { category: 'SYNTAX_ERROR', severity: 'HIGH', retryable: false };
    } else if (error.message.includes('randomly')) {
      return { category: 'RANDOM_ERROR', severity: 'LOW', retryable: true };
    } else {
      return { category: 'UNKNOWN_ERROR', severity: 'MEDIUM', retryable: true };
    }
  }

  const tasks = Array.from({ length: 15 }, (_, i) =>
    tasklets.run(taskWithVariousErrors, i + 1)
      .then(result => ({ taskId: i + 1, success: true, result }))
      .catch(error => {
        const category = categorizeError(error);
        return {
          taskId: i + 1,
          success: false,
          error: error.message,
          errorType: error.name,
          category: category.category,
          severity: category.severity,
          retryable: category.retryable
        };
      })
  );

  const results = await Promise.all(tasks);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);

  // Group errors by category
  const errorsByCategory = failed.reduce((acc, error) => {
    const category = error.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(error);
    return acc;
  }, {});

  console.log('\n  Error breakdown by category:');
  Object.entries(errorsByCategory).forEach(([category, errors]) => {
    console.log(`  ${category}: ${errors.length} errors`);
    console.log(`  Severity: ${errors[0].severity}`);
    console.log(`  Retryable: ${errors[0].retryable}`);
    console.log(`  Examples: ${errors.slice(0, 2).map(e => `Task ${e.taskId}`).join(', ')}`);
  });

  console.log();
  return results;
}

async function gracefulDegradationPattern() {
  console.log('5. Graceful Degradation Pattern:');

  async function taskWithFallback(primaryTask, fallbackTask, id) {
    try {
      const result = await tasklets.run(unreliableTask, id, 0.7);
      return { taskId: id, result, source: 'primary' };
    } catch (primaryError) {
      console.log(`  Task ${id}: Primary failed, trying fallback...`);
      try {
        const result = await tasklets.run(unreliableTask, id, 0.2);
        return { taskId: id, result, source: 'fallback' };
      } catch (fallbackError) {
        return {
          taskId: id,
          error: `Both primary and fallback failed: ${primaryError.message} | ${fallbackError.message}`,
          source: 'none'
        };
      }
    }
  }

  const tasks = Array.from({ length: 8 }, (_, i) => {
    const taskId = i + 1;
    return taskWithFallback(
      () => unreliableTask(taskId, 0.7), // High failure rate primary
      () => unreliableTask(taskId, 0.2), // Low failure rate fallback
      taskId
    );
  });

  const results = await Promise.all(tasks);

  const primarySuccess = results.filter(r => r.source === 'primary').length;
  const fallbackSuccess = results.filter(r => r.source === 'fallback').length;
  const totalFailures = results.filter(r => r.source === 'none').length;

  console.log(`  Primary successful: ${primarySuccess}`);
  console.log(`  Fallback successful: ${fallbackSuccess}`);
  console.log(`  Total failures: ${totalFailures}`);
  console.log(`  Success rate: ${((primarySuccess + fallbackSuccess) / results.length * 100).toFixed(1)}%`);

  console.log();
  return results;
}

async function bulkheadPattern() {
  console.log('6. Bulkhead Pattern (Resource Isolation):');

  // Simulate different types of tasks that should be isolated
  async function processBatch(batchName, tasks, concurrency = 3) {
    const results = [];

    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        chunk.map(t => {
          if (typeof t === 'function') return tasklets.run(t);
          return tasklets.run(t.task, ...(t.args || []));
        })
      );

      batchResults.forEach((result, index) => {
        const taskId = i + index + 1;
        if (result.status === 'fulfilled') {
          results.push({ batchName, taskId, success: true, result: result.value });
        } else {
          results.push({ batchName, taskId, success: false, error: result.reason.message });
        }
      });
    }

    return results;
  }

  // Three different types of workloads
  const criticalTasks = Array.from({ length: 6 }, (_, i) =>
    ({ task: unreliableTask, args: [`Critical-${i + 1}`, 0.2] })
  );

  const regularTasks = Array.from({ length: 8 }, (_, i) =>
    ({ task: unreliableTask, args: [`Regular-${i + 1}`, 0.4] })
  );

  const backgroundTasks = Array.from({ length: 10 }, (_, i) =>
    ({ task: unreliableTask, args: [`Background-${i + 1}`, 0.6] })
  );

  // Process each batch with different concurrency limits
  const [criticalResults, regularResults, backgroundResults] = await Promise.all([
    processBatch('Critical', criticalTasks, 2),  // Limited concurrency for critical
    processBatch('Regular', regularTasks, 3),  // Moderate concurrency
    processBatch('Background', backgroundTasks, 4) // Higher concurrency for background
  ]);

  const allResults = [...criticalResults, ...regularResults, ...backgroundResults];

  console.log('\n  Results by batch:');
  ['Critical', 'Regular', 'Background'].forEach(batchName => {
    const batchResults = allResults.filter(r => r.batchName === batchName);
    const successful = batchResults.filter(r => r.success).length;
    const failed = batchResults.filter(r => !r.success).length;

    console.log(`  ${batchName}: ${successful}/${batchResults.length} successful (${((successful / batchResults.length) * 100).toFixed(1)}%)`);
  });

  console.log();
  return allResults;
}

// Run the example
(async () => {
  try {
    console.log('Running comprehensive error handling examples...\n');

    const results = {};

    // Run all error handling patterns
    results.basic = await basicErrorHandling();
    results.retry = await retryPattern();
    results.circuitBreaker = await circuitBreakerPattern();
    results.categorization = await errorCategorizationPattern();
    results.gracefulDegradation = await gracefulDegradationPattern();
    results.bulkhead = await bulkheadPattern();

    // Summary
    console.log('Summary of Error Handling Patterns:');
    console.log('=====================================');

    const totalTasks = Object.values(results).reduce((sum, result) => {
      if (Array.isArray(result)) {
        return sum + result.length;
      } else if (result.results && result.errors) {
        return sum + result.results.length + result.errors.length;
      }
      return sum;
    }, 0);

    console.log(`Total tasks executed: ${totalTasks}`);
    console.log('Each pattern demonstrates different strategies for handling failures:');
    console.log('- Basic: Simple success/failure handling');
    console.log('- Retry: Automatic retries with exponential backoff');
    console.log('- Circuit Breaker: Preventing cascading failures');
    console.log('- Categorization: Different handling based on error type');
    console.log('- Graceful Degradation: Fallback mechanisms');
    console.log('- Bulkhead: Resource isolation and protection');

    console.log('\nError handling example completed!');
  } catch (error) {
    console.error('Error in main execution:', error.message);
  }
})(); 