/**
 * @file matrix-multiplication.js
 * @description Benchmark for matrix multiplication using Tasklets.
 */
const tasklets = require('../../../lib');

function createMatrix(rows, cols) {
  const matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    matrix[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      matrix[i][j] = Math.random();
    }
  }
  return matrix;
}

function multiplyMatrixRow(matrixA, matrixB, rowIndex) {
  const row = new Array(matrixB[0].length);
  for (let j = 0; j < matrixB[0].length; j++) {
    let sum = 0;
    for (let k = 0; k < matrixB.length; k++) {
      sum += matrixA[rowIndex][k] * matrixB[k][j];
    }
    row[j] = sum;
  }
  return { rowIndex, row };
}

async function parallelMatrixMultiplication() {
  console.log('\nParallel Matrix Multiplication (Row-by-Row):');
  const size = 300;
  console.log(`Creating ${size}x${size} matrices...`);
  const matrixA = createMatrix(size, size);
  const matrixB = createMatrix(size, size);

  console.log(`Multiplying ${size}x${size} matrices using row-parallel approach...`);
  const startTime = Date.now();

  const rowResults = await tasklets.runAll(
    Array.from({ length: size }, (_, i) =>
      () => multiplyMatrixRow(matrixA, matrixB, i)
    )
  );

  const result = new Array(size);
  rowResults.forEach(({ rowIndex, row }) => {
    result[rowIndex] = row;
  });

  const endTime = Date.now();
  console.log(`Matrix multiplication completed in ${endTime - startTime}ms`);
  console.log(`Result matrix size: ${size}x${size}`);
  return { result, time: endTime - startTime };
}

async function performanceComparison() {
  console.log('\nPerformance Comparison:');
  const sizes = [100, 200, 300, 400];
  const results = [];

  for (const size of sizes) {
    console.log(`\nTesting ${size}x${size} matrices:`);
    const matrixA = createMatrix(size, size);
    const matrixB = createMatrix(size, size);

    // Sequential multiplication (simulated in one tasklet for fairness in infra)
    const seqStart = Date.now();
    await tasklets.run(() => {
      const res = new Array(size);
      for (let i = 0; i < size; i++) {
        const row = new Array(matrixB[0].length);
        for (let j = 0; j < matrixB[0].length; j++) {
          let sum = 0;
          for (let k = 0; k < matrixB.length; k++) {
            sum += matrixA[i][k] * matrixB[k][j];
          }
          row[j] = sum;
        }
        res[i] = row;
      }
      return true;
    });
    const seqTime = Date.now() - seqStart;

    // Parallel multiplication
    const parStart = Date.now();
    await tasklets.runAll(
      Array.from({ length: size }, (_, i) =>
        () => multiplyMatrixRow(matrixA, matrixB, i)
      )
    );
    const parTime = Date.now() - parStart;

    const speedup = seqTime / parTime;
    results.push({ size, sequentialTime: seqTime, parallelTime: parTime, speedup });

    console.log(`  Sequential: ${seqTime}ms`);
    console.log(`  Parallel: ${parTime}ms`);
    console.log(`  Speedup: ${speedup.toFixed(2)}x`);
  }

  console.log('\nPerformance Summary:');
  console.log('Size\t\tSequential\tParallel\tSpeedup');
  console.log('----\t\t----------\t--------\t-------');
  results.forEach(r => {
    console.log(`${r.size}x${r.size}\t\t${r.sequentialTime}ms\t\t${r.parallelTime}ms\t\t${r.speedup.toFixed(2)}x`);
  });
}

(async () => {
  try {
    await parallelMatrixMultiplication();
    await performanceComparison();
    console.log('\nMatrix multiplication example completed!');
  } catch (error) {
    console.error('Error:', error);
  }
})();