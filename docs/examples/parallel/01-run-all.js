/**
 * Fibonacci Parallel Computation Example - Using runAll
 */

const tasklets = require('../../../lib');

const numbers = [35, 36, 37, 38, 39];

(async () => {
  console.log('Parallel Fibonacci with runAll:');

  // Create tasks that are self-contained. 
  // We pass 'n' as an argument to the task function.
  const tasks = numbers.map(n => ({
    task: (num) => {
      function fib(x) {
        if (x <= 1) return x;
        return fib(x - 1) + fib(x - 2);
      }
      return fib(num);
    },
    args: [n]
  }));

  const startTime = Date.now();
  // Execute all in parallel
  const results = await tasklets.runAll(tasks);
  const endTime = Date.now();

  numbers.forEach((n, i) => {
    console.log(`fib(${n}) = ${results[i]}`);
  });

  console.log(`Total time: ${endTime - startTime}ms`);

  await tasklets.terminate();
})();