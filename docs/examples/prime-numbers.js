/**
 * @file prime-numbers.js
 * @description This example demonstrates how to find prime numbers in parallel using Tasklets.
 * It includes two main scenarios:
 * 1. Finding all prime numbers within a set of given ranges. The ranges are processed in parallel.
 * 2. Checking the primality of a list of large numbers, with each check performed in parallel.
 * This is a classic example of a CPU-bound task that can be significantly sped up through parallelization.
 */
const tasklets = require('../../lib/tasklets');

console.log('Tasklets - Prime Numbers Example\n');

function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;

  for (let i = 5; i * i <= n; i += 6) {
  if (n % i === 0 || n % (i + 2) === 0) {
  return false;
  }
  }
  return true;
}

function findPrimesInRange(start, end) {
  const primes = [];
  for (let i = start; i <= end; i++) {
  if (isPrime(i)) {
  primes.push(i);
  }
  }
  return primes;
}

async function findPrimesParallel() {
  const ranges = [
  [1, 1000],
  [1001, 2000],
  [2001, 3000],
  [3001, 4000],
  [4001, 5000]
  ];

  console.log('Finding prime numbers in parallel...');
  const startTime = Date.now();

  const results = await tasklets.runAll(
  ranges.map(chunk =>
  () => findPrimesInRange(chunk.start, chunk.end)
  )
  );

  const allPrimes = results.flat();
  const endTime = Date.now();

  console.log(`Found ${allPrimes.length} primes in ${endTime - startTime}ms`);

  // Display results summary
  results.forEach((primes, index) => {
  const [start, end] = ranges[index];
  console.log(`Range ${start}-${end}: ${primes.length} primes`);
  console.log(`  First 5: [${primes.slice(0, 5).join(', ')}]`);
  console.log(`  Last 5: [${primes.slice(-5).join(', ')}]`);
  });
}

async function findLargePrimes() {
  console.log('\nFinding large prime numbers...');
  const candidates = [982451653, 982451654, 982451655, 982451656, 982451657];

  const startTime = Date.now();

  const results = await tasklets.runAll(
  candidates.map(num => () => ({
  number: num,
  isPrime: isPrime(num)
  }))
  );

  const endTime = Date.now();

  console.log(`Checked ${candidates.length} large numbers in ${endTime - startTime}ms`);
  results.forEach(result => {
  console.log(`${result.number}: ${result.isPrime ? 'PRIME' : 'NOT PRIME'}`);
  });
}

// Run the examples
(async () => {
  await findPrimesParallel();
  await findLargePrimes();
  console.log('\nPrime numbers example completed!');
})().catch(console.error); 