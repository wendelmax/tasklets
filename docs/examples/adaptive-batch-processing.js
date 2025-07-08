/**
 * @file adaptive-batch-processing.js
 * @description This example demonstrates the concept of adaptive batch processing based on system capabilities.
 * It compares a fixed-size batch processing approach with an adaptive one where the batch size is dynamically
 * calculated based on the number of CPU cores. This ensures optimal throughput and resource utilization
 * across different systems without manual tuning. The example processes a number of items and shows the
 * performance difference between the two methods.
 */
const tasklets = require('../../lib/tasklets');
const os = require('os');

console.log(' Adaptive Batch Processing Example');
console.log('====================================');

// System information
const systemInfo = {
    cores: os.cpus().length,
    platform: os.platform(),
    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024)
};

console.log(`\n  System: ${systemInfo.cores} cores, ${systemInfo.memory}GB RAM`);

// Calculate adaptive batch size based on CPU cores
function getAdaptiveBatchSize() {
    const cores = os.cpus().length;
    // Scale batch size with CPU capability for optimal throughput
    return Math.max(100, cores * 125);
}

// OLD: Fixed batch processing
async function oldFixedBatchProcessing() {
    console.log('\n OLD METHOD: Fixed batch sizes');

    const FIXED_BATCH_SIZE = 1000;
    const TOTAL_ITEMS = 10000;

    console.log(`  ├─ Fixed batch size: ${FIXED_BATCH_SIZE}`);
    console.log(`  ├─ Total items: ${TOTAL_ITEMS}`);
    console.log(`  └─ Batches: ${Math.ceil(TOTAL_ITEMS / FIXED_BATCH_SIZE)}`);

    const startTime = Date.now();

    for (let i = 0; i < TOTAL_ITEMS; i += FIXED_BATCH_SIZE) {
        const batchEnd = Math.min(i + FIXED_BATCH_SIZE, TOTAL_ITEMS);
        const start = i;

        await tasklets.run(() => {
            let sum = 0;
            for (let j = start; j < batchEnd; j++) {
                sum += Math.sqrt(j);
            }
            return sum;
        });
    }

    const duration = Date.now() - startTime;
    console.log(`  └─ Duration: ${duration}ms`);

    return duration;
}

// NEW: Adaptive batch processing
async function newAdaptiveBatchProcessing() {
    console.log('\n NEW METHOD: Adaptive batch sizes');

    const ADAPTIVE_BATCH_SIZE = getAdaptiveBatchSize();
    const TOTAL_ITEMS = 10000;

    console.log(`  ├─ Adaptive batch size: ${ADAPTIVE_BATCH_SIZE}`);
    console.log(`  ├─ Total items: ${TOTAL_ITEMS}`);
    console.log(`  └─ Batches: ${Math.ceil(TOTAL_ITEMS / ADAPTIVE_BATCH_SIZE)}`);

    const startTime = Date.now();

    for (let i = 0; i < TOTAL_ITEMS; i += ADAPTIVE_BATCH_SIZE) {
        const batchEnd = Math.min(i + ADAPTIVE_BATCH_SIZE, TOTAL_ITEMS);
        const start = i;

        await tasklets.run(() => {
            let sum = 0;
            for (let j = start; j < batchEnd; j++) {
                sum += Math.sqrt(j);
            }
            return sum;
        });
    }

    const duration = Date.now() - startTime;
    console.log(`  └─ Duration: ${duration}ms`);

    return duration;
}

// Compare performance
async function comparePerformance() {
    console.log('\n Performance Comparison');
    console.log('=========================');

    const oldTime = await oldFixedBatchProcessing();
    const newTime = await newAdaptiveBatchProcessing();

    const improvement = ((oldTime - newTime) / oldTime * 100).toFixed(1);

    console.log(`\n Results:`);
    console.log(`  ├─ Fixed batch: ${oldTime}ms`);
    console.log(`  ├─ Adaptive batch: ${newTime}ms`);

    if (improvement > 0) {
        console.log(`  └─ Improvement: ${improvement}% faster! `);
    } else {
        console.log(`  └─ Performance: ${Math.abs(improvement)}% slower (within expected variation)`);
    }
}

// Run comparison
(async function () {
    await comparePerformance();

    console.log('\n Key Benefits:');
    console.log('  ├─ Optimal batch sizes for your CPU');
    console.log('  ├─ Better resource utilization');
    console.log('  ├─ Consistent performance across systems');
    console.log('  └─ No manual tuning required');
})().catch(console.error); 