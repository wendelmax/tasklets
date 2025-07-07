const tasklets = require('../../lib/tasklets');
const crypto = require('crypto');

(async () => {
console.log('Tasklets - Cryptography Examples\n');

// Cryptographic utility functions
class CryptoUtils {
  // Generate random bytes
  static generateRandomBytes(length) {
  return crypto.randomBytes(length);
  }

  // Hash data using different algorithms
  static hash(data, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(data).digest('hex');
  }

  // Generate key pair
  static generateKeyPair(modulusLength = 2048) {
  return crypto.generateKeyPairSync('rsa', {
  modulusLength: modulusLength,
  publicKeyEncoding: {
  type: 'spki',
  format: 'pem'
  },
  privateKeyEncoding: {
  type: 'pkcs8',
  format: 'pem'
  }
  });
  }

  // Encrypt data with RSA
  static encryptRSA(data, publicKey) {
  const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data, 'utf8'));
  return encrypted.toString('base64');
  }

  // Decrypt data with RSA
  static decryptRSA(encryptedData, privateKey) {
  const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
  return decrypted.toString('utf8');
  }

  // Generate AES key
  static generateAESKey(length = 32) {
  return crypto.randomBytes(length);
  }

  // Encrypt with AES
  static encryptAES(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
  encrypted: encrypted,
  iv: iv.toString('hex')
  };
  }

  // Decrypt with AES
  static decryptAES(encryptedData, key, iv) {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
  }

  // Brute force password cracking simulation
  static async simulatePasswordCrack(password, charset = 'abcdefghijklmnopqrstuvwxyz0123456789') {
  const targetHash = this.hash(password);
  let attempts = 0;
  const maxAttempts = 1000000; // Limit for demo

  for (let length = 1; length <= 6; length++) {
  const combinations = Math.pow(charset.length, length);

  for (let i = 0; i < Math.min(combinations, maxAttempts / 6); i++) {
  attempts++;

  // Generate candidate password
  let candidate = '';
  let temp = i;
  for (let j = 0; j < length; j++) {
  candidate = charset[temp % charset.length] + candidate;
  temp = Math.floor(temp / charset.length);
  }

  // Check if candidate matches
  if (this.hash(candidate) === targetHash) {
  return {
  found: true,
  password: candidate,
  attempts: attempts,
  time: Date.now()
  };
  }

  // Cooperative yielding for long operations
  if (attempts % 10000 === 0) {
  await new Promise(resolve => setTimeout(resolve, 0));
  }
  }
  }

  return {
  found: false,
  attempts: attempts,
  time: Date.now()
  };
  }

  // Generate secure random passwords
  static generateSecurePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
  password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
  }

  // Calculate entropy of a password
  static calculateEntropy(password) {
  const charset = new Set(password.split(''));
  const charsetSize = charset.size;
  const length = password.length;
  return Math.log2(Math.pow(charsetSize, length));
  }
}

// Example 1: Parallel hashing with different algorithms
console.log('1. Parallel Hashing with Multiple Algorithms:');
const testData = [
  'Hello, World!',
  'This is a test message for cryptography',
  'Another sample text for hashing demonstration',
  'Cryptographic hash functions are essential for security',
  'Tasklets enable parallel cryptographic operations'
];

const hashAlgorithms = ['md5', 'sha1', 'sha256', 'sha512', 'ripemd160'];

const hashResults = await tasklets.runAll(
  testData.flatMap(data => 
  hashAlgorithms.map(algorithm => () => {
  console.log(`  Hashing "${data.substring(0, 20)}..." with ${algorithm.toUpperCase()}`);

  const hash = CryptoUtils.hash(data, algorithm);
  const startTime = Date.now();

  // Simulate some processing time
  for (let i = 0; i < 10000; i++) {
  Math.sqrt(i);
  }

  return {
  data: data.substring(0, 20) + '...',
  algorithm: algorithm.toUpperCase(),
  hash: hash.substring(0, 16) + '...',
  fullHash: hash,
  processingTime: Date.now() - startTime
  };
  })
  )
);

console.log('  Hashing results:');
hashResults.forEach(result => {
  console.log(`  ${result.algorithm}: ${result.hash} (${result.processingTime}ms)`);
});
console.log();

// Example 2: RSA key generation and encryption
console.log('2. RSA Key Generation and Encryption:');
const rsaKeySizes = [1024, 2048, 3072, 4096];

const rsaResults = await tasklets.runAll(rsaKeySizes.map((keySize, index) => async () => {
  console.log(`  Generating ${keySize}-bit RSA key pair...`);

  const startTime = Date.now();
  const keyPair = CryptoUtils.generateKeyPair(keySize);
  const generationTime = Date.now() - startTime;

  // Test encryption/decryption
  const testMessage = `Test message for ${keySize}-bit RSA`;
  const encrypted = CryptoUtils.encryptRSA(testMessage, keyPair.publicKey);
  const decrypted = CryptoUtils.decryptRSA(encrypted, keyPair.privateKey);

  return {
  keySize,
  generationTime,
  publicKeyLength: keyPair.publicKey.length,
  privateKeyLength: keyPair.privateKey.length,
  encryptionSuccess: decrypted === testMessage,
  encryptedLength: encrypted.length
  };
}));

console.log('  RSA results:');
rsaResults.forEach(result => {
  console.log(`  ${result.keySize}-bit: ${result.generationTime}ms, success: ${result.encryptionSuccess}`);
  console.log(`  Public key: ${result.publicKeyLength} chars, Encrypted: ${result.encryptedLength} chars`);
});
console.log();

// Example 3: AES encryption with different key sizes
console.log('3. AES Encryption with Different Key Sizes:');
const aesKeySizes = [16, 24, 32]; // 128, 192, 256 bits
const testMessages = [
  'Short message',
  'This is a longer message for testing AES encryption with virtual threads',
  'Very long message that will be encrypted using different AES key sizes to demonstrate the capabilities of virtual threads in cryptographic operations'
];

const aesResults = await tasklets.runAll(
  aesKeySizes.flatMap((keySize, keySizeIndex) => 
  testMessages.map((message, messageIndex) => async () => {
  console.log(`  Encrypting message with ${keySize * 8}-bit AES...`);

  const key = CryptoUtils.generateAESKey(keySize);
  const startTime = Date.now();

  const encrypted = CryptoUtils.encryptAES(message, key);
  const decrypted = CryptoUtils.decryptAES(encrypted.encrypted, key, encrypted.iv);

  return {
  keySize: keySize * 8,
  messageLength: message.length,
  encryptedLength: encrypted.encrypted.length,
  processingTime: Date.now() - startTime,
  success: decrypted === message
  };
  })
  )
);

console.log('  AES results:');
aesResults.forEach(result => {
  console.log(`  ${result.keySize}-bit: ${result.processingTime}ms, success: ${result.success}`);
  console.log(`  Message: ${result.messageLength} chars, Encrypted: ${result.encryptedLength} chars`);
});
console.log();

// Example 4: Password security analysis
console.log('4. Password Security Analysis:');
const passwordCount = 1000;

const passwordResults = await tasklets.runAll(
  Array.from({ length: passwordCount }, (_, index) => async () => {
  const password = CryptoUtils.generateSecurePassword(8 + Math.floor(Math.random() * 12));
  const entropy = CryptoUtils.calculateEntropy(password);
  const hash = CryptoUtils.hash(password);

  // Simulate some processing
  for (let i = 0; i < 1000; i++) {
  Math.sqrt(i);
  }

  return {
  password: password.substring(0, 8) + '...',
  entropy: entropy.toFixed(2),
  hash: hash.substring(0, 16) + '...',
  strength: entropy > 50 ? 'Strong' : entropy > 30 ? 'Medium' : 'Weak'
  };
  })
);

// Analyze password strength distribution
const strengthCounts = passwordResults.reduce((acc, result) => {
  acc[result.strength] = (acc[result.strength] || 0) + 1;
  return acc;
}, {});

const avgEntropy = passwordResults.reduce((sum, result) => sum + parseFloat(result.entropy), 0) / passwordCount;

console.log('  Password analysis results:');
console.log(`  Total passwords generated: ${passwordCount}`);
console.log(`  Average entropy: ${avgEntropy.toFixed(2)} bits`);
Object.entries(strengthCounts).forEach(([strength, count]) => {
  console.log(`  ${strength} passwords: ${count} (${(count / passwordCount * 100).toFixed(1)}%)`);
});
console.log();

// Example 5: Brute force password cracking simulation
console.log('5. Brute Force Password Cracking Simulation:');
const testPasswords = ['abc', 'test', '12345', 'password', 'secret'];

const crackResults = await tasklets.runAll(
  testPasswords.map((password, index) => async () => {
  console.log(`  Attempting to crack password: "${password}"`);

  const startTime = Date.now();
  const result = await CryptoUtils.simulatePasswordCrack(password);
  const totalTime = Date.now() - startTime;

  return {
  target: password,
  found: result.found,
  attempts: result.attempts,
  time: totalTime,
  attemptsPerSecond: Math.floor(result.attempts / (totalTime / 1000))
  };
  })
);

console.log('  Password cracking results:');
crackResults.forEach(result => {
  if (result.found) {
  console.log(`  "${result.target}": CRACKED in ${result.time}ms (${result.attempts} attempts)`);
  } else {
  console.log(`  "${result.target}": Not cracked (${result.attempts} attempts, ${result.attemptsPerSecond}/sec)`);
  }
});
console.log();

// Example 6: Cryptographic performance benchmarking
console.log('6. Cryptographic Performance Benchmarking:');
const benchmarkOperations = [
  { name: 'SHA-256 Hashing', count: 10000, fn: () => CryptoUtils.hash('test data') },
  { name: 'MD5 Hashing', count: 10000, fn: () => CryptoUtils.hash('test data', 'md5') },
  { name: 'Random Bytes Generation', count: 1000, fn: () => CryptoUtils.generateRandomBytes(1024) },
  { name: 'AES Encryption', count: 1000, fn: () => {
  const key = CryptoUtils.generateAESKey();
  return CryptoUtils.encryptAES('test message', key);
  }},
  { name: 'Password Generation', count: 5000, fn: () => CryptoUtils.generateSecurePassword() }
];

const benchmarkThreads = tasklets.spawnMany(benchmarkOperations.length, async (index) => {
  const operation = benchmarkOperations[index];
  console.log(`  Benchmarking ${operation.name}...`);

  const startTime = Date.now();
  for (let i = 0; i < operation.count; i++) {
  await operation.fn();

  // Cooperative yielding for long operations
  if (i % 1000 === 0) {
  await new Promise(resolve => setTimeout(resolve, 0));
  }
  }
  const totalTime = Date.now() - startTime;

  return {
  operation: operation.name,
  count: operation.count,
  totalTime,
  operationsPerSecond: Math.floor(operation.count / (totalTime / 1000)),
  averageTime: totalTime / operation.count
  };
});

const benchmarkResults = await tasklets.joinMany(benchmarkThreads);

console.log('  Benchmark results:');
benchmarkResults.forEach(result => {
  console.log(`  ${result.operation}:`);
  console.log(`  ${result.count} operations in ${result.totalTime}ms`);
  console.log(`  ${result.operationsPerSecond} ops/sec, ${result.averageTime.toFixed(2)}ms avg`);
});
console.log();

// Example 7: Memory and performance analysis
console.log('7. Memory and Performance Analysis:');
const finalStats = tasklets.getStats();

console.log('  Virtual threads performance:');
console.log(`  Total fibers created: ${finalStats.totalFibers}`);
console.log(`  Active fibers: ${finalStats.activeFibers}`);
console.log(`  Total execution time: ${finalStats.totalExecutionTimeMs}ms`);

// Calculate cryptographic operations per second
const totalCryptoOps = hashResults.length + rsaResults.length + aesResults.length + 
  passwordResults.length + crackResults.length + benchmarkResults.length;

console.log(`  Total cryptographic operations: ${totalCryptoOps}`);
console.log(`  Operations per fiber: ${(totalCryptoOps / finalStats.totalFibers).toFixed(2)}`);
console.log(`  Fibers per second: ${(finalStats.totalFibers / (finalStats.totalExecutionTimeMs / 1000)).toFixed(1)}`);

// Memory usage estimation
const estimatedMemoryPerThread = 65536; // 64KB
const totalMemoryUsed = finalStats.totalFibers * estimatedMemoryPerThread;
console.log(`  Estimated memory used: ${(totalMemoryUsed / 1024 / 1024).toFixed(2)}MB`);

// Security analysis
console.log('\nSecurity Analysis:');
console.log(`  Strong passwords generated: ${strengthCounts.Strong || 0}`);
console.log(`  Average password entropy: ${avgEntropy.toFixed(2)} bits`);
console.log(`  Password cracking success rate: ${(crackResults.filter(r => r.found).length / crackResults.length * 100).toFixed(1)}%`);

console.log('\nKey benefits demonstrated:');
console.log('  • Parallel cryptographic operations');
console.log('  • CPU-intensive security computations');
console.log('  • Efficient key generation and encryption');
console.log('  • Scalable password analysis');
console.log('  • Real-time security benchmarking');
console.log('  • Memory-efficient cryptographic processing\n');

console.log('Cryptography example completed!');
})(); 