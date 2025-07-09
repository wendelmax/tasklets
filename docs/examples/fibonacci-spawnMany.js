/**
 * Fibonacci Parallel Computation Example - Using spawnMany
 * 
 * This example demonstrates how to use tasklets.spawnMany() to create multiple
 * tasklets efficiently using a factory function, then join them and collect results.
 * 
 * Key features:
 * - spawnMany: Creates multiple tasklets with a factory function
 * - joinMany: Waits for all tasklets to complete
 * - getResult: Retrieves individual results
 * 
 * Usage: node examples/fibonacci-spawnMany.js
 */

const tasklets = require('../../lib');

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [20, 21, 22, 23, 24];

console.log('Parallel Fibonacci with spawnMany:');

const ids = tasklets.spawnMany(numbers.length, i => () => fibonacci(numbers[i]));
tasklets.joinMany(ids);
const results = ids.map(id => tasklets.getResult(id));

numbers.forEach((n, i) => {
  console.log(`fib(${n}) = ${results[i]}`);
}); 