/**
 * Clean Shutdown Example
 * 
 * This example demonstrates how to properly shutdown the tasklets system
 * to ensure the Node.js process exits cleanly after all work is complete.
 */

const Tasklets = require('../../lib/api/tasklets');

async function main() {
  const tasklets = new Tasklets();
  
  console.log('Starting clean shutdown example...');
  
  // Spawn some tasklets
  const task1 = tasklets.spawn(() => {
    console.log('Task 1: Computing fibonacci(10)');
    let a = 0, b = 1;
    for (let i = 0; i < 10; i++) {
      [a, b] = [b, a + b];
    }
    return a;
  });
  
  const task2 = tasklets.spawn(() => {
    console.log('Task 2: Computing prime numbers');
    const primes = [];
    for (let i = 2; i <= 20; i++) {
      let isPrime = true;
      for (let j = 2; j < i; j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes.push(i);
    }
    return primes;
  });
  
  // Wait for all tasklets to complete
  console.log('Waiting for tasklets to complete...');
  await tasklets.joinMany([task1, task2]);
  
  // Get results
  const result1 = tasklets.getResult(task1);
  const result2 = tasklets.getResult(task2);
  
  console.log('Task 1 result:', result1);
  console.log('Task 2 result:', result2);
  
  // Properly shutdown the system
  console.log('Shutting down tasklets system...');
  await tasklets.shutdown();
  
  console.log('Shutdown complete - process should exit now');
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the example
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 