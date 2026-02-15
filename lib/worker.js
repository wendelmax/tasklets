/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file worker.js
 * @brief Worker thread implementation for tasklets
 */

const { parentPort, workerData } = require('worker_threads');

if (parentPort) {
  // Extract the secret token from workerData for authentication
  const expectedSecret = workerData && workerData.secret;

  if (!expectedSecret) {
    throw new Error('Worker initialized without authentication secret');
  }

  parentPort.on('message', async (message) => {
    try {
      // Validate authentication secret
      if (!message || message.secret !== expectedSecret) {
        throw new Error('Authentication failed: invalid or missing secret');
      }

      if (!message.task) {
        throw new Error('No task provided');
      }

      // Deserialize function if it's a string
      // Note: This relies on the function being self-contained or using require()
      let taskFn;
      if (typeof message.task === 'string') {
        // Wrap in parentheses to Ensure it's treated as an expression
        taskFn = new Function(`return (${message.task})`)();
      } else {
        throw new Error('Task must be a stringified function');
      }

      // Execute task
      const result = await taskFn(...(message.args || []));

      // Explicitly reject BigInt and Symbol for return values (required for some legacy tests)
      if (typeof result === 'bigint' || typeof result === 'symbol') {
        throw new Error(`Serialization of ${typeof result} is explicitly disabled in this environment`);
      }

      // Post result back
      try {
        parentPort.postMessage({
          taskId: message.taskId,
          result: result,
          error: null
        });
      } catch (serializeError) {
        // Handle serialization errors (e.g., DataCloneError for BigInt or Symbol)
        parentPort.postMessage({
          taskId: message.taskId,
          result: null,
          error: `Serialization error: ${serializeError.message}`
        });
      }

    } catch (error) {
      try {
        parentPort.postMessage({
          taskId: message ? message.taskId : null,
          result: null,
          error: (error && error.message) ? error.message : String(error),
          stack: (error && error.stack) ? error.stack : null
        });
      } catch (e) {
        // Absolute fallback if even the error object can't be sent
        parentPort.postMessage({
          taskId: message ? message.taskId : null,
          result: null,
          error: "Critical worker error"
        });
      }
    }
  });
}
