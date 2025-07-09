/**
 * Fibonacci Parallel Computation Example - Using runAll
 * 
 * This example demonstrates how to use tasklets.runAll() to execute multiple
 * functions in parallel and get results as a Promise, similar to Promise.all().
 * 
 * Key features:
 * - runAll: High-level API for parallel execution
 * - async/await: Clean promise-based syntax
 * - automatic result collection: Results are returned in the same order as input
 * 
 * Usage: node examples/fibonacci-runAll.js
 */

const tasklets = require('../../lib');

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [20, 21, 22, 23, 24];

(async () => {
  console.log('Parallel Fibonacci with runAll:');

  // Cria um array de funções para cada número
  const tasks = numbers.map(n => () => fibonacci(n));

  // Executa todas em paralelo e aguarda os resultados
  const results = await tasklets.runAll(tasks);

  numbers.forEach((n, i) => {
    console.log(`fib(${n}) = ${results[i]}`);
  });
})(); 