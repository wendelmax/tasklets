/**
 * @file cryptography.js
 * @description Benchmark for cryptographic operations using Tasklets.
 */
const tasklets = require('../../../lib');
const crypto = require('crypto');

class CryptoUtils {
  static hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  static generateKeyPair(modulusLength = 2048) {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
  }

  static encryptRSA(data, publicKey) {
    const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data, 'utf8'));
    return encrypted.toString('base64');
  }

  static generateAESKey(size) {
    return crypto.randomBytes(size);
  }

  static encryptAES(data, key) {
    const algorithm = `aes-${key.length * 8}-cbc`;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
  }

  static simulatePasswordCrack(password) {
    const targetHash = this.hash(password);
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // Highly simplified brute force simulation
    return new Promise(resolve => {
      let attempts = 0;
      const crack = () => {
        for (let i = 0; i < 1000; i++) {
          attempts++;
          if (attempts > 1000000) break; // Cap
        }
        resolve({ found: true, attempts });
      };
      crack();
    });
  }
}

async function runBenchmarks() {
  console.log('Tasklets - Cryptography Examples\n');

  // 1. Parallel Hashing
  console.log('1. Parallel Hashing with Multiple Algorithms:');
  const testData = "Hello, World! " + "A".repeat(1000);
  const algorithms = ['md5', 'sha1', 'sha256', 'sha512'];

  const hashResults = await tasklets.runAll(algorithms.map(algo => () => {
    return { algo, hash: CryptoUtils.hash(testData, algo) };
  }));
  hashResults.forEach(r => console.log(`  ${r.algo.toUpperCase()}: ${r.hash.substring(0, 32)}...`));

  // 2. RSA Key Generation and Encryption
  console.log('\n2. RSA Key Generation and Encryption:');
  const rsaSizes = [1024, 2048];
  const rsaResults = await tasklets.runAll(rsaSizes.map(size => () => {
    const kp = CryptoUtils.generateKeyPair(size);
    const enc = CryptoUtils.encryptRSA("Secret Message", kp.publicKey);
    return { size, pubLen: kp.publicKey.length, encLen: enc.length };
  }));
  rsaResults.forEach(r => console.log(`  ${r.size}-bit: Pub=${r.pubLen} chars, Enc=${r.encLen} chars`));

  // 3. AES Encryption
  console.log('\n3. AES Encryption with Different Key Sizes:');
  const aesSizes = [16, 32];
  const aesResults = await tasklets.runAll(aesSizes.map(size => () => {
    const key = CryptoUtils.generateAESKey(size);
    const enc = CryptoUtils.encryptAES("AES Secret", key);
    return { size: size * 8, encLen: enc.encrypted.length };
  }));
  aesResults.forEach(r => console.log(`  AES-${r.size}: Encrypted=${r.encLen} chars`));

  console.log('\nCryptography benchmarks completed!');
}

runBenchmarks().catch(console.error);