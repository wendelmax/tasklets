/**
 * @file data-processing.js
 * @description This example demonstrates parallel data processing using Tasklets.
 * It performs the following steps:
 * 1. Generates a sample dataset.
 * 2. Processes the dataset in chunks, first sequentially and then in parallel, to compare performance.
 * 3. After processing, it performs data aggregation, both sequentially and in parallel, to showcase
 *  different approaches to summarizing the data.
 * This example is useful for understanding how to parallelize data-intensive workloads.
 */
const tasklets = require('../../../lib');

console.log('Tasklets - Data Processing Example\n');

// Generate sample dataset
function generateDataset(size) {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    value: Math.random() * 1000,
    category: Math.floor(Math.random() * 10),
    timestamp: Date.now() - Math.random() * 86400000 // Last 24 hours
  }));
}

// Data processing function
function processDataChunk(data, chunkIndex) {
  console.log(`  Processing chunk ${chunkIndex} with ${data.length} items...`);

  const processed = data.map(item => ({
    ...item,
    processedValue: Math.sqrt(item.value) + Math.sin(item.value) + Math.cos(item.value),
    processed: true,
    chunkIndex
  }));

  // Simulate some computation time
  for (let i = 0; i < 100000; i++) {
    Math.sqrt(i);
  }

  return processed;
}

(async () => {
  // Example 1: Sequential data processing
  console.log('1. Sequential data processing:');
  const dataset = generateDataset(100000);
  console.log(`  Dataset size: ${dataset.length} items`);

  const startSeq = Date.now();
  const chunkSize = 10000;
  const chunks = [];

  for (let i = 0; i < dataset.length; i += chunkSize) {
    chunks.push(dataset.slice(i, i + chunkSize));
  }

  const sequentialResults = await Promise.all(chunks.map((chunk, index) => processDataChunk(chunk, index)));
  const seqTime = Date.now() - startSeq;

  console.log(`  Sequential processing time: ${seqTime}ms`);
  console.log(`  Processed ${sequentialResults.flat().length} items\n`);

  // Example 2: Parallel data processing with tasklets
  console.log('2. Parallel data processing with tasklets:');
  const startPar = Date.now();

  const parallelResults = await tasklets.runAll(
    chunks.map((chunk, index) => () => processDataChunk(chunk, index))
  );

  const parTime = Date.now() - startPar;

  console.log(`  Parallel processing time: ${parTime}ms`);
  console.log(`  Processed ${parallelResults.flat().length} items`);
  console.log(`  Speedup: ${(seqTime / parTime).toFixed(2)}x\n`);

  // Example 3: Data aggregation
  console.log('3. Data aggregation:');
  const allProcessedData = parallelResults.flat();

  // Aggregate by category
  const categoryStats = {};
  allProcessedData.forEach(item => {
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = {
        count: 0,
        totalValue: 0,
        totalProcessedValue: 0
      };
    }
    categoryStats[item.category].count++;
    categoryStats[item.category].totalValue += item.value;
    categoryStats[item.category].totalProcessedValue += item.processedValue;
  });

  console.log('  Category statistics:');
  Object.entries(categoryStats).forEach(([category, stats]) => {
    console.log(`  Category ${category}: ${stats.count} items, avg value: ${(stats.totalValue / stats.count).toFixed(2)}`);
  });

  // Example 4: Parallel data aggregation
  console.log('4. Parallel data aggregation:');
  const categories = Array.from(new Set(allProcessedData.map(item => item.category)));

  const aggregationResults = await tasklets.runAll(
    categories.map(category => () => {
      const categoryData = allProcessedData.filter(item => item.category === category);

      const stats = {
        category,
        count: categoryData.length,
        totalValue: categoryData.reduce((sum, item) => sum + item.value, 0),
        totalProcessedValue: categoryData.reduce((sum, item) => sum + item.processedValue, 0),
        minValue: Math.min(...categoryData.map(item => item.value)),
        maxValue: Math.max(...categoryData.map(item => item.value))
      };

      stats.averageValue = stats.totalValue / stats.count;
      stats.averageProcessedValue = stats.totalProcessedValue / stats.count;

      return stats;
    })
  );

  console.log('  Parallel aggregation results:');
  aggregationResults.forEach(stats => {
    console.log(`  Category ${stats.category}: ${stats.count} items, avg: ${stats.averageValue.toFixed(2)}`);
  });

  // Example 5: Performance monitoring
  console.log('5. Performance monitoring:');
  const finalStats = tasklets.getStats();
  console.log(`  Active tasklets: ${finalStats.activeTasklets || 0}`);
  console.log(`  Total tasklets created: ${finalStats.totalTaskletsCreated || 0}`);
  console.log(`  Completed tasklets: ${finalStats.completedTasklets || 0}`);
  console.log(`  Success rate: ${finalStats.successRate ? finalStats.successRate.toFixed(1) : 'N/A'}%`);

  // Example 6: Memory usage estimation
  console.log('6. Memory usage estimation:');
  const estimatedMemoryPerThread = 65536; // 64KB default stack
  const totalMemoryUsed = (finalStats.totalTaskletsCreated || 0) * estimatedMemoryPerThread;
  console.log(`  Estimated memory used: ${(totalMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Memory per tasklet: ${(estimatedMemoryPerThread / 1024).toFixed(1)}KB`);

  // Example 7: Performance summary
  console.log('\n7. Performance summary:');
  console.log(`  Dataset size: ${dataset.length} items`);
  console.log(`  Chunks processed: ${chunks.length}`);
  console.log(`  Sequential time: ${seqTime}ms`);
  console.log(`  Parallel time: ${parTime}ms`);
  console.log(`  Speedup: ${(seqTime / parTime).toFixed(2)}x`);
  console.log(`  Efficiency: ${((seqTime / parTime) / chunks.length * 100).toFixed(1)}%`);
  console.log(`  Items processed per second: ${Math.round(dataset.length / (parTime / 1000))}`);

  console.log('\nData processing example completed!');
})(); 