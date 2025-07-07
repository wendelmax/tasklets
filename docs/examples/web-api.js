const tasklets = require('../../lib/tasklets');
const http = require('http');
const url = require('url');

console.log('Tasklets - Web API Example\n');

// Simulate database operations
class UserDatabase {
  constructor() {
  this.users = new Map();
  this.userId = 1;
  this.requests = 0;
  this.activeRequests = 0;
  }

  // Simulate database query with delay
  async queryUser(userId) {
  this.activeRequests++;
  console.log(`  [DB] Querying user ${userId} (active: ${this.activeRequests})`);

  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

  const user = this.users.get(userId);
  this.activeRequests--;

  return user || null;
  }

  // Simulate database insert with delay
  async createUser(userData) {
  this.activeRequests++;
  console.log(`  [DB] Creating user (active: ${this.activeRequests})`);

  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

  const user = {
  id: this.userId++,
  ...userData,
  createdAt: new Date().toISOString()
  };

  this.users.set(user.id, user);
  this.activeRequests--;

  return user;
  }

  // Simulate database update with delay
  async updateUser(userId, updates) {
  this.activeRequests++;
  console.log(`  [DB] Updating user ${userId} (active: ${this.activeRequests})`);

  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));

  const user = this.users.get(userId);
  if (!user) {
  this.activeRequests--;
  return null;
  }

  const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
  this.users.set(userId, updatedUser);
  this.activeRequests--;

  return updatedUser;
  }

  // Simulate complex analytics query
  async getAnalytics() {
  this.activeRequests++;
  console.log(`  [DB] Running analytics query (active: ${this.activeRequests})`);

  // Simulate complex query processing
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

  // Simulate heavy computation
  for (let i = 0; i < 100000; i++) {
  Math.sqrt(i);
  }

  const analytics = {
  totalUsers: this.users.size,
  activeUsers: Math.floor(Math.random() * this.users.size),
  averageAge: this.calculateAverageAge(),
  topUsers: this.getTopUsers(),
  timestamp: new Date().toISOString()
  };

  this.activeRequests--;
  return analytics;
  }

  calculateAverageAge() {
  if (this.users.size === 0) return 0;
  const ages = Array.from(this.users.values()).map(u => u.age || 25);
  return ages.reduce((sum, age) => sum + age, 0) / ages.length;
  }

  getTopUsers() {
  return Array.from(this.users.values())
  .sort((a, b) => (b.score || 0) - (a.score || 0))
  .slice(0, 5);
  }
}

// Request handler using virtual threads
class VirtualThreadRequestHandler {
  constructor(db) {
  this.db = db;
  this.requestCount = 0;
  this.activeRequests = 0;
  }

  // Handle GET request
  async handleGet(path, query) {
  this.requestCount++;
  this.activeRequests++;

  console.log(`  [${this.requestCount}] GET ${path} (active: ${this.activeRequests})`);

  try {
  if (path === '/users') {
  // Get all users - simulate heavy processing
  const users = Array.from(this.db.users.values());

  // Process each user in parallel using virtual threads
  const processedUsers = await this.processUsersInParallel(users);

  this.activeRequests--;
  return {
  status: 200,
  data: processedUsers,
  message: 'Users retrieved successfully'
  };
  }

  if (path.startsWith('/users/')) {
  const userId = parseInt(path.split('/')[2]);
  const user = await this.db.queryUser(userId);

  this.activeRequests--;
  if (user) {
  return {
  status: 200,
  data: user,
  message: 'User found'
  };
  } else {
  return {
  status: 404,
  error: 'User not found'
  };
  }
  }

  if (path === '/analytics') {
  // Run analytics in virtual thread to avoid blocking
  const analytics = await this.runAnalyticsInThread();

  this.activeRequests--;
  return {
  status: 200,
  data: analytics,
  message: 'Analytics generated successfully'
  };
  }

  this.activeRequests--;
  return {
  status: 404,
  error: 'Endpoint not found'
  };

  } catch (error) {
  this.activeRequests--;
  console.error(`  [${this.requestCount}] Error:`, error.message);
  return {
  status: 500,
  error: 'Internal server error'
  };
  }
  }

  // Handle POST request
  async handlePost(path, body) {
  this.requestCount++;
  this.activeRequests++;

  console.log(`  [${this.requestCount}] POST ${path} (active: ${this.activeRequests})`);

  try {
  if (path === '/users') {
  const user = await this.db.createUser(body);

  this.activeRequests--;
  return {
  status: 201,
  data: user,
  message: 'User created successfully'
  };
  }

  if (path.startsWith('/users/')) {
  const userId = parseInt(path.split('/')[2]);
  const user = await this.db.updateUser(userId, body);

  this.activeRequests--;
  if (user) {
  return {
  status: 200,
  data: user,
  message: 'User updated successfully'
  };
  } else {
  return {
  status: 404,
  error: 'User not found'
  };
  }
  }

  this.activeRequests--;
  return {
  status: 404,
  error: 'Endpoint not found'
  };

  } catch (error) {
  this.activeRequests--;
  console.error(`  [${this.requestCount}] Error:`, error.message);
  return {
  status: 500,
  error: 'Internal server error'
  };
  }
  }

  // Process users in parallel using virtual threads
  async processUsersInParallel(users) {
  if (users.length === 0) return [];

  const results = await tasklets.runAll(users.map((user, index) => () => {
  // Simulate user data processing
  const processed = {
  ...user,
  processedAt: new Date().toISOString(),
  score: this.calculateUserScore(user),
  status: this.determineUserStatus(user)
  };

  // Simulate some processing work
  for (let i = 0; i < 10000; i++) {
  Math.sqrt(i);
  }

  return processed;
  }));

  return results;
  }

  // Run analytics in virtual thread
  async runAnalyticsInThread() {
  return await tasklets.run(async () => {
  try {
  const analytics = await this.db.getAnalytics();

  // Additional processing in virtual thread
  const enhancedAnalytics = {
  ...analytics,
  processedAt: new Date().toISOString(),
  cacheKey: `analytics_${Date.now()}`,
  version: '1.0'
  };

  // Simulate additional computation
  for (let i = 0; i < 50000; i++) {
  Math.sqrt(i);
  }

  return enhancedAnalytics;
  } catch (error) {
  throw error;
  }
  });
  }

  // Calculate user score
  calculateUserScore(user) {
  let score = 0;
  score += (user.age || 25) * 2;
  score += (user.posts || 0) * 10;
  score += (user.followers || 0) * 5;
  return Math.floor(score);
  }

  // Determine user status
  determineUserStatus(user) {
  const score = this.calculateUserScore(user);
  if (score > 1000) return 'premium';
  if (score > 500) return 'active';
  if (score > 100) return 'regular';
  return 'new';
  }

  // Get statistics
  getStats() {
  return {
  totalRequests: this.requestCount,
  activeRequests: this.activeRequests,
  dbActiveRequests: this.db.activeRequests
  };
  }
}

// Create server
const db = new UserDatabase();
const handler = new VirtualThreadRequestHandler(db);

// Initialize with some sample users
async function initializeDatabase() {
  console.log('Initializing database with sample users...');

  const sampleUsers = [
  { name: 'Alice Johnson', age: 28, email: 'alice@example.com', posts: 45, followers: 1200 },
  { name: 'Bob Smith', age: 32, email: 'bob@example.com', posts: 23, followers: 850 },
  { name: 'Carol Davis', age: 25, email: 'carol@example.com', posts: 67, followers: 2100 },
  { name: 'David Wilson', age: 35, email: 'david@example.com', posts: 12, followers: 450 },
  { name: 'Eva Brown', age: 29, email: 'eva@example.com', posts: 89, followers: 3200 }
  ];

  // Create users in parallel using virtual threads
  const createdUsers = await tasklets.runAll(sampleUsers.map((user, index) => 
  () => db.createUser(user)
  ));

  console.log(`Created ${createdUsers.length} sample users\n`);
}

// HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
  res.writeHead(200);
  res.end();
  return;
  }

  // Parse body for POST requests
  let body = {};
  if (method === 'POST') {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', async () => {
  try {
  body = JSON.parse(data);
  } catch (e) {
  body = {};
  }

  const response = await handleRequest(method, path, body);
  sendResponse(res, response);
  });
  return;
  }

  const response = await handleRequest(method, path, {});
  sendResponse(res, response);
});

// Handle request based on method
async function handleRequest(method, path, body) {
  switch (method) {
  case 'GET':
  return await handler.handleGet(path, body);
  case 'POST':
  return await handler.handlePost(path, body);
  default:
  return {
  status: 405,
  error: 'Method not allowed'
  };
  }
}

// Send HTTP response
function sendResponse(res, response) {
  res.writeHead(response.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response, null, 2));
}

// Start server
const PORT = 3000;
server.listen(PORT, async () => {
  console.log(`Tasklets Web API Server running on http://localhost:${PORT}`);

  // Initialize database
  await initializeDatabase();

  console.log('\n Available endpoints:');
  console.log('  GET  /users  - Get all users (processed in parallel)');
  console.log('  GET  /users/:id  - Get specific user');
  console.log('  POST /users  - Create new user');
  console.log('  POST /users/:id  - Update user');
  console.log('  GET  /analytics  - Get analytics (heavy computation)');
  console.log('  GET  /stats  - Get server statistics');

  console.log('\n Test the API with multiple concurrent requests:');
  console.log('  curl http://localhost:3000/users');
  console.log('  curl http://localhost:3000/analytics');
  console.log('  curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"Test User","age":30}\'');

  console.log('\n Monitor virtual threads performance:');
  console.log('  curl http://localhost:3000/stats');

  console.log('\n Server ready! Press Ctrl+C to stop.\n');
});

// Add stats endpoint
const originalHandleGet = handler.handleGet.bind(handler);
handler.handleGet = async function(path, query) {
  if (path === '/stats') {
  const Taskletstats = tasklets.getStats();
  const handlerStats = this.getStats();

  return {
  status: 200,
  data: {
  virtualThreads: Taskletstats,
  requestHandler: handlerStats,
  database: {
  totalUsers: db.users.size,
  activeRequests: db.activeRequests
  },
  timestamp: new Date().toISOString()
  },
  message: 'Server statistics'
  };
  }

  return await originalHandleGet(path, query);
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  const finalStats = tasklets.getStats();
  console.log(`Final stats: ${finalStats.totalFibers} total fibers, ${finalStats.activeFibers} active`);
  server.close(() => {
  console.log('Server stopped');
  process.exit(0);
  });
});

// Example 1: Demonstrate concurrent user processing
console.log('1. Concurrent user processing demonstration:');
console.log('  The API processes multiple users in parallel using virtual threads');
console.log('  Each user request is handled independently without blocking others\n');

// Example 2: Show analytics processing
console.log('2. Heavy computation handling:');
console.log('  Analytics endpoint runs complex queries in virtual threads');
console.log('  Prevents blocking of other requests during heavy computation\n');

// Example 3: Database operation simulation
console.log('3. Database operation simulation:');
console.log('  Simulates real database delays and concurrent access');
console.log('  Virtual threads handle multiple database operations efficiently\n');

// Example 4: Request statistics
console.log('4. Request monitoring:');
console.log('  Tracks active requests and virtual thread usage');
console.log('  Provides real-time performance metrics\n');

console.log(' Key benefits demonstrated:');
console.log('  • Non-blocking request handling');
console.log('  • Parallel user data processing');
console.log('  • Efficient resource utilization');
console.log('  • Scalable concurrent operations');
console.log('  • Real-time performance monitoring\n'); 