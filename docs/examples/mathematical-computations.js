const tasklets = require('../../lib/tasklets');

console.log('Tasklets - Mathematical & Scientific Computations\n');

// Mathematical utility functions
class MathUtils {
  // Calculate prime numbers using Sieve of Eratosthenes
  static sieveOfEratosthenes(n) {
  const sieve = new Array(n + 1).fill(true);
  sieve[0] = sieve[1] = false;

  for (let i = 2; i * i <= n; i++) {
  if (sieve[i]) {
  for (let j = i * i; j <= n; j += i) {
  sieve[j] = false;
  }
  }
  }

  return sieve.map((isPrime, index) => isPrime ? index : null).filter(x => x !== null);
  }

  // Calculate factorial
  static factorial(n) {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
  result *= i;
  }
  return result;
  }

  // Calculate Fibonacci with memoization
  static fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = this.fibonacci(n - 1, memo) + this.fibonacci(n - 2, memo);
  return memo[n];
  }

  // Calculate Pi using Leibniz formula
  static calculatePiLeibniz(iterations) {
  let pi = 0;
  for (let i = 0; i < iterations; i++) {
  pi += Math.pow(-1, i) / (2 * i + 1);
  }
  return 4 * pi;
  }

  // Calculate Pi using Monte Carlo method
  static calculatePiMonteCarlo(points) {
  let insideCircle = 0;
  for (let i = 0; i < points; i++) {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 2 - 1;
  if (x * x + y * y <= 1) {
  insideCircle++;
  }
  }
  return 4 * insideCircle / points;
  }

  // Matrix multiplication
  static matrixMultiply(a, b) {
  const rowsA = a.length;
  const colsA = a[0].length;
  const colsB = b[0].length;

  const result = Array(rowsA).fill().map(() => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
  for (let j = 0; j < colsB; j++) {
  for (let k = 0; k < colsA; k++) {
  result[i][j] += a[i][k] * b[k][j];
  }
  }
  }

  return result;
  }

  // Generate random matrix
  static generateMatrix(rows, cols) {
  return Array(rows).fill().map(() => 
  Array(cols).fill().map(() => Math.random() * 10)
  );
  }
}

(async () => {
// Example 1: Prime number generation
console.log('1. Prime Number Generation:');
const startPrimes = Date.now();

// Generate primes up to different limits in parallel
const primeLimits = [10000, 20000, 30000, 40000, 50000];
const primeResults = await tasklets.runAll(
  primeLimits.map(limit => () => {
  console.log(`  Calculating primes up to ${limit}...`);

  const primes = MathUtils.sieveOfEratosthenes(limit);

  return {
  limit,
  count: primes.length,
  largest: primes[primes.length - 1],
  primes: primes.slice(-5) // Last 5 primes
  };
  })
);

const primeTime = Date.now() - startPrimes;

console.log('  Prime number results:');
primeResults.forEach(result => {
  console.log(`  Up to ${result.limit}: ${result.count} primes, largest: ${result.largest}`);
  console.log(`  Last 5: [${result.primes.join(', ')}]`);
});
console.log(`  Total time: ${primeTime}ms\n`);

// Example 2: Factorial calculations
console.log('2. Factorial Calculations:');
const factorialNumbers = [1000, 2000, 3000, 4000, 5000];

const factorialResults = await tasklets.runAll(
  factorialNumbers.map(n => () => {
  console.log(`  Calculating factorial of ${n}...`);

  const result = MathUtils.factorial(n);

  // Convert to scientific notation for large numbers
  const scientific = result.toExponential(5);
  const digits = Math.floor(Math.log10(result)) + 1;

  return {
  n,
  result: scientific,
  digits,
  firstDigits: result.toString().substring(0, 10)
  };
  })
);

console.log('  Factorial results:');
factorialResults.forEach(result => {
  console.log(`  ${result.n}! = ${result.result} (${result.digits} digits)`);
  console.log(`  First 10 digits: ${result.firstDigits}...`);
});
console.log();

// Example 3: Pi calculation using different methods
console.log('3. Pi Calculation (Multiple Methods):');
const piMethods = [
  { name: 'Leibniz', iterations: 1000000 },
  { name: 'Monte Carlo', points: 1000000 },
  { name: 'Leibniz', iterations: 2000000 },
  { name: 'Monte Carlo', points: 2000000 }
];

const piResults = await tasklets.runAll(
  piMethods.map(method => () => {
  console.log(`  Calculating Pi using ${method.name} (${method.iterations || method.points} iterations)...`);

  let pi;
  if (method.name === 'Leibniz') {
  pi = MathUtils.calculatePiLeibniz(method.iterations);
  } else {
  pi = MathUtils.calculatePiMonteCarlo(method.points);
  }

  const error = Math.abs(pi - Math.PI);
  const accuracy = (1 - error / Math.PI) * 100;

  return {
  method: method.name,
  iterations: method.iterations || method.points,
  calculatedPi: pi,
  error: error,
  accuracy: accuracy
  };
  })
);

console.log('  Pi calculation results:');
piResults.forEach(result => {
  console.log(`  ${result.method} (${result.iterations} iterations):`);
  console.log(`  Calculated: ${result.calculatedPi.toFixed(10)}`);
  console.log(`  Error: ${result.error.toExponential(5)}`);
  console.log(`  Accuracy: ${result.accuracy.toFixed(3)}%`);
});
console.log();

// Example 4: Matrix Operations:
console.log('4. Matrix Operations:');
const matrixSizes = [100, 200, 300, 400, 500];

const matrixResults = await tasklets.runAll(
  matrixSizes.map(size => () => {
  console.log(`  Multiplying ${size}x${size} matrices...`);

  // Generate random matrices
  const matrixA = MathUtils.generateMatrix(size, size);
  const matrixB = MathUtils.generateMatrix(size, size);

  // Perform matrix multiplication
  const result = MathUtils.matrixMultiply(matrixA, matrixB);

  // Calculate some statistics
  const sum = result.reduce((rowSum, row) => 
  rowSum + row.reduce((colSum, val) => colSum + val, 0), 0
  );
  const avg = sum / (size * size);

  return {
  size,
  resultSum: sum,
  average: avg,
  dimensions: `${size}x${size}`
  };
  })
);

console.log('  Matrix multiplication results:');
matrixResults.forEach(result => {
  console.log(`  ${result.dimensions}: sum=${result.resultSum.toFixed(2)}, avg=${result.average.toFixed(4)}`);
});
console.log();

// Example 5: Complex mathematical series
console.log('5. Mathematical Series Calculations:');
const seriesConfigs = [
  { name: 'Harmonic Series', terms: 1000000, fn: n => 1/n },
  { name: 'Alternating Series', terms: 1000000, fn: n => Math.pow(-1, n+1) / n },
  { name: 'Geometric Series', terms: 1000000, fn: n => Math.pow(0.5, n) },
  { name: 'Power Series', terms: 1000000, fn: n => Math.pow(0.1, n) / n }
];

const seriesThreads = tasklets.spawnMany(seriesConfigs.length, (index) => {
  const config = seriesConfigs[index];
  console.log(`  Calculating ${config.name} (${config.terms} terms)...`);

  let sum = 0;
  for (let i = 1; i <= config.terms; i++) {
  sum += config.fn(i);

  // Cooperative yielding for long computations
  if (i % 100000 === 0) {
  tasklets.yield();
  }
  }

  return {
  name: config.name,
  terms: config.terms,
  sum: sum,
  convergence: Math.abs(sum) < Infinity ? 'Convergent' : 'Divergent'
  };
});

const seriesResults = await tasklets.joinMany(seriesThreads);

console.log('  Series calculation results:');
seriesResults.forEach(result => {
  console.log(`  ${result.name}: ${result.sum.toFixed(10)} (${result.convergence})`);
});
console.log();

// Example 6: Statistical computations
console.log('6. Statistical Computations:');
const dataSizes = [100000, 200000, 300000, 400000, 500000];

const statsThreads = tasklets.spawnMany(dataSizes.length, (index) => {
  const size = dataSizes[index];
  console.log(`  Computing statistics for ${size} data points...`);

  // Generate random data
  const data = Array(size).fill().map(() => Math.random() * 100);

  // Calculate statistics
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / size;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / size;
  const stdDev = Math.sqrt(variance);

  // Sort for median
  const sorted = data.sort((a, b) => a - b);
  const median = size % 2 === 0 
  ? (sorted[size/2 - 1] + sorted[size/2]) / 2 
  : sorted[Math.floor(size/2)];

  return {
  size,
  mean: mean.toFixed(4),
  median: median.toFixed(4),
  stdDev: stdDev.toFixed(4),
  variance: variance.toFixed(4)
  };
});

const statsResults = await tasklets.joinMany(statsThreads);

console.log('  Statistical results:');
statsResults.forEach(result => {
  console.log(`  ${result.size} points: mean=${result.mean}, median=${result.median}, std=${result.stdDev}`);
});
console.log();

// Example 7: Performance analysis
console.log('7. Performance Analysis:');
const finalStats = tasklets.getStats();

console.log('  Virtual threads performance:');
console.log(`  Total fibers created: ${finalStats.totalFibers}`);
console.log(`  Active fibers: ${finalStats.activeFibers}`);
console.log(`