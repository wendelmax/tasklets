# Tasklets Documentation

Welcome to the Tasklets documentation! This directory contains comprehensive guides and references for using the Tasklets library.

##  Documentation Index

### Core Documentation
- **[API Reference](api-reference.md)** - Complete API documentation with examples
- **[Getting Started](getting-started.md)** - Quick start guide and basic usage
- **[Examples](examples.md)** - Practical code examples and use cases

### Advanced Topics
- **[Performance Guide](performance-guide.md)** - Performance optimization tips
- **[Best Practices](best-practices.md)** - Recommended patterns and practices
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

##  Quick Links

- **[Installation](#installation)** - How to install tasklets
- **[Basic Usage](#basic-usage)** - Simple example to get started
- **[TypeScript Support](#typescript-support)** - Using tasklets with TypeScript

## Installation

```bash
npm install tasklets
```

## Basic Usage

```javascript
const tasklets = require('tasklets');

// Spawn a tasklet
const taskletId = tasklets.spawn(() => {
  return fibonacci(40);
});

// Wait for completion and get result
tasklets.join(taskletId);
const result = tasklets.getResult(taskletId);
console.log('Result:', result);
```

## TypeScript Support

```typescript
import tasklets from 'tasklets';

const result: number = await tasklets.spawnAsync(() => {
  return fibonacci(40);
});
```

##  Key Features

- **High Performance**: Native C++ implementation with libuv thread pool
- **Lightweight**: Minimal memory overhead per tasklet
- **Project Loom Style**: Java-inspired virtual threads for Node.js
- **Structured Logging**: Built-in logging with context correlation
- **TypeScript Ready**: Full TypeScript definitions included
- **Easy to Use**: Simple API with powerful capabilities

##  Documentation Structure

The documentation is organized into the following sections:

1. **Getting Started** - Introduction and basic concepts
2. **API Reference** - Complete method and class documentation
3. **Examples** - Real-world usage patterns
4. **Performance Guide** - Optimization techniques
5. **Best Practices** - Recommended patterns
6. **Troubleshooting** - Common issues and solutions

##  Contributing

If you find any issues with the documentation or want to contribute improvements, please:

1. Check the [GitHub repository](https://github.com/wendelmax/tasklets)
2. Open an issue or pull request
3. Follow the contribution guidelines

##  License

This documentation is licensed under the MIT License, same as the Tasklets library. 