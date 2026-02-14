/**
 * @file basic.js
 * @description Tasklets Basic Usage (Native Version)
 */
const tasklets = require('../../../lib/index');

console.log('--- Tasklets Basic Example ---\n');

async function runBasicExamples() {
  // Configure (Optional)
  tasklets.configure({
    workers: 4
  });

  // Example 1: Simple task execution
  console.log('1. Simple task execution:');

  // NOTE: We pass 'limit' as an argument because the worker DOES NOT share scope/variables.
  const limit = 10000000;

  const result = await tasklets.run((n) => {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += 1;
    }
    return sum;
  }, limit);

  console.log(`  Result: ${result}\n`);

  // Example 2: Error handling
  console.log('2. Error handling:');
  try {
    await tasklets.run(() => {
      throw new Error('This task failed intentionally');
    });
  } catch (error) {
    console.log(`  Task failed as expected: ${error.message}`);
  }
  console.log();

  // Example 3: Performance statistics
  console.log('3. Performance statistics:');
  console.log('  Current stats:', tasklets.getStats());
  console.log();

  // Example 5: Performance comparison
  console.log('5. Performance comparison:');

  const workAmount = 50000000;
  const iterations = 4;

  const doWork = (amt) => {
    let sum = 0;
    for (let j = 0; j < amt; j++) sum += 1;
    return sum;
  };

  // Synchronous
  console.log(`  -> Running ${iterations} tasks synchronously...`);
  const syncStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    doWork(workAmount);
  }
  const syncTime = Date.now() - syncStart;

  // Parallel
  console.log(`  -> Running ${iterations} tasks in parallel...`);
  const parallelStart = Date.now();
  const promises = [];
  for (let i = 0; i < iterations; i++) {
    // Pass workAmount as argument!
    promises.push(tasklets.run(doWork, workAmount));
  }
  await Promise.all(promises);
  const parallelTime = Date.now() - parallelStart;

  console.log(`  Synchronous time: ${syncTime}ms`);
  console.log(`  Parallel time:  ${parallelTime}ms`);

  // Clean up workers
  await tasklets.terminate();
}

runBasicExamples().catch(console.error);