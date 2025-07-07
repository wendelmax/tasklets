const tasklets = require('../../lib/tasklets');

console.log('Tasklets - JSON Transformation Example\n');

// Generate sample dataset
function generateSampleData(size = 10000) {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Anna', 'Chris', 'Emily'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];

  const data = [];
  for (let i = 0; i < size; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];

  data.push({
  id: i + 1,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
  birthDate: new Date(Date.now() - Math.random() * 30 * 365 * 24 * 60 * 60 * 1000).toISOString(),
  scores: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)),
  isActive: Math.random() > 0.2,
  department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'][Math.floor(Math.random() * 5)]
  });
  }

  return data;
}

function transformRecord(record) {
  const currentYear = new Date().getFullYear();
  const birthYear = new Date(record.birthDate).getFullYear();

  return {
  id: record.id,
  fullName: `${record.firstName} ${record.lastName}`,
  email: record.email.toLowerCase(),
  age: currentYear - birthYear,
  averageScore: record.scores.reduce((sum, score) => sum + score, 0) / record.scores.length,
  maxScore: Math.max(...record.scores),
  minScore: Math.min(...record.scores),
  isActive: record.isActive,
  department: record.department,
  grade: (() => {
  const avg = record.scores.reduce((sum, score) => sum + score, 0) / record.scores.length;
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
  })(),
  transformedAt: new Date().toISOString()
  };
}

async function transformDataset(dataset) {
  console.log(`Transforming dataset of ${dataset.length} records...`);

  const batchSize = 1000;
  const batches = [];

  for (let i = 0; i < dataset.length; i += batchSize) {
  batches.push(dataset.slice(i, i + batchSize));
  }

  console.log(`Split into ${batches.length} batches of ${batchSize} records each`);

  const startTime = Date.now();

  const results = await tasklets.runAll(
  batches.map((batch, index) => 
  () => {
  console.log(`  Processing batch ${index + 1}...`);
  return batch.map(record => transformRecord(record));
  }
  )
  );

  const transformedData = results.flat();
  const endTime = Date.now();

  console.log(`Transformed ${transformedData.length} records in ${endTime - startTime}ms`);

  return transformedData;
}

async function analyzeTransformedData(data) {
  console.log('\nAnalyzing transformed data in parallel...');

  const analysisPromises = [
  // Age distribution
  () => {
  const ageGroups = { '20-29': 0, '30-39': 0, '40-49': 0, '50+': 0 };
  data.forEach(record => {
  if (record.age < 30) ageGroups['20-29']++;
  else if (record.age < 40) ageGroups['30-39']++;
  else if (record.age < 50) ageGroups['40-49']++;
  else ageGroups['50+']++;
  });
  return { analysis: 'age-distribution', result: ageGroups };
  },

  // Department statistics
  () => {
  const deptStats = {};
  data.forEach(record => {
  if (!deptStats[record.department]) {
  deptStats[record.department] = {
  count: 0,
  totalScore: 0,
  activeCount: 0
  };
  }
  deptStats[record.department].count++;
  deptStats[record.department].totalScore += record.averageScore;
  if (record.isActive) deptStats[record.department].activeCount++;
  });

  Object.keys(deptStats).forEach(dept => {
  deptStats[dept].avgScore = deptStats[dept].totalScore / deptStats[dept].count;
  deptStats[dept].activeRate = deptStats[dept].activeCount / deptStats[dept].count;
  });

  return { analysis: 'department-stats', result: deptStats };
  },

  // Grade distribution
  () => {
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  data.forEach(record => {
  gradeDistribution[record.grade]++;
  });
  return { analysis: 'grade-distribution', result: gradeDistribution };
  },

  // Performance metrics
  () => {
  const scores = data.map(r => r.averageScore);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const sortedScores = scores.sort((a, b) => a - b);
  const median = sortedScores[Math.floor(sortedScores.length / 2)];

  return {
  analysis: 'performance-metrics',
  result: {
  mean: totalScore / scores.length,
  median,
  min: Math.min(...scores),
  max: Math.max(...scores),
  standardDeviation: Math.sqrt(
  scores.reduce((sum, score) => sum + Math.pow(score - (totalScore / scores.length), 2), 0) / scores.length
  )
  }
  };
  }
  ];

  const analysisResults = await tasklets.runAll(analysisPromises);

  console.log('\nAnalysis Results:');
  analysisResults.forEach(result => {
  console.log(`\n${result.analysis}:`);
  if (result.analysis === 'performance-metrics') {
  console.log(`  Mean: ${result.result.mean.toFixed(2)}`);
  console.log(`  Median: ${result.result.median.toFixed(2)}`);
  console.log(`  Min: ${result.result.min.toFixed(2)}`);
  console.log(`  Max: ${result.result.max.toFixed(2)}`);
  console.log(`  Std Dev: ${result.result.standardDeviation.toFixed(2)}`);
  } else {
  Object.entries(result.result).forEach(([key, value]) => {
  if (typeof value === 'object') {
  console.log(`  ${key}:`);
  Object.entries(value).forEach(([subKey, subValue]) => {
  console.log(`  ${subKey}: ${typeof subValue === 'number' ? subValue.toFixed(2) : subValue}`);
  });
  } else {
  console.log(`  ${key}: ${value}`);
  }
  });
  }
  });
}

// Run the example
(async () => {
  try {
  // Generate sample data
  const rawData = generateSampleData(5000);
  console.log(`Generated ${rawData.length} sample records`);

  // Transform the data
  const transformedData = await transformDataset(rawData);

  // Analyze the transformed data
  await analyzeTransformedData(transformedData);

  // Sample output
  console.log('\nSample transformed records:');
  transformedData.slice(0, 3).forEach((record, index) => {
  console.log(`\nRecord ${index + 1}:`);
  console.log(`  ID: ${record.id}`);
  console.log(`  Full Name: ${record.fullName}`);
  console.log(`  Email: ${record.email}`);
  console.log(`  Age: ${record.age}`);
  console.log(`  Average Score: ${record.averageScore.toFixed(2)}`);
  console.log(`  Grade: ${record.grade}`);
  console.log(`  Department: ${record.department}`);
  console.log(`  Active: ${record.isActive}`);
  });

  console.log('\nJSON transformation example completed!');
  } catch (error) {
  console.error('Error:', error.message);
  }
})(); 