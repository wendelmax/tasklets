/**
 * @file matrix-multiplication.js
 * @description Benchmark for matrix multiplication using Tasklets (Share-Nothing).
 */
const tasklets = require('../../../lib/index');

// Helper to create matrix (main thread)
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

async function parallelMatrixMultiplication() {
    console.log('\n--- Matrix Multiplication Example ---');
    const size = 300;
    console.log(`Creating ${size}x${size} matrices...`);
    const matrixA = createMatrix(size, size);
    const matrixB = createMatrix(size, size);

    console.log(`Multiplying ${size}x${size} matrices using row-parallel approach...`);
    const startTime = Date.now();

    // We need to pass the FULL matrices (or at least necessary parts) to each worker.
    // Workers do not share memory.
    // Optimization: For huge matrices, SharedArrayBuffer would be better, but for this demo
    // we will pass the rows and the full matrix B as arguments.

    const tasks = [];
    for (let i = 0; i < size; i++) {
        // Task context: { rowIndex, rowA, matrixB }
        const taskArgs = {
            rowIndex: i,
            rowA: matrixA[i],
            matrixB: matrixB
        };

        tasks.push({
            task: (data) => {
                const { rowIndex, rowA, matrixB } = data;
                const rowResult = new Array(matrixB[0].length);

                const bCols = matrixB[0].length;
                const bRows = matrixB.length;

                for (let j = 0; j < bCols; j++) {
                    let sum = 0;
                    for (let k = 0; k < bRows; k++) {
                        sum += rowA[k] * matrixB[k][j];
                    }
                    rowResult[j] = sum;
                }
                return { rowIndex, rowResult };
            },
            args: [taskArgs]
        });
    }

    const rowResults = await tasklets.runAll(tasks);

    const result = new Array(size);
    rowResults.forEach(({ rowIndex, rowResult }) => {
        result[rowIndex] = rowResult;
    });

    const endTime = Date.now();
    console.log(`Matrix multiplication completed in ${endTime - startTime}ms`);
    console.log(`Result matrix size: ${size}x${size}`);

    await tasklets.terminate();
}

parallelMatrixMultiplication().catch(console.error);
