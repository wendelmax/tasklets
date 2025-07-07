# Tasklets Examples

This document provides practical examples of using the **Tasklets 1.0.0** modern API for various use cases. All examples use the new Promise-based API for maximum simplicity and performance.

## Table of Contents

- [Basic Examples](#basic-examples)
- [CPU-Intensive Tasks](#cpu-intensive-tasks)
- [Data Processing](#data-processing)
- [Batch Operations](#batch-operations)
- [Error Handling](#error-handling)
- [Real-world Applications](#real-world-applications)
- [Performance Monitoring](#performance-monitoring)
- [Production Patterns](#production-patterns)

---

## Basic Examples

### Simple Task Execution

**File:** [`basic.js`](examples/basic.js)

Demonstrates basic task execution with the modern API, showing configuration and simple parallel execution.

### API Comparison

**File:** [`before-after-comparison.js`](examples/before-after-comparison.js)

Shows the difference between the old 0.x API and the new 1.0.0 API, highlighting the simplicity improvements.

### Modern API Usage

**File:** [`modern-api-usage.js`](examples/modern-api-usage.js)

Comprehensive example of the modern API features including configuration, parallel execution, and error handling.

---

## CPU-Intensive Tasks

### Fibonacci Computation

**File:** [`fibonacci.js`](examples/fibonacci.js)

Parallel computation of Fibonacci numbers demonstrating CPU-intensive task distribution.

### Prime Number Generation

**File:** [`prime-numbers.js`](examples/prime-numbers.js)

Finds prime numbers across multiple ranges in parallel, showing efficient CPU utilization.

### Matrix Multiplication

**File:** [`matrix-multiplication.js`](examples/matrix-multiplication.js)

Parallel matrix multiplication where each row is calculated in a separate task.

### Mathematical Computations

**File:** [`mathematical-computations.js`](examples/mathematical-computations.js)

Various mathematical computations including Monte Carlo simulations and complex calculations.

### Monte Carlo Pi Estimation

**File:** [`monte-carlo-pi.js`](examples/monte-carlo-pi.js)

Estimates π using Monte Carlo method with parallel random sampling.

---

## Data Processing

### CSV Processing

**File:** [`csv-processing.js`](examples/csv-processing.js)

Processes large CSV files by splitting them into chunks and processing each chunk in parallel.

### JSON Transformation

**File:** [`json-transformation.js`](examples/json-transformation.js)

Transforms large JSON datasets with parallel processing of data chunks.

### Data Processing

**File:** [`data-processing.js`](examples/data-processing.js)

General data processing patterns including filtering, mapping, and aggregation.

### File Analysis

**File:** [`file-analysis.js`](examples/file-analysis.js)

Analyzes multiple files in parallel, demonstrating file system operations with tasklets.

---

## Batch Operations

### Adaptive Batch Processing

**File:** [`adaptive-batch-processing.js`](examples/adaptive-batch-processing.js)

Demonstrates adaptive batch processing that adjusts to system resources and load.

### Database Operations

**File:** [`database-operations.js`](examples/database-operations.js)

Parallel database operations including bulk inserts, updates, and queries.

### Real-time Processing

**File:** [`real-time-processing.js`](examples/real-time-processing.js)

Real-time data processing with continuous task execution and monitoring.

---

## Error Handling

### Error Handling

**File:** [`error-handling.js`](examples/error-handling.js)

Comprehensive error handling patterns including retry logic, fallbacks, and graceful degradation.

---

## Real-world Applications

### Web Scraping

**File:** [`web-scraping.js`](examples/web-scraping.js)

Parallel web scraping with rate limiting and error handling.

### Web API

**File:** [`web-api.js`](examples/web-api.js)

Building web APIs that use tasklets for background processing.

### Web API Load Test

**File:** [`web-api-load-test.js`](examples/web-api-load-test.js)

Load testing web APIs using parallel requests with tasklets.

### URL Fetching

**File:** [`url-fetching.js`](examples/url-fetching.js)

Parallel URL fetching with retry logic and response processing.

### Image Processing

**File:** [`image-processing.js`](examples/image-processing.js)

Batch image processing with parallel transformation operations.

### Cryptography

**File:** [`cryptography.js`](examples/cryptography.js)

Cryptographic operations performed in parallel for better performance.

### Real-world E-commerce

**File:** [`real-world-ecommerce.js`](examples/real-world-ecommerce.js)

Complete e-commerce processing pipeline with parallel order processing, inventory updates, and notifications.

---

## Performance Monitoring

### Performance Monitoring

**File:** [`performance-monitoring.js`](examples/performance-monitoring.js)

Built-in performance monitoring and metrics collection.

### System Comparison

**File:** [`system-comparison.js`](examples/system-comparison.js)

Compares performance between different processing approaches.

### CPU Detection

**File:** [`cpu-detection.js`](examples/cpu-detection.js)

Demonstrates CPU detection and automatic worker configuration.

---

## Production Patterns

### Complete Adaptive Configuration

**File:** [`complete-adaptive-config.js`](examples/complete-adaptive-config.js)

Production-ready configuration that adapts to system resources and conditions.

### System Adaptive Configuration

**File:** [`system-adaptive-config.js`](examples/system-adaptive-config.js)

System-aware configuration that adjusts based on available resources.

### Dynamic Memory Limits

**File:** [`dynamic-memory-limits.js`](examples/dynamic-memory-limits.js)

Demonstrates dynamic memory management and limits adjustment.

### Visual Context Switching

**File:** [`visual-context-switching.js`](examples/visual-context-switching.js)

Visualizes context switching and task distribution across workers.

---

## Advanced Examples

### LibUV Demonstration

**File:** [`libuv-demonstration.js`](examples/libuv-demonstration.js)

Demonstrates integration with LibUV for advanced I/O operations.

### MDC Demonstration

**File:** [`mdc-demonstration.js`](examples/mdc-demonstration.js)

Shows Mapped Diagnostic Context (MDC) usage for better debugging and monitoring.



---

## Running the Examples

To run any example:

```bash
# Navigate to the examples directory
cd docs/examples

# Run any example
node basic.js
node fibonacci.js
node csv-processing.js
# ... etc
```

Each example is self-contained and includes:
- Clear comments explaining the functionality
- Error handling
- Performance monitoring
- Best practices implementation

For more examples and detailed usage patterns, see the [API Reference](api-reference.md) and [Getting Started](getting-started.md) guides. 