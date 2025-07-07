const tasklets = require('../../lib/tasklets');
const fs = require('fs');
const path = require('path');

console.log('Tasklets - File Analysis Example\n');

// Generate sample files for testing
function generateSampleFiles(directory, count = 10) {
  if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
  }

  const fileTypes = ['.txt', '.js', '.json', '.md', '.log'];
  const generatedFiles = [];

  for (let i = 0; i < count; i++) {
  const ext = fileTypes[Math.floor(Math.random() * fileTypes.length)];
  const filename = `sample_file_${i + 1}${ext}`;
  const filepath = path.join(directory, filename);

  // Generate random content
  const contentSize = Math.floor(Math.random() * 5000) + 100; // 100-5100 chars
  let content = '';

  if (ext === '.json') {
  content = JSON.stringify({
  id: i + 1,
  name: `Sample ${i + 1}`,
  data: Array.from({ length: 10 }, (_, j) => ({ key: `value_${j}`, number: Math.random() * 100 })),
  timestamp: new Date().toISOString()
  }, null, 2);
  } else if (ext === '.js') {
  content = `// Sample JavaScript file ${i + 1}\n`;
  content += `function sample${i + 1}() {\n`;
  content += `  console.log('This is sample function ${i + 1}');\n`;
  content += `  return ${Math.random() * 100};\n`;
  content += `}\n\n`;
  content += `module.exports = sample${i + 1};\n`;
  } else if (ext === '.md') {
  content = `# Sample Markdown ${i + 1}\n\n`;
  content += `This is a sample markdown file with some content.\n\n`;
  content += `## Features\n- Feature 1\n- Feature 2\n- Feature 3\n\n`;
  content += `## Code Example\n\`\`\`javascript\nconsole.log('Hello World');\n\`\`\`\n`;
  } else if (ext === '.log') {
  const logEntries = Math.floor(Math.random() * 50) + 10;
  for (let j = 0; j < logEntries; j++) {
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const timestamp = new Date(Date.now() - Math.random() * 86400000).toISOString();
  content += `${timestamp} [${level}] Sample log entry ${j + 1}\n`;
  }
  } else {
  // .txt files
  const words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
  const wordCount = Math.floor(contentSize / 6);
  for (let j = 0; j < wordCount; j++) {
  content += words[Math.floor(Math.random() * words.length)] + ' ';
  if (j % 15 === 0) content += '\n';
  }
  }

  fs.writeFileSync(filepath, content);
  generatedFiles.push(filepath);
  }

  console.log(`Generated ${generatedFiles.length} sample files in ${directory}`);
  return generatedFiles;
}

function analyzeFile(filename) {
  try {
  const startTime = Date.now();
  const stats = fs.statSync(filename);

  if (!stats.isFile()) {
  return {
  filename,
  error: 'Not a file'
  };
  }

  const content = fs.readFileSync(filename, 'utf-8');
  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(word => word.length > 0);

  // Basic analysis
  const extension = path.extname(filename).toLowerCase();
  const analysis = {
  filename,
  extension,
  size: stats.size,
  lines: lines.length,
  words: words.length,
  characters: content.length,
  modified: stats.mtime,
  created: stats.birthtime,
  processingTime: Date.now() - startTime
  };

  // File type specific analysis
  if (extension === '.js') {
  analysis.functions = (content.match(/function\s+\w+/g) || []).length;
  analysis.classes = (content.match(/class\s+\w+/g) || []).length;
  analysis.imports = (content.match(/(?:import|require)\s*\(/g) || []).length;
  analysis.comments = (content.match(/\/\/.*$/gm) || []).length;
  } else if (extension === '.json') {
  try {
  const jsonData = JSON.parse(content);
  analysis.jsonValid = true;
  analysis.jsonKeys = Object.keys(jsonData).length;
  analysis.jsonDepth = getJsonDepth(jsonData);
  } catch (e) {
  analysis.jsonValid = false;
  analysis.jsonError = e.message;
  }
  } else if (extension === '.md') {
  analysis.headers = (content.match(/^#+\s+/gm) || []).length;
  analysis.codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
  analysis.links = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
  } else if (extension === '.log') {
  analysis.errorLines = lines.filter(line => line.includes('ERROR')).length;
  analysis.warnLines = lines.filter(line => line.includes('WARN')).length;
  analysis.infoLines = lines.filter(line => line.includes('INFO')).length;
  analysis.debugLines = lines.filter(line => line.includes('DEBUG')).length;
  }

  return analysis;

  } catch (error) {
  return {
  filename,
  error: error.message
  };
  }
}

function getJsonDepth(obj, depth = 0) {
  if (typeof obj !== 'object' || obj === null) {
  return depth;
  }

  if (Array.isArray(obj)) {
  return Math.max(depth, ...obj.map(item => getJsonDepth(item, depth + 1)));
  }

  const values = Object.values(obj);
  if (values.length === 0) return depth + 1;

  return Math.max(depth + 1, ...values.map(value => getJsonDepth(value, depth + 1)));
}

async function analyzeDirectory(directory) {
  console.log(`Analyzing files in directory: ${directory}`);

  if (!fs.existsSync(directory)) {
  console.log('Directory does not exist, generating sample files...');
  generateSampleFiles(directory, 15);
  }

  const files = fs.readdirSync(directory)
  .map(file => path.join(directory, file))
  .filter(file => fs.statSync(file).isFile());

  console.log(`Found ${files.length} files to analyze`);

  const startTime = Date.now();

  const results = await tasklets.runAll(
  files.map(file => () => analyzeFile(file))
  );

  const endTime = Date.now();

  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);

  console.log(`\nAnalysis completed in ${endTime - startTime}ms`);
  console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);

  if (failed.length > 0) {
  console.log('\nFailed files:');
  failed.forEach(failure => {
  console.log(`  ${failure.filename}: ${failure.error}`);
  });
  }

  return { successful, failed, totalTime: endTime - startTime };
}

async function generateStatistics(analysisResults) {
  console.log('\nGenerating statistics in parallel...');

  const files = analysisResults.successful;

  const statisticsPromises = [
  // File type distribution
  () => {
  const typeStats = {};
  files.forEach(file => {
  const ext = file.extension || 'no-extension';
  if (!typeStats[ext]) {
  typeStats[ext] = { count: 0, totalSize: 0, totalLines: 0 };
  }
  typeStats[ext].count++;
  typeStats[ext].totalSize += file.size;
  typeStats[ext].totalLines += file.lines;
  });

  Object.keys(typeStats).forEach(ext => {
  typeStats[ext].avgSize = typeStats[ext].totalSize / typeStats[ext].count;
  typeStats[ext].avgLines = typeStats[ext].totalLines / typeStats[ext].count;
  });

  return { category: 'File Type Distribution', data: typeStats };
  },

  // Size analysis
  () => {
  const sizes = files.map(f => f.size);
  const totalSize = sizes.reduce((sum, size) => sum + size, 0);
  const sortedSizes = sizes.sort((a, b) => a - b);

  return {
  category: 'Size Analysis',
  data: {
  totalSize,
  avgSize: totalSize / sizes.length,
  minSize: Math.min(...sizes),
  maxSize: Math.max(...sizes),
  medianSize: sortedSizes[Math.floor(sortedSizes.length / 2)],
  filesUnder1KB: sizes.filter(s => s < 1024).length,
  filesOver10KB: sizes.filter(s => s > 10240).length
  }
  };
  },

  // Content analysis
  () => {
  const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
  const totalWords = files.reduce((sum, f) => sum + f.words, 0);
  const totalChars = files.reduce((sum, f) => sum + f.characters, 0);

  return {
  category: 'Content Analysis',
  data: {
  totalLines,
  totalWords,
  totalChars,
  avgLinesPerFile: totalLines / files.length,
  avgWordsPerFile: totalWords / files.length,
  avgCharsPerFile: totalChars / files.length,
  avgWordsPerLine: totalWords / totalLines || 0
  }
  };
  },

  // Processing performance
  () => {
  const processingTimes = files.map(f => f.processingTime);
  const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0);

  return {
  category: 'Processing Performance',
  data: {
  totalProcessingTime,
  avgProcessingTime: totalProcessingTime / processingTimes.length,
  minProcessingTime: Math.min(...processingTimes),
  maxProcessingTime: Math.max(...processingTimes),
  filesPerSecond: files.length / (analysisResults.totalTime / 1000)
  }
  };
  },

  // Language-specific analysis
  () => {
  const jsFiles = files.filter(f => f.extension === '.js');
  const jsonFiles = files.filter(f => f.extension === '.json');
  const mdFiles = files.filter(f => f.extension === '.md');
  const logFiles = files.filter(f => f.extension === '.log');

  const langStats = {};

  if (jsFiles.length > 0) {
  langStats.javascript = {
  files: jsFiles.length,
  totalFunctions: jsFiles.reduce((sum, f) => sum + (f.functions || 0), 0),
  totalClasses: jsFiles.reduce((sum, f) => sum + (f.classes || 0), 0),
  totalImports: jsFiles.reduce((sum, f) => sum + (f.imports || 0), 0),
  totalComments: jsFiles.reduce((sum, f) => sum + (f.comments || 0), 0)
  };
  }

  if (jsonFiles.length > 0) {
  const validJson = jsonFiles.filter(f => f.jsonValid);
  langStats.json = {
  files: jsonFiles.length,
  validFiles: validJson.length,
  invalidFiles: jsonFiles.length - validJson.length,
  avgDepth: validJson.reduce((sum, f) => sum + (f.jsonDepth || 0), 0) / validJson.length || 0
  };
  }

  if (logFiles.length > 0) {
  langStats.logs = {
  files: logFiles.length,
  totalErrors: logFiles.reduce((sum, f) => sum + (f.errorLines || 0), 0),
  totalWarns: logFiles.reduce((sum, f) => sum + (f.warnLines || 0), 0),
  totalInfos: logFiles.reduce((sum, f) => sum + (f.infoLines || 0), 0),
  totalDebugs: logFiles.reduce((sum, f) => sum + (f.debugLines || 0), 0)
  };
  }

  return { category: 'Language-Specific Analysis', data: langStats };
  }
  ];

  const statisticsResults = await tasklets.runAll(statisticsPromises);

  console.log('\nStatistics Results:');
  statisticsResults.forEach(result => {
  console.log(`\n${result.category}:`);

  if (result.category === 'File Type Distribution') {
  Object.entries(result.data).forEach(([ext, stats]) => {
  console.log(`  ${ext}: ${stats.count} files, avg size: ${stats.avgSize.toFixed(0)} bytes, avg lines: ${stats.avgLines.toFixed(0)}`);
  });
  } else if (result.category === 'Language-Specific Analysis') {
  Object.entries(result.data).forEach(([lang, stats]) => {
  console.log(`  ${lang}:`);
  Object.entries(stats).forEach(([key, value]) => {
  console.log(`  ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
  });
  });
  } else {
  Object.entries(result.data).forEach(([key, value]) => {
  console.log(`  ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
  });
  }
  });

  return statisticsResults;
}

// Run the example
(async () => {
  try {
  const testDirectory = './test_files';

  // Analyze directory
  const analysisResults = await analyzeDirectory(testDirectory);

  // Generate statistics
  await generateStatistics(analysisResults);

  // Sample file details
  if (analysisResults.successful.length > 0) {
  console.log('\nSample file details:');
  analysisResults.successful.slice(0, 5).forEach((file, index) => {
  console.log(`\nFile ${index + 1}:`);
  console.log(`  Name: ${path.basename(file.filename)}`);
  console.log(`  Size: ${file.size} bytes`);
  console.log(`  Lines: ${file.lines}`);
  console.log(`  Words: ${file.words}`);
  console.log(`  Processing time: ${file.processingTime}ms`);

  if (file.extension === '.js') {
  console.log(`  Functions: ${file.functions || 0}`);
  console.log(`  Classes: ${file.classes || 0}`);
  console.log(`  Comments: ${file.comments || 0}`);
  } else if (file.extension === '.json') {
  console.log(`  Valid JSON: ${file.jsonValid ? 'Yes' : 'No'}`);
  if (file.jsonValid) {
  console.log(`  JSON depth: ${file.jsonDepth}`);
  }
  } else if (file.extension === '.log') {
  console.log(`  Errors: ${file.errorLines || 0}`);
  console.log(`  Warnings: ${file.warnLines || 0}`);
  console.log(`  Info: ${file.infoLines || 0}`);
  }
  });
  }

  // Clean up test files
  if (fs.existsSync(testDirectory)) {
  fs.rmSync(testDirectory, { recursive: true, force: true });
  console.log('\nCleaned up test files');
  }

  console.log('\nFile analysis example completed!');
  } catch (error) {
  console.error('Error:', error.message);
  }
})(); 