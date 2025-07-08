# Tasklets Examples

This document provides practical examples of using the **Tasklets 1.0.0** modern API for various use cases. All examples use the new Promise-based API for maximum simplicity and performance.

## Table of Contents

- [Basic Examples](#basic-examples)
- [CPU-Intensive Tasks](#cpu-intensive-tasks)
- [Data Processing](#data-processing)
- [I/O-Bound Tasks](#io-bound-tasks)
- [Real-world Applications](#real-world-applications)
- [Advanced Patterns](#advanced-patterns)

---

## Basic Examples

### Basic Usage
**File:** [`basic.js`](examples/basic.js)

This example provides a basic demonstration of the modern Tasklets API. It covers the fundamental features of the library, including: configuring tasklet behavior, executing a single task with `tasklets.run()`, running multiple tasks in parallel with `tasklets.runAll()`, basic error handling for tasks, setting a timeout for a task, retrieving performance statistics and system health, and a performance comparison between synchronous and parallel execution.

### Modern API Usage
**File:** [`modern-api-usage.js`](examples/modern-api-usage.js)

This example showcases the modern, user-friendly Tasklets API. It provides a comprehensive overview of the main features, including: configuring the Tasklets environment, running a single task with `tasklets.run()`, executing multiple tasks in parallel with `tasklets.runAll()`, batch processing with progress tracking using `tasklets.batch()`, automatic retries with exponential backoff for unreliable tasks using `tasklets.retry()`, retrieving performance statistics and health checks, and advanced features like custom timeouts and error handling patterns.

---

## CPU-Intensive Tasks

### Fibonacci Computation
**File:** [`fibonacci.js`](examples/fibonacci.js)

This example demonstrates the computation of Fibonacci numbers in parallel using Tasklets. It showcases several features of the library: a performance comparison between sequential and parallel computation of Fibonacci numbers, batch processing of Fibonacci calculations with progress tracking using `tasklets.batch()`, error handling and retry logic for unreliable computations using `tasklets.retry()`, and a demonstration of an advanced parallel map pattern. This example highlights how CPU-bound recursive tasks can be parallelized to improve performance.

### Prime Number Generation
**File:** [`prime-numbers.js`](examples/prime-numbers.js)

This example demonstrates how to find prime numbers in parallel using Tasklets. It includes two main scenarios: finding all prime numbers within a set of given ranges, with the ranges processed in parallel, and checking the primality of a list of large numbers, with each check performed in parallel. This is a classic example of a CPU-bound task that can be significantly sped up through parallelization.

### Matrix Multiplication
**File:** [`matrix-multiplication.js`](examples/matrix-multiplication.js)

This example demonstrates how to perform matrix multiplication and other matrix operations in parallel using Tasklets. It showcases different strategies for parallelization: row-parallel multiplication, where each row of the resulting matrix is computed in a separate task, and block-parallel multiplication, where the matrix is divided into blocks, and each block is processed in a separate task. The example also includes a performance comparison between sequential and parallel matrix multiplication, as well as demonstrations of other operations like addition, subtraction, and transposition. This is a good example of how to handle CPU-bound, highly parallelizable tasks.

### Mathematical Computations
**File:** [`mathematical-computations.js`](examples/mathematical-computations.js)

This example showcases the use of Tasklets for performing various mathematical and scientific computations in parallel. It includes demonstrations of: prime number generation using the Sieve of Eratosthenes, factorial calculations for large numbers, Pi calculation using both the Leibniz formula and the Monte Carlo method, and matrix multiplication. The `tasklets.runAll` function is used to execute these computationally intensive tasks concurrently, highlighting the performance benefits of parallel processing for CPU-bound operations.

### Monte Carlo Pi Estimation
**File:** [`monte-carlo-pi.js`](examples/monte-carlo-pi.js)

This example demonstrates the use of Tasklets to estimate the value of Pi using the Monte Carlo method. It showcases several aspects of parallel computing: parallel Pi estimation, where the main estimation is parallelized across multiple workers to speed up the computation, convergence analysis, where it analyzes how the accuracy of the estimation improves as the number of iterations increases, scalability testing, to see how the performance scales with an increasing number of worker threads, and precision comparison, comparing the standard Monte Carlo method with other sampling techniques like Stratified and Antithetic sampling. This example is a classic demonstration of a CPU-bound, "embarrassingly parallel" problem.

### Cryptography
**File:** [`cryptography.js`](examples/cryptography.js)

This example demonstrates how to perform various cryptographic operations in parallel using Tasklets. It includes examples of: hashing data with multiple algorithms (MD5, SHA1, SHA256, etc.), generating RSA key pairs of different sizes and using them for encryption and decryption, generating AES keys and using them for symmetric encryption and decryption, and simulating a brute-force password cracking attempt to showcase a long-running task. The `tasklets.runAll` function is utilized to offload these CPU-intensive cryptographic tasks from the main thread, improving application responsiveness and performance.

---

## Data Processing

### CSV Processing
**File:** [`csv-processing.js`](examples/csv-processing.js)

This example demonstrates how to process a large CSV file in parallel using Tasklets. The script performs the following steps: generates a sample CSV file with a specified number of rows, reads the large CSV file and splits it into smaller chunks, processes each chunk of data in parallel using `tasklets.runAll()` (each tasklet calculates statistics for its assigned chunk), and aggregates the results from all chunks to get the final statistics for the entire file. This is a practical example of how to handle I/O-bound and data-processing tasks concurrently.

### JSON Transformation
**File:** [`json-transformation.js`](examples/json-transformation.js)

This example demonstrates how to perform JSON data transformation and analysis in parallel using Tasklets. The script performs the following steps: generates a sample dataset of JSON objects (user records), transforms the dataset in parallel (each record is processed and mapped to a new format), and runs multiple analysis tasks on the transformed data in parallel, including calculating age distribution, department statistics, and grade distribution. This example is useful for understanding how to parallelize data-heavy transformation and analysis pipelines.

### General Data Processing
**File:** [`data-processing.js`](examples/data-processing.js)

This example demonstrates parallel data processing using Tasklets. It performs the following steps: generates a sample dataset, processes the dataset in chunks, first sequentially and then in parallel, to compare performance, and after processing, it performs data aggregation, both sequentially and in parallel, to showcase different approaches to summarizing the data. This example is useful for understanding how to parallelize data-intensive workloads.

### File Analysis
**File:** [`file-analysis.js`](examples/file-analysis.js)

This example demonstrates how to use Tasklets for parallel file analysis. It performs the following steps: generates a set of sample files with different extensions (.txt, .js, .json, .md, .log), reads and analyzes each file in parallel using `tasklets.runAll()`, where the analysis includes basic stats (size, line count, word count) and type-specific analysis (e.g., function count for JS, validation for JSON), and after the analysis, it generates overall statistics for the analyzed files, also in parallel. This example is useful for understanding how to offload I/O-bound and CPU-bound tasks related to file system operations.

### Image Processing (Simulation)
**File:** [`image-processing.js`](examples/image-processing.js)

This example simulates a parallel image processing pipeline using Tasklets. It demonstrates how to handle a variety of image processing tasks concurrently: batch processing of images to generate different variants (e.g., resizing, thumbnails), applying a set of filters to multiple images in parallel, and performing image analysis, such as color analysis, face detection, and object detection, in parallel. The processing functions are simulations and do not require any external image processing libraries or actual image files. This is a good example of how to manage a pipeline of CPU-bound tasks.

---

## I/O-Bound Tasks

### Web Scraping (Simulation)
**File:** [`web-scraping.js`](examples/web-scraping.js)

This example simulates a web scraping scenario using Tasklets to perform tasks in parallel. It includes demonstrations of: a performance comparison between sequential and parallel web scraping, a simulation of a large-scale scraping operation, error handling with a retry mechanism for failed requests, and post-processing of scraped content in parallel. The `scrapeUrl` function is a simulation and does not make actual HTTP requests, making it safe to run locally. This example is useful for understanding how to manage I/O-bound tasks like web scraping.

### Web API Load Test
**File:** [`web-api-load-test.js`](examples/web-api-load-test.js)

This example demonstrates how to use Tasklets to simulate a load test on a web API. It defines an `APILoadTester` class that simulates multiple users making concurrent requests to a local server. The `tasklets.runAll()` function is used to run the user simulations in parallel. After the test, it analyzes and prints detailed results, including success rate, requests per second, and response times for different API endpoints. NOTE: This example requires a local web server running on http://localhost:3000. You can use the `docs/examples/web-api.js` example as a simple server for this test.

### URL Fetching
**File:** [`url-fetching.js`](examples/url-fetching.js)

This example demonstrates parallel URL fetching and analysis using Tasklets. It includes the following functionalities: a function to fetch a single URL with timeout handling, a function to fetch multiple URLs in parallel using `tasklets.runAll()`, a benchmarking function to test the performance of fetching URLs over multiple iterations, and parallel analysis of the fetched responses, including response times, status codes, and data sizes. This example is a good demonstration of how to handle I/O-bound tasks concurrently.

### Database Operations (Simulation)
**File:** [`database-operations.js`](examples/database-operations.js)

This example simulates parallel database operations using Tasklets. It demonstrates how to handle various database-related tasks concurrently: executing multiple database queries in parallel, running multiple database transactions concurrently, performing database analytics by running a set of aggregation queries in parallel, and simulating a database connection pool to handle a large number of operations. The database functions are simulations and do not require a real database connection. This example is useful for understanding how to manage I/O-bound database workloads.

### Web API
**File:** [`web-api.js`](examples/web-api.js)

This example demonstrates how to build a simple web API server that uses Tasklets to handle background processing for incoming requests. It includes: a simulated in-memory database with asynchronous operations, a request handler that offloads database queries and data processing to Tasklets, preventing the main thread from being blocked, and endpoints for fetching, creating, and updating user data, as well as running a complex analytics query. This example is useful for understanding how to integrate Tasklets into a web server to maintain responsiveness under load.

---

## Real-world Applications

### E-commerce Order Processing
**File:** [`real-world-ecommerce.js`](examples/real-world-ecommerce.js)

This example simulates a real-world e-commerce order processing system using Tasklets. It demonstrates how to handle complex workflows with multiple dependent tasks, such as checking inventory, processing payments, calculating shipping, and sending notifications. The example showcases how Tasklets can be used to manage I/O-bound and CPU-bound tasks in a concurrent and efficient manner, without blocking the main thread. It also includes context switching simulation to show how a long-running process can yield to other tasks.

### Real-time Data Processing
**File:** [`real-time-processing.js`](examples/real-time-processing.js)

This example simulates a real-time data processing system using Tasklets. It consists of three main components: a `DataStreamSimulator` that generates a continuous stream of data events, a `LiveDataProcessor` that processes the incoming data in parallel, using a queue to manage backpressure and a limited number of concurrent tasks (each data processing task is executed in a separate tasklet using `tasklets.run()`), and a `RealTimeAnalytics` class that monitors the performance of the data processor and generates alerts based on predefined thresholds. This example is a good demonstration of how to build a responsive, high-throughput, real-time processing system.

---

## Advanced Patterns

### Error Handling
**File:** [`error-handling.js`](examples/error-handling.js)

This example demonstrates various error handling patterns when working with Tasklets. It covers several strategies for building robust and resilient applications: basic error handling using .catch() with `tasklets.run()`, a retry pattern with exponential backoff to handle transient failures, a circuit breaker pattern to prevent a system from repeatedly trying to execute an operation that is likely to fail, error categorization to handle different types of errors in different ways, graceful degradation with fallback tasks, and a bulkhead pattern to isolate failures between different groups of tasks.

### Adaptive Batch Processing
**File:** [`adaptive-batch-processing.js`](examples/adaptive-batch-processing.js)

This example demonstrates the concept of adaptive batch processing based on system capabilities. It compares a fixed-size batch processing approach with an adaptive one where the batch size is dynamically calculated based on the number of CPU cores. This ensures optimal throughput and resource utilization across different systems without manual tuning. The example processes a number of items and shows the performance difference between the two methods.

### Dynamic Memory Limits
**File:** [`dynamic-memory-limits.js`](examples/dynamic-memory-limits.js)

This example demonstrates memory-aware task management with Tasklets. It shows how to: monitor memory usage during task execution using `process.memoryUsage()` and `os.freemem()`, process tasks in batches to control memory consumption, and implement a strategy to dynamically adjust task creation based on available memory, preventing the system from being overloaded. This is useful for long-running applications or batch processing systems that handle large amounts of data.

### Performance Monitoring
**File:** [`performance-monitoring.js`](examples/performance-monitoring.js)

This example showcases the built-in performance monitoring capabilities of Tasklets. It demonstrates how to: create a custom performance monitor to periodically sample and analyze performance data, use `tasklets.getStats()` to retrieve detailed statistics about workers, tasks, and performance, use `tasklets.getHealth()` to get a high-level overview of the system's health, including memory and worker utilization, and monitor the system during different workloads, such as basic task execution and batch processing.

### Visual Context Switching
**File:** [`visual-context-switching.js`](examples/visual-context-switching.js)

This example provides a visual demonstration of context switching between tasks running in Tasklets. It shows how tasks are executed concurrently and how the event loop is not blocked, allowing for responsive applications even during heavy computation. It includes a visual representation of task progress and main thread activity.

---

## Running the Examples

To run any example:
```sh
node docs/examples/basic.js
```
Replace `basic.js` with the name of the example file you want to run. 