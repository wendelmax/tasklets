/**
 * @file database-operations.js
 * @description This example simulates parallel database operations using Tasklets.
 * It demonstrates how to handle various database-related tasks concurrently:
 * - Executing multiple database queries in parallel.
 * - Running multiple database transactions concurrently.
 * - Performing database analytics by running a set of aggregation queries in parallel.
 * - Simulating a database connection pool to handle a large number of operations.
 * The database functions are simulations and do not require a real database connection. This example
 * is useful for understanding how to manage I/O-bound database workloads.
 */
const tasklets = require('../../lib/tasklets');

console.log('Tasklets - Database Operations Example\n');

// Simulated database query function
function queryDatabase(query, params = []) {
  return new Promise((resolve) => {
  // Simulate database latency
  const latency = Math.random() * 100 + 10; // 10-110ms
  const complexity = query.toLowerCase().includes('join') ? 2 : 1;
  const processingTime = latency * complexity;

  setTimeout(() => {
  const rows = Math.floor(Math.random() * 100) + 1;
  const executionTime = Math.floor(processingTime);

  resolve({
  query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
  params,
  rows,
  executionTime,
  success: Math.random() > 0.05, // 95% success rate
  timestamp: new Date().toISOString()
  });
  }, processingTime);
  });
}

// Simulated database transaction
function executeTransaction(operations) {
  return new Promise((resolve) => {
  // Simulate transaction processing
  const baseTime = 50;
  const operationTime = operations.length * 20;
  const totalTime = baseTime + operationTime;

  setTimeout(() => {
  const success = Math.random() > 0.1; // 90% success rate

  resolve({
  operations: operations.length,
  success,
  executionTime: totalTime,
  message: success ? 'Transaction completed' : 'Transaction rolled back',
  timestamp: new Date().toISOString()
  });
  }, totalTime);
  });
}

async function parallelDatabaseQueries() {
  const queries = [
  {query: 'SELECT * FROM users WHERE active = ?', params: [true]},
  {query: 'SELECT * FROM orders WHERE date > ?', params: ['2023-01-01']},
  {query: 'SELECT * FROM products WHERE category = ?', params: ['electronics']},
  {query: 'SELECT * FROM reviews WHERE rating >= ?', params: [4]},
  {query: 'SELECT * FROM inventory WHERE quantity < ?', params: [10]},
  {
  query: 'SELECT u.name, COUNT(o.id) as order_count FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.id',
  params: []
  },
  {
  query: 'SELECT p.name, AVG(r.rating) as avg_rating FROM products p JOIN reviews r ON p.id = r.product_id GROUP BY p.id',
  params: []
  },
  {query: 'SELECT * FROM customers WHERE last_login < ?', params: ['2023-06-01']}
  ];

  console.log('Executing database queries in parallel...');
  const startTime = Date.now();

  const results = await tasklets.runAll(
  queries.map(({query, params}) =>
  () => queryDatabase(query, params)
  )
  );

  const endTime = Date.now();

  console.log(`Executed ${results.length} queries in ${endTime - startTime}ms`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);

  console.log('\nQuery Results:');
  results.forEach((result, index) => {
  const status = result.success ? 'SUCCESS' : 'FAILED';
  console.log(`  Query ${index + 1}: ${result.rows} rows, ${result.executionTime}ms [${status}]`);
  console.log(`  ${result.query}`);
  });

  return results;
}

async function parallelTransactions() {
  const transactions = [
  [
  'BEGIN TRANSACTION',
  'INSERT INTO orders (user_id, total) VALUES (1, 100.00)',
  'UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1',
  'COMMIT'
  ],
  [
  'BEGIN TRANSACTION',
  'INSERT INTO users (name, email) VALUES ("John Doe", "john@example.com")',
  'INSERT INTO user_preferences (user_id, theme) VALUES (LAST_INSERT_ID(), "dark")',
  'COMMIT'
  ],
  [
  'BEGIN TRANSACTION',
  'UPDATE products SET price = price * 1.1 WHERE category = "electronics"',
  'INSERT INTO price_history (product_id, old_price, new_price) SELECT id, price/1.1, price FROM products WHERE category = "electronics"',
  'COMMIT'
  ],
  [
  'BEGIN TRANSACTION',
  'DELETE FROM sessions WHERE expires < NOW()',
  'UPDATE users SET last_cleanup = NOW() WHERE id IN (SELECT DISTINCT user_id FROM sessions)',
  'COMMIT'
  ]
  ];

  console.log('\nExecuting database transactions in parallel...');
  const startTime = Date.now();

  const results = await tasklets.runAll(
  transactions.map(operations =>
  () => executeTransaction(operations)
  )
  );

  const endTime = Date.now();

  console.log(`Executed ${results.length} transactions in ${endTime - startTime}ms`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);

  console.log('\nTransaction Results:');
  results.forEach((result, index) => {
  const status = result.success ? 'SUCCESS' : 'FAILED';
  console.log(`  Transaction ${index + 1}: ${result.operations} operations, ${result.executionTime}ms [${status}]`);
  console.log(`  ${result.message}`);
  });

  return results;
}

async function databaseAnalytics() {
  console.log('\nRunning database analytics in parallel...');

  const analyticsPromises = [
  // User analytics
  () => {
  const queries = [
  'SELECT COUNT(*) FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)',
  'SELECT COUNT(*) FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 7 DAY)',
  'SELECT AVG(DATEDIFF(NOW(), created_at)) FROM users'
  ];

  return Promise.all(queries.map(q => queryDatabase(q))).then(results => ({
  category: 'User Analytics',
  metrics: {
  newUsers30Days: results[0].rows,
  activeUsers7Days: results[1].rows,
  avgUserAge: results[2].rows
  },
  totalTime: results.reduce((sum, r) => sum + r.executionTime, 0)
  }));
  },

  // Sales analytics
  () => {
  const queries = [
  'SELECT SUM(total) FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)',
  'SELECT COUNT(*) FROM orders WHERE status = "completed"',
  'SELECT AVG(total) FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)'
  ];

  return Promise.all(queries.map(q => queryDatabase(q))).then(results => ({
  category: 'Sales Analytics',
  metrics: {
  revenue30Days: results[0].rows,
  completedOrders: results[1].rows,
  avgOrderValue7Days: results[2].rows
  },
  totalTime: results.reduce((sum, r) => sum + r.executionTime, 0)
  }));
  },

  // Product analytics
  () => {
  const queries = [
  'SELECT COUNT(*) FROM products WHERE stock_quantity > 0',
  'SELECT COUNT(*) FROM products WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)',
  'SELECT AVG(rating) FROM reviews WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)'
  ];

  return Promise.all(queries.map(q => queryDatabase(q))).then(results => ({
  category: 'Product Analytics',
  metrics: {
  inStockProducts: results[0].rows,
  newProducts30Days: results[1].rows,
  avgRating30Days: results[2].rows
  },
  totalTime: results.reduce((sum, r) => sum + r.executionTime, 0)
  }));
  },

  // Performance analytics
  () => {
  const queries = [
  'SELECT COUNT(*) FROM error_logs WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
  'SELECT COUNT(*) FROM api_calls WHERE response_time > 1000',
  'SELECT AVG(response_time) FROM api_calls WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
  ];

  return Promise.all(queries.map(q => queryDatabase(q))).then(results => ({
  category: 'Performance Analytics',
  metrics: {
  errors24Hours: results[0].rows,
  slowRequests: results[1].rows,
  avgResponseTime1Hour: results[2].rows
  },
  totalTime: results.reduce((sum, r) => sum + r.executionTime, 0)
  }));
  }
  ];

  const analyticsResults = await tasklets.runAll(analyticsPromises);

  console.log('\nAnalytics Results:');
  analyticsResults.forEach(result => {
  console.log(`\n${result.category}:`);
  console.log(`  Execution time: ${result.totalTime}ms`);
  Object.entries(result.metrics).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
  });
  });

  return analyticsResults;
}

async function connectionPoolSimulation() {
  console.log('\nSimulating connection pool with parallel operations...');

  const poolSize = 10;
  const operations = 50;

  console.log(`Pool size: ${poolSize}, Operations: ${operations}`);

  const startTime = Date.now();

  // Simulate connection pool by limiting concurrent operations
  const results = [];
  for (let i = 0; i < operations; i += poolSize) {
  const batch = [];
  for (let j = 0; j < poolSize && i + j < operations; j++) {
  const operationId = i + j + 1;
  batch.push(() => {
  return queryDatabase(`SELECT * FROM table_${operationId % 5 + 1} WHERE id = ?`, [operationId]);
  });
  }
  const batchResults = await tasklets.runAll(batch);
  results.push(...batchResults);

  console.log(`  Completed batch ${Math.floor(i / poolSize) + 1}/${Math.ceil(operations / poolSize)}`);
  }

  const endTime = Date.now();

  console.log(`\nConnection pool results:`);
  console.log(`  Total operations: ${results.length}`);
  console.log(`  Total time: ${endTime - startTime}ms`);
  console.log(`  Average time per operation: ${((endTime - startTime) / results.length).toFixed(2)}ms`);

  const successful = results.filter(r => r.success);
  console.log(`  Success rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);

  return results;
}

// Run the example
(async () => {
  try {
  // Execute parallel queries
  await parallelDatabaseQueries();

  // Execute parallel transactions
  await parallelTransactions();

  // Run analytics
  await databaseAnalytics();

  // Simulate connection pool
  await connectionPoolSimulation();

  console.log('\nDatabase operations example completed!');
  } catch (error) {
  console.error('Error:', error.message);
  }
})(); 