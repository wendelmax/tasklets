/**
 * @file monte-carlo-pi.js
 * @description This example demonstrates the use of Tasklets to estimate the value of Pi using the Monte Carlo method.
 * It showcases several aspects of parallel computing:
 * - Parallel Pi Estimation: The main estimation is parallelized across multiple workers to speed up the computation.
 * - Convergence Analysis: It analyzes how the accuracy of the estimation improves as the number of iterations increases.
 * - Scalability Test: It tests how the performance scales with an increasing number of worker threads.
 * - Precision Comparison: It compares the standard Monte Carlo method with other sampling techniques like Stratified and Antithetic sampling.
 * This example is a classic demonstration of a CPU-bound, "embarrassingly parallel" problem.
 */
const tasklets = require('../../lib/tasklets');

console.log('Tasklets - Monte Carlo Pi Estimation Example\n');

function estimatePi(iterations) {
    let insideCircle = 0;

    for (let i = 0; i < iterations; i++) {
        const x = Math.random();
        const y = Math.random();

        if (x * x + y * y <= 1) {
            insideCircle++;
        }
    }

    return (4 * insideCircle) / iterations;
}

function estimatePiWithSampling(iterations, samples = 1000) {
    let insideCircle = 0;

    for (let i = 0; i < iterations; i++) {
        const x = Math.random();
        const y = Math.random();

        if (x * x + y * y <= 1) {
            insideCircle++;
        }

        // Yield occasionally for cooperative multitasking
        if (i % samples === 0) {
            // Quick yield simulation
            const start = Date.now();
            while (Date.now() - start < 0.1) {
            } // 0.1ms
        }
    }

    return (4 * insideCircle) / iterations;
}

async function parallelPiEstimation() {
    const totalIterations = 10000000;
    const numWorkers = 8;
    const iterationsPerWorker = totalIterations / numWorkers;

    console.log(`Estimating π using ${totalIterations} iterations across ${numWorkers} workers...`);
    const startTime = Date.now();

    const results = await tasklets.runAll(
        Array.from({length: numWorkers}, (_, i) => () => estimatePi(iterationsPerWorker))
    );

    const averageEstimate = results.reduce((sum, est) => sum + est, 0) / results.length;
    const endTime = Date.now();

    console.log(`\nResults:`);
    console.log(`Estimated π: ${averageEstimate.toFixed(10)}`);
    console.log(`Actual π: ${Math.PI.toFixed(10)}`);
    console.log(`Error: ${Math.abs(averageEstimate - Math.PI).toFixed(10)}`);
    console.log(`Accuracy: ${(100 - Math.abs(averageEstimate - Math.PI) / Math.PI * 100).toFixed(6)}%`);
    console.log(`Computed in ${endTime - startTime}ms`);

    console.log(`\nIndividual worker estimates:`);
    results.forEach((estimate, index) => {
        console.log(`  Worker ${index + 1}: ${estimate.toFixed(10)} (error: ${Math.abs(estimate - Math.PI).toFixed(10)})`);
    });

    return {averageEstimate, estimates: results, time: endTime - startTime};
}

async function convergenceAnalysis() {
    console.log('\nConvergence Analysis:');

    const iterationCounts = [100000, 500000, 1000000, 5000000, 10000000];
    const workers = 6;

    console.log('Analyzing how accuracy improves with more iterations...\n');

    const results = await Promise.all(
        iterationCounts.map(async (totalIterations) => {
            const iterationsPerWorker = totalIterations / workers;
            const startTime = Date.now();

            const estimates = await Promise.all(
                Array.from({length: workers}, () =>
                    tasklets.runAll(
                        Array.from({length: workers}, () => () => estimatePi(iterationsPerWorker))
                    )
                );

            const averageEstimate = estimates.reduce((sum, est) => sum + est, 0) / estimates.length;
            const endTime = Date.now();

            const error = Math.abs(averageEstimate - Math.PI);
            const accuracy = 100 - (error / Math.PI * 100);

            return {
                iterations: totalIterations,
                estimate: averageEstimate,
                error,
                accuracy,
                time: endTime - startTime
            };
        })
    );

    console.log('Convergence Results:');
    console.log('Iterations\t\tEstimate\t\tError\t\t\tAccuracy\t\tTime');
    console.log('----------\t\t--------\t\t-----\t\t\t--------\t\t----');

    results.forEach(result => {
        console.log(`${result.iterations.toLocaleString().padEnd(15)}\t${result.estimate.toFixed(8)}\t\t${result.error.toExponential(3)}\t\t${result.accuracy.toFixed(4)}%\t\t${result.time}ms`);
    });

    return results;
}

async function scalabilityTest() {
    console.log('\nScalability Test:');

    const iterationsPerTest = 5000000;
    const workerCounts = [1, 2, 4, 6, 8, 12, 16];

    console.log(`Testing with ${iterationsPerTest} iterations using different worker counts...\n`);

    const results = await Promise.all(
        workerCounts.map(async (numWorkers) => {
            const iterationsPerWorker = iterationsPerTest / numWorkers;
            const startTime = Date.now();

            const estimates = await tasklets.runAll(
                Array.from({length: numWorkers}, () => () => estimatePi(iterationsPerWorker))
            );

            const averageEstimate = estimates.reduce((sum, est) => sum + est, 0) / estimates.length;
            const endTime = Date.now();

            const error = Math.abs(averageEstimate - Math.PI);
            const throughput = iterationsPerTest / (endTime - startTime) * 1000; // iterations per second

            return {
                workers: numWorkers,
                estimate: averageEstimate,
                error,
                time: endTime - startTime,
                throughput
            };
        })
    );

    console.log('Scalability Results:');
    console.log('Workers\t\tTime (ms)\tThroughput (iter/s)\tSpeedup\t\tEfficiency\tError');
    console.log('-------\t\t---------\t-------------------\t-------\t\t----------\t-----');

    const baseTime = results[0].time;

    results.forEach(result => {
        const speedup = baseTime / result.time;
        const efficiency = speedup / result.workers;

        console.log(`${result.workers}\t\t${result.time}\t\t${result.throughput.toFixed(0).padStart(10)}\t\t${speedup.toFixed(2)}\t\t${(efficiency * 100).toFixed(1)}%\t\t${result.error.toExponential(3)}`);
    });

    return results;
}

async function precisionComparison() {
    console.log('\nPrecision Comparison with Different Methods:');

    const iterations = 2000000;
    const workers = 4;
    const iterationsPerWorker = iterations / workers;

    console.log(`Comparing different Monte Carlo approaches with ${iterations} iterations...\n`);

    const methods = [
        {
            name: 'Standard Monte Carlo',
            fn: () => estimatePi(iterationsPerWorker)
        },
        {
            name: 'Stratified Sampling',
            fn: () => {
                // Divide unit square into grid and sample uniformly from each cell
                const gridSize = Math.sqrt(iterationsPerWorker / 4);
                const cellSize = 1 / gridSize;
                let insideCircle = 0;

                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const samplesPerCell = Math.floor(iterationsPerWorker / (gridSize * gridSize));
                        for (let k = 0; k < samplesPerCell; k++) {
                            const x = (i + Math.random()) * cellSize;
                            const y = (j + Math.random()) * cellSize;

                            if (x * x + y * y <= 1) {
                                insideCircle++;
                            }
                        }
                    }
                }

                return (4 * insideCircle) / iterationsPerWorker;
            }
        },
        {
            name: 'Antithetic Sampling',
            fn: () => {
                let insideCircle = 0;
                const halfIterations = iterationsPerWorker / 2;

                for (let i = 0; i < halfIterations; i++) {
                    const x1 = Math.random();
                    const y1 = Math.random();
                    const x2 = 1 - x1;
                    const y2 = 1 - y1;

                    if (x1 * x1 + y1 * y1 <= 1) insideCircle++;
                    if (x2 * x2 + y2 * y2 <= 1) insideCircle++;
                }

                return (4 * insideCircle) / iterationsPerWorker;
            }
        }
    ];

    const results = await tasklets.runAll(
        methods.map(method => method.fn)
    );

    console.log('Method Comparison Results:');
    console.log('Method\t\t\t\tEstimate\t\tError\t\t\tStd Dev\t\t\tTime');
    console.log('------\t\t\t\t--------\t\t-----\t\t\t-------\t\t\t----');

    results.forEach(result => {
        console.log(`${result.method.padEnd(20)}\t\t${result.estimate.toFixed(8)}\t\t${result.error.toExponential(3)}\t\t${result.standardDeviation.toFixed(6)}\t\t${result.time}ms`);
    });

    return results;
}

// Run all examples
(async () => {
    try {
        await parallelPiEstimation();
        await convergenceAnalysis();
        await scalabilityTest();
        await precisionComparison();

        console.log('\nMonte Carlo Pi estimation example completed!');
    } catch (error) {
        console.error('Error:', error.message);
    }
})(); 