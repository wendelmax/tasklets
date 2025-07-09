/**
 * Fibonacci Parallel Computation Example - Using batch
 * 
 * This example demonstrates how to use tasklets.batch() to execute multiple
 * tasks in parallel with progress tracking and structured results.
 * 
 * Key features:
 * - batch: Executes multiple tasks with individual configurations
 * - progress callback: Real-time progress tracking
 * - structured results: Each result includes name, success status, and data
 * 
 * Usage: node examples/fibonacci-batch.js
 */

const tasklets = require('../../lib');

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [20, 21, 22, 23, 24];

console.log('Parallel Fibonacci with batch:');

const configs = numbers.map(n => ({
  name: `fib(${n})`,
  task: () => fibonacci(n)
}));

tasklets.batch(configs, {
  progress: (p) => {
    console.log(`Progress: ${p.completed}/${p.total} (${p.percentage}%)`);
  }
}).then(results => {
  results.forEach(r => {
    console.log(`${r.name} = ${r.result}`);
  });
}); 