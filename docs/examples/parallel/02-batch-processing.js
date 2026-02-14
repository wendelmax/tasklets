/**
 * @file batch-processing.js
 * @brief Example demonstrating batch processing with Tasklets
 */

const tasklets = require('../../../lib');

async function main() {
  console.log('--- Tasklets Batch Processing Example ---\n');

  // 1. Array of task configurations
  console.log('1. Executing a named batch of tasks:');
  const taskConfigs = [
    {
      name: 'heavy-sum', task: () => {
        let sum = 0;
        for (let i = 0; i < 1e7; i++) sum += i;
        return sum;
      }
    },
    { name: 'string-reverse', task: () => "Tasklets are fast!".split('').reverse().join('') },
    { name: 'random-walk', task: () => Math.random() > 0.5 ? 'Stepped Right' : 'Stepped Left' }
  ];

  // Note: batch() returns just the results array in the same order
  const results = await tasklets.batch(taskConfigs);

  console.log('\nBatch Results:');
  results.forEach((result, index) => {
    console.log(`  - ${taskConfigs[index].name}: ${result}`);
  });
  console.log();

  // 2. Simple array execution (polymorphic run/runAll)
  console.log('2. Using polymorphic run() for anonymous parallel tasks:');
  const anonymousTasks = [
    () => 2 + 2,
    () => 10 * 10,
    () => Math.sqrt(144)
  ];

  // run() can take an array just like runAll()
  const simpleResults = await tasklets.runAll(anonymousTasks);
  console.log('Simple Results:', simpleResults);

  console.log('\nBatch processing example completed successfully!');
  await tasklets.terminate();
}

main().catch(console.error);