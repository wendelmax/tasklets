/**
 * @file matrix-multiplication.js
 * @description This example demonstrates how to perform matrix multiplication and other matrix operations in parallel using Tasklets.
 * It showcases different strategies for parallelization:
 * - Row-parallel multiplication: Each row of the resulting matrix is computed in a separate task.
 * - Block-parallel multiplication: The matrix is divided into blocks, and each block is processed in a separate task.
 * The example also includes a performance comparison between sequential and parallel matrix multiplication,
 * as well as demonstrations of other operations like addition, subtraction, and transposition.
 * This is a good example of how to handle CPU-bound, highly parallelizable tasks.
 */
const tasklets = require('../../lib/tasklets');

console.log('Tasklets - Matrix Multiplication Example\n');

function createMatrix(rows, cols, fillValue = null) {
    if (fillValue === null) {
        return Array.from({length: rows}, () =>
            Array.from({length: cols}, () => Math.random() * 10)
        );
    } else if (typeof fillValue === 'function') {
        return Array.from({length: rows}, (_, i) =>
            Array.from({length: cols}, (_, j) => fillValue(i, j))
        );
    } else {
        return Array.from({length: rows}, () =>
            Array.from({length: cols}, () => fillValue)
        );
    }
}

function createIdentityMatrix(size) {
    return createMatrix(size, size, (i, j) => i === j ? 1 : 0);
}

function multiplyMatrixRow(matrixA, matrixB, rowIndex) {
    const cols = matrixB[0].length;
    const result = [];

    for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let k = 0; k < matrixB.length; k++) {
            sum += matrixA[rowIndex][k] * matrixB[k][j];
        }
        result.push(sum);
    }

    return {rowIndex, row: result};
}

function multiplyMatrixBlock(matrixA, matrixB, startRow, endRow) {
    const result = [];
    const cols = matrixB[0].length;

    for (let i = startRow; i < endRow; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            let sum = 0;
            for (let k = 0; k < matrixB.length; k++) {
                sum += matrixA[i][k] * matrixB[k][j];
            }
            row.push(sum);
        }
        result.push({rowIndex: i, row});
    }

    return result;
}

async function parallelMatrixMultiplication() {
    const size = 300;
    console.log(`Creating ${size}x${size} matrices...`);

    const matrixA = createMatrix(size, size);
    const matrixB = createMatrix(size, size);

    console.log(`Multiplying ${size}x${size} matrices using row-parallel approach...`);
    const startTime = Date.now();

    const results = await tasklets.runAll(
        Array.from({length: matrixA.length}, (_, i) =>
            () => multiplyMatrixRow(matrixA, matrixB, i)
        )
    );

    // Reconstruct result matrix
    const result = new Array(size);
    results.forEach(({rowIndex, row}) => {
        result[rowIndex] = row;
    });

    const endTime = Date.now();

    console.log(`Matrix multiplication completed in ${endTime - startTime}ms`);
    console.log(`Result matrix size: ${result.length}x${result[0].length}`);

    // Verify a small portion of the result
    console.log(`Sample result values: [${result[0].slice(0, 3).map(v => v.toFixed(2)).join(', ')}...]`);

    return {result, time: endTime - startTime};
}

async function blockParallelMultiplication() {
    const size = 400;
    const blockSize = 50; // Process 50 rows per block

    console.log(`\nBlock-parallel multiplication (${size}x${size}, block size: ${blockSize})...`);

    const matrixA = createMatrix(size, size);
    const matrixB = createMatrix(size, size);

    const startTime = Date.now();

    const blocks = [];
    for (let i = 0; i < size; i += blockSize) {
        const endRow = Math.min(i + blockSize, size);
        blocks.push({startRow: i, endRow});
    }

    const results = await tasklets.runAll(
        blocks.map(chunk =>
            () => multiplyMatrixBlock(matrixA, matrixB, chunk.startRow, chunk.endRow)
        )
    );

    // Reconstruct result matrix
    const result = new Array(size);
    results.forEach(blockResult => {
        blockResult.forEach(({rowIndex, row}) => {
            result[rowIndex] = row;
        });
    });

    const endTime = Date.now();

    console.log(`Block-parallel multiplication completed in ${endTime - startTime}ms`);
    console.log(`Processed ${blocks.length} blocks of ${blockSize} rows each`);

    return {result, time: endTime - startTime, blocks: blocks.length};
}

async function performanceComparison() {
    console.log('\nPerformance Comparison:');

    const sizes = [100, 200, 300, 400];
    const results = [];

    for (const size of sizes) {
        console.log(`\nTesting ${size}x${size} matrices:`);

        const matrixA = createMatrix(size, size);
        const matrixB = createMatrix(size, size);

        // Sequential multiplication (simulated)
        const seqStart = Date.now();
        // We'll simulate sequential by using a single tasklet
        await tasklets.run(() => {
            const result = new Array(size);
            for (let i = 0; i < size; i++) {
                const row = [];
                for (let j = 0; j < matrixB[0].length; j++) {
                    let sum = 0;
                    for (let k = 0; k < matrixB.length; k++) {
                        sum += matrixA[i][k] * matrixB[k][j];
                    }
                    row.push(sum);
                }
                result[i] = row;
            }
            return result;
        });
        const seqTime = Date.now() - seqStart;

        // Parallel multiplication
        const parStart = Date.now();
        const rowResults = await tasklets.runAll(
            Array.from({length: size}, (_, i) =>
                () => multiplyMatrixRow(matrixA, matrixB, i)
            )
        );
        const parTime = Date.now() - parStart;

        const speedup = seqTime / parTime;

        results.push({
            size,
            sequentialTime: seqTime,
            parallelTime: parTime,
            speedup
        });

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

    return results;
}

async function matrixOperations() {
    console.log('\nMatrix Operations Example:');

    const size = 200;
    const matrixA = createMatrix(size, size);
    const matrixB = createMatrix(size, size);
    const matrixC = createMatrix(size, size);

    console.log(`Performing various operations on ${size}x${size} matrices...`);

    const operations = [
        {
            name: 'Matrix Addition',
            operation: () => tasklets.run(() => {
                const result = new Array(size);
                for (let i = 0; i < size; i++) {
                    result[i] = new Array(size);
                    for (let j = 0; j < size; j++) {
                        result[i][j] = matrixA[i][j] + matrixB[i][j];
                    }
                }
                return result;
            })
        },
        {
            name: 'Matrix Subtraction',
            operation: () => tasklets.run(() => {
                const result = new Array(size);
                for (let i = 0; i < size; i++) {
                    result[i] = new Array(size);
                    for (let j = 0; j < size; j++) {
                        result[i][j] = matrixA[i][j] - matrixB[i][j];
                    }
                }
                return result;
            })
        },
        {
            name: 'Element-wise Multiplication',
            operation: () => tasklets.run(() => {
                const result = new Array(size);
                for (let i = 0; i < size; i++) {
                    result[i] = new Array(size);
                    for (let j = 0; j < size; j++) {
                        result[i][j] = matrixA[i][j] * matrixB[i][j];
                    }
                }
                return result;
            })
        },
        {
            name: 'Matrix Transpose',
            operation: () => tasklets.run(() => {
                const result = new Array(size);
                for (let i = 0; i < size; i++) {
                    result[i] = new Array(size);
                    for (let j = 0; j < size; j++) {
                        result[i][j] = matrixA[j][i];
                    }
                }
                return result;
            })
        },
        {
            name: 'Scalar Multiplication',
            operation: () => tasklets.run(() => {
                const scalar = 2.5;
                const result = new Array(size);
                for (let i = 0; i < size; i++) {
                    result[i] = new Array(size);
                    for (let j = 0; j < size; j++) {
                        result[i][j] = matrixA[i][j] * scalar;
                    }
                }
                return result;
            })
        }
    ];

    const results = await Promise.all(
        operations.map(async (op) => {
            const startTime = Date.now();
            const result = await op.operation();
            const endTime = Date.now();

            return {
                name: op.name,
                time: endTime - startTime,
                sampleResult: result[0][0].toFixed(4)
            };
        })
    );

    console.log('\nOperation Results:');
    results.forEach(result => {
        console.log(`  ${result.name}: ${result.time}ms (sample: ${result.sampleResult})`);
    });

    return results;
}

async function chainedMatrixOperations() {
    console.log('\nChained Matrix Operations:');

    const size = 150;
    console.log(`Performing chained operations: (A * B) + (C * D) on ${size}x${size} matrices...`);

    const matrixA = createMatrix(size, size);
    const matrixB = createMatrix(size, size);
    const matrixC = createMatrix(size, size);
    const matrixD = createMatrix(size, size);

    const startTime = Date.now();

    // Perform two multiplications in parallel
    const [productAB, productCD] = await Promise.all([
        // A * B
        tasklets.runAll(
            Array.from({length: size}, (_, i) =>
                () => multiplyMatrixRow(matrixA, matrixB, i)
            )
        ).then(rowResults => {
            const result = new Array(size);
            rowResults.forEach(({rowIndex, row}) => {
                result[rowIndex] = row;
            });
            return result;
        }),

        // C * D
        tasklets.runAll(
            Array.from({length: size}, (_, i) =>
                () => multiplyMatrixRow(matrixC, matrixD, i)
            )
        ).then(rowResults => {
            const result = new Array(size);
            rowResults.forEach(({rowIndex, row}) => {
                result[rowIndex] = row;
            });
            return result;
        })
    ]);

    // Add the results in parallel (by rows)
    const finalResult = await tasklets.runAll(
        Array.from({length: size}, (_, i) =>
            () => {
                const row = new Array(size);
                for (let j = 0; j < size; j++) {
                    row[j] = productAB[i][j] + productCD[i][j];
                }
                return {rowIndex: i, row};
            }
        )
    );

    // Reconstruct final matrix
    const result = new Array(size);
    finalResult.forEach(({rowIndex, row}) => {
        result[rowIndex] = row;
    });

    const endTime = Date.now();

    console.log(`Chained operations completed in ${endTime - startTime}ms`);
    console.log(`Final result sample: ${result[0][0].toFixed(4)}`);

    return {result, time: endTime - startTime};
}

// Run all examples
(async () => {
    try {
        await parallelMatrixMultiplication();
        await blockParallelMultiplication();
        await performanceComparison();
        await matrixOperations();
        await chainedMatrixOperations();

        console.log('\nMatrix multiplication example completed!');
    } catch (error) {
        console.error('Error:', error.message);
    }
})(); 