/**
 * @file csv-processing.js
 * @description This example demonstrates how to process a large CSV file in parallel using Tasklets.
 * The script performs the following steps:
 * 1. Generates a sample CSV file with a specified number of rows.
 * 2. Reads the large CSV file and splits it into smaller chunks.
 * 3. Processes each chunk of data in parallel using `tasklets.runAll()`. Each tasklet calculates
 *  statistics for its assigned chunk.
 * 4. Aggregates the results from all chunks to get the final statistics for the entire file.
 * This is a practical example of how to handle I/O-bound and data-processing tasks concurrently.
 */
const tasklets = require('../../lib/tasklets');
const fs = require('fs');

console.log('Tasklets - CSV Processing Example\n');

// Generate sample CSV data for testing
function generateSampleCSV(filename, numRows = 10000) {
  const header = 'name,age,city,salary\n';
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  const names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Anna'];

  let csvData = header;
  for (let i = 0; i < numRows; i++) {
  const name = names[Math.floor(Math.random() * names.length)];
  const age = Math.floor(Math.random() * 50) + 20;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const salary = Math.floor(Math.random() * 80000) + 30000;
  csvData += `${name},${age},${city},${salary}\n`;
  }

  fs.writeFileSync(filename, csvData);
  console.log(`Generated ${filename} with ${numRows} rows`);
}

function processCsvChunk(csvChunk, chunkIndex) {
  const lines = csvChunk.split('\n');
  const records = [];

  for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line && i > 0) { // Skip header
  const [name, age, city, salary] = line.split(',');
  if (name && age && city && salary) {
  records.push({
  name: name.trim(),
  age: parseInt(age.trim()),
  city: city.trim(),
  salary: parseInt(salary.trim()),
  processed: true,
  chunkIndex
  });
  }
  }
  }

  // Calculate statistics for this chunk
  const avgSalary = records.reduce((sum, r) => sum + r.salary, 0) / records.length;
  const avgAge = records.reduce((sum, r) => sum + r.age, 0) / records.length;

  return {
  records,
  stats: {
  chunkIndex,
  count: records.length,
  avgSalary: Math.round(avgSalary),
  avgAge: Math.round(avgAge),
  cityCounts: records.reduce((acc, r) => {
  acc[r.city] = (acc[r.city] || 0) + 1;
  return acc;
  }, {})
  }
  };
}

async function processLargeCsv(filename) {
  console.log(`Processing ${filename}...`);

  const csvData = fs.readFileSync(filename, 'utf-8');
  const lines = csvData.split('\n');
  const header = lines[0];

  // Split into chunks of 1000 lines each
  const chunkSize = 1000;
  const chunks = [];

  for (let i = 1; i < lines.length; i += chunkSize) {
  const chunkLines = lines.slice(i, i + chunkSize);
  const chunk = header + '\n' + chunkLines.join('\n');
  chunks.push(chunk);
  }

  console.log(`Split into ${chunks.length} chunks of ~${chunkSize} lines each`);

  const startTime = Date.now();

  const results = await tasklets.runAll(
  chunks.map((chunk, index) =>
  () => processCsvChunk(chunk, index)
  )
  );

  const endTime = Date.now();

  const allRecords = results.flatMap(r => r.records);
  const allStats = results.map(r => r.stats);

  console.log(`Processed ${allRecords.length} records in ${endTime - startTime}ms`);

  // Aggregate statistics
  const totalSalary = allRecords.reduce((sum, r) => sum + r.salary, 0);
  const totalAge = allRecords.reduce((sum, r) => sum + r.age, 0);
  const cityTotals = allRecords.reduce((acc, r) => {
  acc[r.city] = (acc[r.city] || 0) + 1;
  return acc;
  }, {});

  console.log('\nAggregated Results:');
  console.log(`  Total records: ${allRecords.length}`);
  console.log(`  Average salary: $${Math.round(totalSalary / allRecords.length)}`);
  console.log(`  Average age: ${Math.round(totalAge / allRecords.length)}`);
  console.log('  City distribution:');
  Object.entries(cityTotals).forEach(([city, count]) => {
  console.log(`  ${city}: ${count} (${((count / allRecords.length) * 100).toFixed(1)}%)`);
  });

  console.log('\nChunk Statistics:');
  allStats.forEach(stat => {
  console.log(`  Chunk ${stat.chunkIndex}: ${stat.count} records, avg salary: $${stat.avgSalary}, avg age: ${stat.avgAge}`);
  });

  return allRecords;
}

// Run the example
(async () => {
  try {
  const filename = 'sample_data.csv';

  // Generate sample data
  generateSampleCSV(filename, 5000);

  // Process the CSV file
  await processLargeCsv(filename);

  // Clean up
  fs.unlinkSync(filename);
  console.log('\nCSV processing example completed!');
  } catch (error) {
  console.error('Error:', error.message);
  }
})(); 