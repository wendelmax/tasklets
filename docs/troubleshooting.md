# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the Tasklets library.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Build and Compilation Problems](#build-and-compilation-problems)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Memory Problems](#memory-problems)
- [Threading Issues](#threading-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Debugging Techniques](#debugging-techniques)
- [Common Error Messages](#common-error-messages)
- [Getting Help](#getting-help)

---

## Installation Issues

### Native Module Build Failures

**Problem:** Installation fails with native compilation errors.

**Symptoms:**
```
npm ERR! Failed at the tasklets@0.3.0 install script 'node-gyp rebuild'
```

**Solutions:**

1. **Install build tools:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential

# macOS
xcode-select --install

# Windows
npm install --global windows-build-tools
```

2. **Update Node.js and npm:**
```bash
# Check versions
node --version  # Should be >= 18.0.0
npm --version

# Update if needed
npm install -g npm@latest
```

3. **Clear npm cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

4. **Use specific Python version:**
```bash
npm config set python python3
npm install
```

### Missing Dependencies

**Problem:** Module not found errors after installation.

**Symptoms:**
```
Error: Cannot find module '../build/Release/tasklets'
```

**Solutions:**

1. **Rebuild the native module:**
```bash
npm run build
```

2. **Check for prebuilds:**
```bash
ls -la node_modules/tasklets/prebuilds/
```

3. **Force rebuild:**
```bash
npm rebuild tasklets
```

---

## Build and Compilation Problems

### Node-gyp Issues

**Problem:** node-gyp fails to build native addon.

**Symptoms:**
```
gyp ERR! build error
gyp ERR! stack Error: `make` failed with exit code: 2
```

**Solutions:**

1. **Install Python 3:**
```bash
# Check Python version
python3 --version

# Install Python if missing
sudo apt-get install python3 python3-dev
```

2. **Set correct Python path:**
```bash
npm config set python /usr/bin/python3
```

3. **Install make and g++:**
```bash
sudo apt-get install make g++
```

### Visual Studio Build Tools (Windows)

**Problem:** Missing Visual Studio build tools on Windows.

**Symptoms:**
```
gyp ERR! find VS msvs_version not set from command line or npm config
```

**Solutions:**

1. **Install Visual Studio Build Tools:**
```bash
npm install --global --production windows-build-tools
```

2. **Or install Visual Studio Community:**
- Download from Microsoft
- Install with C++ build tools

3. **Set Visual Studio version:**
```bash
npm config set msvs_version 2019
```

---

## Runtime Errors

### Module Loading Failures

**Problem:** Native module fails to load at runtime.

**Symptoms:**
```
Error: The specified module could not be found.
```

**Solutions:**

1. **Check module path:**
```javascript
const path = require('path');
console.log(__dirname);
console.log(path.join(__dirname, '../build/Release/tasklets.node'));
```

2. **Verify binary exists:**
```bash
ls -la build/Release/tasklets.node
```

3. **Check library dependencies:**
```bash
# Linux
ldd build/Release/tasklets.node

# macOS
otool -L build/Release/tasklets.node
```

### Segmentation Faults

**Problem:** Application crashes with segmentation fault.

**Symptoms:**
```
Segmentation fault (core dumped)
```

**Solutions:**

1. **Enable core dumps:**
```bash
ulimit -c unlimited
```

2. **Run with debugging:**
```bash
node --trace-warnings --trace-uncaught app.js
```

3. **Check for memory corruption:**
```javascript
// Avoid passing large objects to tasklets
const taskletId = tasklets.spawn(() => {
  // This copies large data unnecessarily
  return processLargeData(hugeObject);
});
```

4. **Use smaller data chunks:**
```javascript
// Better approach
const chunks = chunkData(hugeObject, 1000);
const results = [];
for (const chunk of chunks) {
  const result = await tasklets.spawnAsync(() => processChunk(chunk));
  results.push(result);
}
```

---

## Performance Issues

### Slow Execution

**Problem:** Tasklets are running slower than expected.

**Symptoms:**
- High execution times
- Low throughput
- CPU underutilization

**Debugging:**

1. **Check thread utilization:**
```javascript
const tasklets = require('tasklets');

function checkUtilization() {
  const stats = tasklets.getStats();
  const threadCount = tasklets.getWorkerThreadCount();

  console.log(`Active tasklets: ${stats.activeTasklets}`);
  console.log(`Thread count: ${threadCount}`);
  console.log(`Utilization: ${(stats.activeTasklets / threadCount * 100).toFixed(2)}%`);
}

setInterval(checkUtilization, 1000);
```

2. **Profile execution:**
```javascript
const tasklets = require('tasklets');

async function profileExecution() {
  const startTime = Date.now();

  const taskletId = tasklets.spawn(() => {
  const taskStart = Date.now();
  // Your task here
  const result = expensiveOperation();
  const taskEnd = Date.now();

  return {
  result,
  executionTime: taskEnd - taskStart
  };
  });

  tasklets.join(taskletId);
  const endTime = Date.now();

  const taskResult = tasklets.getResult(taskletId);

  console.log(`Total time: ${endTime - startTime}ms`);
  console.log(`Task execution time: ${taskResult.executionTime}ms`);
  console.log(`Overhead: ${(endTime - startTime) - taskResult.executionTime}ms`);
}
```

**Solutions:**

1. **Adjust thread count:**
```javascript
const os = require('os');
const cpuCount = os.cpus().length;

// CPU-bound tasks
tasklets.setWorkerThreadCount(cpuCount);

// I/O-bound tasks
tasklets.setWorkerThreadCount(cpuCount * 2);
```

2. **Optimize batch sizes:**
```javascript
// Too many small tasks
const badApproach = data.map(item => 
  tasklets.spawn(() => processItem(item))
);

// Better: batch processing
const goodApproach = [];
const batchSize = 100;
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  goodApproach.push(tasklets.spawn(() => batch.map(processItem)));
}
```

3. **Reduce logging overhead:**
```javascript
// For performance testing
tasklets.setLogLevel(0); // OFF
```

### High Memory Usage

**Problem:** Memory usage grows continuously.

**Symptoms:**
- Increasing heap size
- Out of memory errors
- Performance degradation

**Debugging:**

1. **Monitor memory usage:**
```javascript
function monitorMemory() {
  const usage = process.memoryUsage();
  console.log(`Heap used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
}

setInterval(monitorMemory, 5000);
```

2. **Check for memory leaks:**
```javascript
const tasklets = require('tasklets');

// Potential memory leak
const results = [];
for (let i = 0; i < 10000; i++) {
  const taskletId = tasklets.spawn(() => processData(i));
  tasklets.join(taskletId);
  results.push(tasklets.getResult(taskletId)); // Growing array
}

// Better approach
const batchSize = 100;
for (let i = 0; i < 10000; i += batchSize) {
  const batch = [];
  for (let j = i; j < Math.min(i + batchSize, 10000); j++) {
  const taskletId = tasklets.spawn(() => processData(j));
  batch.push(taskletId);
  }

  tasklets.joinMany(batch);

  // Process results immediately
  const batchResults = batch.map(id => tasklets.getResult(id));
  processBatchResults(batchResults);

  // Clear batch to free memory
  batch.length = 0;
}
```

**Solutions:**

1. **Implement memory limits:**
```javascript
const tasklets = require('tasklets');

class MemoryLimitedProcessor {
  constructor(maxMemoryMB = 1024) {
  this.maxMemory = maxMemoryMB * 1024 * 1024;
  }

  async processWithMemoryCheck(data) {
  const memUsage = process.memoryUsage();

  if (memUsage.heapUsed > this.maxMemory) {
  // Force garbage collection
  if (global.gc) {
  global.gc();
  }

  // Check again after GC
  const newMemUsage = process.memoryUsage();
  if (newMemUsage.heapUsed > this.maxMemory) {
  throw new Error('Memory limit exceeded');
  }
  }

  return await tasklets.spawnAsync(() => processData(data));
  }
}
```

2. **Use streaming/chunked processing:**
```javascript
const tasklets = require('tasklets');

async function processLargeDataset(dataset) {
  const chunkSize = 1000;
  const results = [];

  for (let i = 0; i < dataset.length; i += chunkSize) {
  const chunk = dataset.slice(i, i + chunkSize);
  const chunkResults = await tasklets.spawnAsync(() => 
  chunk.map(processItem)
  );

  // Process results immediately
  results.push(...chunkResults);

  // Optional: force garbage collection
  if (i % 10000 === 0 && global.gc) {
  global.gc();
  }
  }

  return results;
}
```

---

## Threading Issues

### Race Conditions

**Problem:** Inconsistent results due to race conditions.

**Symptoms:**
- Non-deterministic behavior
- Intermittent failures
- Data corruption

**Solutions:**

1. **Use immutable data:**
```javascript
const tasklets = require('tasklets');

// Bad: shared mutable state
let sharedCounter = 0;
const taskletId = tasklets.spawn(() => {
  sharedCounter++; // Race condition
  return sharedCounter;
});

// Good: immutable approach
const processItem = (item, index) => {
  return {
  item,
  index,
  processed: true,
  timestamp: Date.now()
  };
};
```

2. **Avoid shared state:**
```javascript
// Bad: shared array
const sharedResults = [];
const taskletIds = data.map(item => 
  tasklets.spawn(() => {
  const result = processItem(item);
  sharedResults.push(result); // Race condition
  return result;
  })
);

// Good: collect results after completion
const taskletIds = data.map(item => 
  tasklets.spawn(() => processItem(item))
);
tasklets.joinMany(taskletIds);
const results = taskletIds.map(id => tasklets.getResult(id));
```

### Deadlocks

**Problem:** Tasklets hang indefinitely.

**Symptoms:**
- Application becomes unresponsive
- No progress in task completion

**Solutions:**

1. **Add timeouts:**
```javascript
const tasklets = require('tasklets');

async function processWithTimeout(data, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
  const timeoutId = setTimeout(() => {
  reject(new Error('Task timeout'));
  }, timeoutMs);

  tasklets.spawnAsync(() => processData(data))
  .then(result => {
  clearTimeout(timeoutId);
  resolve(result);
  })
  .catch(error => {
  clearTimeout(timeoutId);
  reject(error);
  });
  });
}
```

2. **Avoid blocking operations:**
```javascript
// Bad: blocking I/O in tasklet
const taskletId = tasklets.spawn(() => {
  const fs = require('fs');
  return fs.readFileSync('large-file.txt', 'utf8'); // Blocks thread
});

// Good: use async I/O or pass data
const fs = require('fs').promises;
const data = await fs.readFile('large-file.txt', 'utf8');
const taskletId = tasklets.spawn(() => processData(data));
```

---

## Platform-Specific Issues

### Linux Issues

**Problem:** Permission errors or missing libraries.

**Solutions:**

1. **Install required packages:**
```bash
sudo apt-get update
sudo apt-get install build-essential python3-dev
```

2. **Check library paths:**
```bash
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
```

### macOS Issues

**Problem:** Code signing or permission issues.

**Solutions:**

1. **Allow unsigned binaries:**
```bash
sudo spctl --master-disable
```

2. **Install Xcode command line tools:**
```bash
xcode-select --install
```

### Windows Issues

**Problem:** Path length limitations or permission errors.

**Solutions:**

1. **Enable long path support:**
```bash
# Run as administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

2. **Use short paths:**
```bash
# Move project to shorter path
C:\proj\tasklets
```

---

## Debugging Techniques

### Enable Debug Logging

```javascript
const tasklets = require('tasklets');

// Enable verbose logging
tasklets.setLogLevel(5); // TRACE

// Monitor all operations
tasklets.on('taskletSpawned', ({ taskletId }) => {
  console.log(`Tasklet ${taskletId} spawned`);
});

tasklets.on('error', (error) => {
  console.error('Tasklet error:', error);
});
```

### Performance Profiling

```javascript
const tasklets = require('tasklets');

class TaskletProfiler {
  constructor() {
  this.profiles = new Map();
  }

  async profileTask(name, taskFn) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  try {
  const result = await tasklets.spawnAsync(taskFn);
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage();

  this.profiles.set(name, {
  duration: Number(endTime - startTime) / 1000000, // ms
  memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
  success: true
  });

  return result;
  } catch (error) {
  const endTime = process.hrtime.bigint();

  this.profiles.set(name, {
  duration: Number(endTime - startTime) / 1000000, // ms
  success: false,
  error: error.message
  });

  throw error;
  }
  }

  getProfile(name) {
  return this.profiles.get(name);
  }

  getAllProfiles() {
  return Object.fromEntries(this.profiles);
  }
}
```

### Memory Leak Detection

```javascript
const tasklets = require('tasklets');

class MemoryLeakDetector {
  constructor() {
  this.baselines = [];
  this.snapshots = [];
  }

  takeBaseline() {
  const usage = process.memoryUsage();
  this.baselines.push({
  timestamp: Date.now(),
  ...usage
  });
  }

  takeSnapshot() {
  const usage = process.memoryUsage();
  this.snapshots.push({
  timestamp: Date.now(),
  ...usage
  });
  }

  detectLeaks() {
  if (this.baselines.length === 0 || this.snapshots.length === 0) {
  return null;
  }

  const baseline = this.baselines[this.baselines.length - 1];
  const snapshot = this.snapshots[this.snapshots.length - 1];

  const heapGrowth = snapshot.heapUsed - baseline.heapUsed;
  const rssGrowth = snapshot.rss - baseline.rss;

  return {
  heapGrowth,
  rssGrowth,
  timeElapsed: snapshot.timestamp - baseline.timestamp,
  suspicious: heapGrowth > 50 * 1024 * 1024 // 50MB
  };
  }
}
```

---

## Common Error Messages

### "Failed to load native tasklets module"

**Cause:** Native binary not found or corrupted.

**Solution:**
```bash
npm run build
# or
npm rebuild tasklets
```

### "Thread pool is not initialized"

**Cause:** Tasklets module not properly initialized.

**Solution:**
```javascript
const tasklets = require('tasklets');

// Ensure proper initialization
tasklets.setWorkerThreadCount(4);

// Then use tasklets
const taskletId = tasklets.spawn(() => "test");
```

### "Tasklet ID not found"

**Cause:** Trying to access results of non-existent tasklet.

**Solution:**
```javascript
const tasklets = require('tasklets');

const taskletId = tasklets.spawn(() => "test");
tasklets.join(taskletId);

// Check if tasklet exists before accessing
if (tasklets.hasError(taskletId)) {
  console.error('Tasklet failed:', tasklets.getError(taskletId));
} else {
  console.log('Result:', tasklets.getResult(taskletId));
}
```

### "Memory allocation failed"

**Cause:** Insufficient memory or memory limit exceeded.

**Solution:**
```javascript
// Reduce memory usage
const tasklets = require('tasklets');

// Process in smaller batches
const batchSize = Math.max(100, Math.floor(availableMemory / itemSize));
```

---

## Getting Help

### Diagnostic Information

When reporting issues, include:

```javascript
const tasklets = require('tasklets');
const os = require('os');

console.log('=== Diagnostic Information ===');
console.log('Node.js version:', process.version);
console.log('Platform:', os.platform());
console.log('Architecture:', os.arch());
console.log('CPU cores:', os.cpus().length);
console.log('Memory:', Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB');
console.log('Tasklets version:', require('tasklets/package.json').version);
console.log('Worker threads:', tasklets.getWorkerThreadCount());
console.log('Log level:', tasklets.getLogLevel());
console.log('Stats:', tasklets.getStats());
```

### Creating Minimal Reproduction

```javascript
const tasklets = require('tasklets');

// Minimal example that reproduces the issue
tasklets.setLogLevel(5); // Enable debug logging

const taskletId = tasklets.spawn(() => {
  // Minimal task that demonstrates the problem
  return "test";
});

try {
  tasklets.join(taskletId);
  console.log('Result:', tasklets.getResult(taskletId));
} catch (error) {
  console.error('Error:', error);
}

tasklets.printStats();
```

### Support Channels

1. **GitHub Issues**: [https://github.com/wendelmax/tasklets/issues](https://github.com/wendelmax/tasklets/issues)
2. **Documentation**: Check this documentation for common solutions
3. **Stack Overflow**: Tag questions with `tasklets` and `node.js`

Include the diagnostic information and a minimal reproduction when asking for help. 