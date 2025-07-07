const tasklets = require('../../lib/tasklets');

console.log('Tasklets - Real-World E-commerce Order Processing\n');

// Simulate real-world e-commerce system components
class EcommerceSystem {
  constructor() {
  this.inventory = new Map();
  this.orders = new Map();
  this.payments = new Map();
  this.shipping = new Map();
  this.notifications = [];
  this.analytics = {
  ordersProcessed: 0,
  totalRevenue: 0,
  averageProcessingTime: 0
  };

  // Initialize with sample inventory
  this.initializeInventory();
  }

  initializeInventory() {
  const products = [
  { id: 'P001', name: 'Smartphone', price: 599.99, stock: 50 },
  { id: 'P002', name: 'Laptop', price: 1299.99, stock: 25 },
  { id: 'P003', name: 'Headphones', price: 199.99, stock: 100 },
  { id: 'P004', name: 'Tablet', price: 399.99, stock: 30 },
  { id: 'P005', name: 'Smartwatch', price: 299.99, stock: 75 }
  ];

  products.forEach(product => {
  this.inventory.set(product.id, { ...product });
  });
  }

  // Simulate inventory check with delay
  async checkInventory(productId, quantity) {
  console.log(`  Checking inventory for ${productId} (qty: ${quantity})`);

  // Simulate database query delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

  const product = this.inventory.get(productId);
  if (!product) {
  throw new Error(`Product ${productId} not found`);
  }

  const available = product.stock >= quantity;
  console.log(`  ${available ? 'Inventory check: Available' : 'Inventory check: Insufficient stock'}`);

  return { available, product, requestedQuantity: quantity };
  }

  // Simulate payment processing with delay
  async processPayment(orderId, amount, paymentMethod) {
  console.log(`  💳 Processing payment for order ${orderId} ($${amount})`);

  // Simulate payment gateway delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

  // Simulate payment success/failure
  const success = Math.random() > 0.1; // 90% success rate

  if (success) {
  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  this.payments.set(paymentId, {
  orderId,
  amount,
  method: paymentMethod,
  status: 'completed',
  timestamp: new Date().toISOString()
  });

  console.log(`  Payment processed: ${paymentId}`);
  return { success: true, paymentId, amount };
  } else {
  console.log(`  Payment failed for order ${orderId}`);
  return { success: false, error: 'Payment declined' };
  }
  }

  // Simulate shipping calculation with delay
  async calculateShipping(orderId, items, address) {
  console.log(`  🚚 Calculating shipping for order ${orderId}`);

  // Simulate shipping API delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  const shippingCost = Math.max(5.99, totalWeight * 2.5);
  const estimatedDays = Math.floor(Math.random() * 5) + 3; // 3-7 days

  const shippingId = `SHIP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  this.shipping.set(shippingId, {
  orderId,
  cost: shippingCost,
  estimatedDays,
  address,
  status: 'calculated'
  });

  console.log(`  Shipping calculated: $${shippingCost} (${estimatedDays} days)`);
  return { shippingId, cost: shippingCost, estimatedDays };
  }

  // Simulate notification sending
  async sendNotification(userId, type, data) {
  console.log(`  Sending ${type} notification to user ${userId}`);

  // Simulate notification service delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25));

  const notification = {
  id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId,
  type,
  data,
  timestamp: new Date().toISOString(),
  status: 'sent'
  };

  this.notifications.push(notification);
  console.log(`  Notification sent: ${notification.id}`);
  return notification;
  }

  // Simulate analytics processing
  async updateAnalytics(orderData) {
  console.log(`  Updating analytics for order ${orderData.orderId}`);

  // Simulate analytics processing delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 80 + 40));

  this.analytics.ordersProcessed++;
  this.analytics.totalRevenue += orderData.totalAmount;
  this.analytics.averageProcessingTime = 
  (this.analytics.averageProcessingTime * (this.analytics.ordersProcessed - 1) + orderData.processingTime) / 
  this.analytics.ordersProcessed;

  console.log(`  Analytics updated: ${this.analytics.ordersProcessed} orders processed`);
  return this.analytics;
  }
}

// Order processing worker using virtual threads
class OrderProcessor {
  constructor(system) {
  this.system = system;
  this.processingStats = {
  totalOrders: 0,
  successfulOrders: 0,
  failedOrders: 0,
  averageProcessingTime: 0
  };
  }

  // Process a single order with context switching
  async processOrder(orderData) {
  const orderId = orderData.orderId;
  const startTime = Date.now();

  console.log(`\n🛒 Processing order ${orderId} for ${orderData.customerName}`);

  try {
  // Step 1: Inventory check (CPU-intensive)
  console.log(`  Step 1: Inventory validation`);
  const inventoryChecks = await this.checkInventoryForOrder(orderData.items);

  // Context switch - yield to other orders
  console.log(`  Order ${orderId} yielding after inventory check`);
  await new Promise(resolve => setTimeout(resolve, 0)); // Simulate context switch
  console.log(`  Order ${orderId} resumed after inventory check`);

  // Step 2: Payment processing (I/O-intensive)
  console.log(`  Step 2: Payment processing`);
  const paymentResult = await this.system.processPayment(
  orderId, 
  orderData.totalAmount, 
  orderData.paymentMethod
  );

  if (!paymentResult.success) {
  throw new Error(`Payment failed: ${paymentResult.error}`);
  }

  // Context switch - yield to other orders
  console.log(`  Order ${orderId} yielding after payment`);
  await new Promise(resolve => setTimeout(resolve, 0)); // Simulate context switch
  console.log(`  Order ${orderId} resumed after payment`);

  // Step 3: Shipping calculation (API call simulation)
  console.log(`  Step 3: Shipping calculation`);
  const shippingResult = await this.system.calculateShipping(
  orderId,
  orderData.items,
  orderData.shippingAddress
  );

  // Context switch - yield to other orders
  console.log(`  Order ${orderId} yielding after shipping`);
  await new Promise(resolve => setTimeout(resolve, 0)); // Simulate context switch
  console.log(`  Order ${orderId} resumed after shipping`);

  // Step 4: Update inventory (Database operation)
  console.log(`  Step 4: Inventory update`);
  await this.updateInventoryForOrder(orderData.items);

  // Context switch - yield to other orders
  console.log(`  Order ${orderId} yielding after inventory update`);
  await new Promise(resolve => setTimeout(resolve, 0)); // Simulate context switch
  console.log(`  Order ${orderId} resumed after inventory update`);

  // Step 5: Send notifications (Async operations)
  console.log(`  Step 5: Sending notifications`);
  const notifications = await this.sendOrderNotifications(orderData, paymentResult, shippingResult);

  // Context switch - yield to other orders
  console.log(`  Order ${orderId} yielding after notifications`);
  await new Promise(resolve => setTimeout(resolve, 0)); // Simulate context switch
  console.log(`  Order ${orderId} resumed after notifications`);

  // Step 6: Update analytics (Background processing)
  console.log(`  Step 6: Analytics update`);
  const processingTime = Date.now() - startTime;
  await this.system.updateAnalytics({
  orderId,
  totalAmount: orderData.totalAmount,
  processingTime
  });

  // Final context switch
  console.log(`  Order ${orderId} yielding before completion`);
  await new Promise(resolve => setTimeout(resolve, 0)); // Simulate context switch
  console.log(`  Order ${orderId} completing`);

  const totalTime = Date.now() - startTime;
  console.log(`  Order ${orderId} completed successfully in ${totalTime}ms`);

  return {
  orderId,
  status: 'completed',
  processingTime: totalTime,
  paymentId: paymentResult.paymentId,
  shippingId: shippingResult.shippingId,
  notifications: notifications.length
  };

  } catch (error) {
  const totalTime = Date.now() - startTime;
  console.log(`  Order ${orderId} failed after ${totalTime}ms: ${error.message}`);

  // Send failure notification
  await this.system.sendNotification(
  orderData.customerId,
  'order_failed',
  { orderId, error: error.message }
  );

  return {
  orderId,
  status: 'failed',
  processingTime: totalTime,
  error: error.message
  };
  }
  }

  // Check inventory for all items in order
  async checkInventoryForOrder(items) {
  const checks = [];
  for (const item of items) {
  const check = await this.system.checkInventory(item.productId, item.quantity);
  checks.push(check);

  if (!check.available) {
  throw new Error(`Insufficient stock for product ${item.productId}`);
  }
  }
  return checks;
  }

  // Update inventory after successful order
  async updateInventoryForOrder(items) {
  console.log(`  Updating inventory for order items`);

  for (const item of items) {
  const product = this.system.inventory.get(item.productId);
  product.stock -= item.quantity;

  // Simulate database update delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 15));

  console.log(`  Updated ${item.productId}: ${product.stock} remaining`);
  }
  }

  // Send all notifications for order
  async sendOrderNotifications(orderData, paymentResult, shippingResult) {
  const notifications = [];

  // Order confirmation
  notifications.push(await this.system.sendNotification(
  orderData.customerId,
  'order_confirmed',
  { orderId: orderData.orderId, totalAmount: orderData.totalAmount }
  ));

  // Payment confirmation
  notifications.push(await this.system.sendNotification(
  orderData.customerId,
  'payment_confirmed',
  { orderId: orderData.orderId, paymentId: paymentResult.paymentId }
  ));

  // Shipping confirmation
  notifications.push(await this.system.sendNotification(
  orderData.customerId,
  'shipping_confirmed',
  { orderId: orderData.orderId, shippingId: shippingResult.shippingId, estimatedDays: shippingResult.estimatedDays }
  ));

  return notifications;
  }

  // Process multiple orders in parallel with context switching
  async processMultipleOrders(orders) {
  console.log(`\nStarting parallel processing of ${orders.length} orders`);

  const startTime = Date.now();

  // Process orders using tasklets
  const results = await tasklets.runAll(
  orders.map(order => () => this.processOrder(order))
  );

  const totalTime = Date.now() - startTime;

  // Analyze results
  const successful = results.filter(r => r.status === 'completed');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`\nOrder Processing Summary:`);
  console.log(`  Total orders: ${orders.length}`);
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Success rate: ${(successful.length / orders.length * 100).toFixed(1)}%`);
  console.log(`  Total processing time: ${totalTime}ms`);
  console.log(`  Average time per order: ${(totalTime / orders.length).toFixed(1)}ms`);

  if (successful.length > 0) {
  const avgProcessingTime = successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length;
  console.log(`  Average successful order time: ${avgProcessingTime.toFixed(1)}ms`);
  }

  return {
  results,
  summary: {
  total: orders.length,
  successful: successful.length,
  failed: failed.length,
  successRate: (successful.length / orders.length * 100).toFixed(1),
  totalTime,
  averageTime: (totalTime / orders.length).toFixed(1)
  }
  };
  }
}

// Example usage with real-world scenario
async function runEcommerceExample() {
  console.log('🏪 Real-World E-commerce Order Processing Example\n');

  // Initialize system
  const system = new EcommerceSystem();
  const processor = new OrderProcessor(system);

  // Create realistic order data
  const orders = [
  {
  orderId: 'ORD-001',
  customerId: 'CUST-001',
  customerName: 'John Smith',
  items: [
  { productId: 'P001', quantity: 1, weight: 0.5 },
  { productId: 'P003', quantity: 2, weight: 0.3 }
  ],
  totalAmount: 999.97,
  paymentMethod: 'credit_card',
  shippingAddress: '123 Main St, City, State 12345'
  },
  {
  orderId: 'ORD-002',
  customerId: 'CUST-002',
  customerName: 'Jane Doe',
  items: [
  { productId: 'P002', quantity: 1, weight: 2.5 },
  { productId: 'P005', quantity: 1, weight: 0.2 }
  ],
  totalAmount: 1599.98,
  paymentMethod: 'paypal',
  shippingAddress: '456 Oak Ave, City, State 12345'
  },
  {
  orderId: 'ORD-003',
  customerId: 'CUST-003',
  customerName: 'Bob Johnson',
  items: [
  { productId: 'P004', quantity: 1, weight: 1.0 },
  { productId: 'P003', quantity: 1, weight: 0.3 }
  ],
  totalAmount: 599.98,
  paymentMethod: 'credit_card',
  shippingAddress: '789 Pine Rd, City, State 12345'
  },
  {
  orderId: 'ORD-004',
  customerId: 'CUST-004',
  customerName: 'Alice Brown',
  items: [
  { productId: 'P001', quantity: 2, weight: 1.0 },
  { productId: 'P005', quantity: 1, weight: 0.2 }
  ],
  totalAmount: 1499.97,
  paymentMethod: 'bank_transfer',
  shippingAddress: '321 Elm St, City, State 12345'
  },
  {
  orderId: 'ORD-005',
  customerId: 'CUST-005',
  customerName: 'Charlie Wilson',
  items: [
  { productId: 'P002', quantity: 1, weight: 2.5 }
  ],
  totalAmount: 1299.99,
  paymentMethod: 'credit_card',
  shippingAddress: '654 Maple Dr, City, State 12345'
  }
  ];

  console.log('Orders to process:');
  orders.forEach(order => {
  console.log(`  ${order.orderId}: ${order.customerName} - $${order.totalAmount}`);
  });

  // Process orders with context switching
  const result = await processor.processMultipleOrders(orders);

  // Display final system state
  console.log('\n🏪 Final System State:');
  console.log(`  Inventory items: ${system.inventory.size}`);
  console.log(`  Processed payments: ${system.payments.size}`);
  console.log(`  Shipping records: ${system.shipping.size}`);
  console.log(`  Notifications sent: ${system.notifications.length}`);
  console.log(`  Analytics - Orders processed: ${system.analytics.ordersProcessed}`);
  console.log(`  Analytics - Total revenue: $${system.analytics.totalRevenue.toFixed(2)}`);
  console.log(`  Analytics - Average processing time: ${system.analytics.averageProcessingTime.toFixed(1)}ms`);

  // Tasklets performance
  const taskletStats = tasklets.getStats();
  console.log('\nTasklets Performance:');
  console.log(`  Total tasklets created: ${taskletStats.totalTaskletsCreated || 0}`);
  console.log(`  Active tasklets: ${taskletStats.activeTasklets || 0}`);
  console.log(`  Completed tasklets: ${taskletStats.completedTasklets || 0}`);
  console.log(`  Success rate: ${taskletStats.successRate ? taskletStats.successRate.toFixed(1) : 'N/A'}%`);

  console.log('\nKey benefits demonstrated:');
  console.log('  • Real-world e-commerce order processing');
  console.log('  • Context switching between different service calls');
  console.log('  • Parallel processing of multiple orders');
  console.log('  • Efficient resource utilization');
  console.log('  • Scalable order processing system');
  console.log('  • Real-time performance monitoring\n');

  return result;
}

// Run the example
(async () => {
  await runEcommerceExample();
})(); 