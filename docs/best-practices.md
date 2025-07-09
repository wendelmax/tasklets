# Best Practices

This guide outlines recommended patterns and practices for using **Tasklets** effectively. Following these guides is crucial for writing safe, performant, and scalable applications.

## Core Safety Principles: Preventing Crashes and Race Conditions

Before diving into API specifics, it's crucial to understand the fundamental model for writing safe, threaded code with Tasklets. Following these principles will prevent common but severe bugs like `segfaults` (application crashes) and race conditions (data corruption).

### The "Data In, Data Out" Principle

The safest and most performant way to use `tasklets` is to treat your tasks like pure functions: they should receive data as input, perform computations on that data, and return a result. They should not rely on or modify any shared state from the parent scope.

#### Why Avoid Shared State?

When you run code on a separate thread, accessing shared variables from the main thread (closures) can lead to unpredictable behavior known as **race conditions**. Multiple threads trying to read and write to the same variable at the same time can corrupt data and crash your application.

####  Bad Example: Using Shared State (High Risk)

```javascript
const { tasklet } = require('tasklets');

let itemsProcessed = 0;

// This task function is impure. It modifies a variable outside its own scope.
function processItem() {
  // some heavy work...
  itemsProcessed++; // RACE CONDITION! This is not safe.
}

// Running this in parallel will lead to incorrect results for `itemsProcessed`.
for (let i = 0; i < 10; i++) {
  tasklet.run(processItem);
}
```

###  Good Example: Passing Data Explicitly

The correct approach is to pass all necessary data to your task as arguments and get the result back through the returned `Promise`. This makes your tasks independent and thread-safe.

Our API is designed for this pattern. The `tasklet.run()` method accepts your function as the first argument, and an array of arguments for that function as the second.

```javascript
const { tasklet } = require('tasklets');

// This task function is pure. It only operates on the data it receives.
const myTask = (taskData) => {
  // perform heavy work on taskData...
  const result = taskData.value * 2;
  return { result }; // Return a new object with the result.
};

const promises = [];
for (let i = 0; i < 10; i++) {
  // Pass the data the function needs as the second argument.
  // Our C++ addon will safely transfer this data to the worker thread.
  const promise = tasklet.run(myTask, [{ value: i }]);
  promises.push(promise);
}

// The results are safely collected via Promises on the main thread.
Promise.all(promises).then(results => {
  console.log('All tasks complete:', results);
  // Total can be safely calculated here after all tasks are done.
  const total = results.length;
  console.log(`${total} items processed.`);
});
```

### Key Takeaways for JavaScript Developers

1.  **Pass, Don't Share:** Always pass data to your tasklets via arguments. Avoid accessing or modifying variables from the parent scope.
2.  **Return, Don't Mutate:** Your tasklet should return a new value or object. It should not modify the input arguments (side effects), as this can lead to unpredictable behavior.
3.  **Self-Contained Logic:** A tasklet should contain all the logic it needs to run. Avoid making calls to functions defined outside the task that rely on external state.

By following this "Data In, Data Out" model, you eliminate race conditions, make your code easier to reason about, and allow the `tasklets` engine to achieve maximum performance and scalability.

---

## Best Practices for C++ Contributors

For those contributing to the C++ core of this library, maintaining stability is paramount.

1.  **Embrace Smart Pointers:**
  *  Use `std::shared_ptr` for objects with shared ownership, like `Tasklet` instances, to automate memory management and prevent use-after-free errors.
  *  Use `std::unique_ptr` for objects with a single, clear owner to ensure exclusive ownership and automatic cleanup.

2.  **Strict Concurrency Control:**
  *  Protect all access to shared data structures (e.g., queues, lists accessed by multiple threads) with `std::mutex` and `std::lock_guard`. The `lock_guard` pattern ensures mutexes are always released.

3.  **Isolate Node.js from Worker Threads:**
  *  **Never** use `Napi::` types (like `Napi::Object`, `Napi::Function`, or `Napi::Env`) inside a C++ worker thread.
  *  All data must be copied from JavaScript objects into plain C++ data structures before being passed to a worker.
  *  Results must be passed back to the main Node.js thread via a `Napi::ThreadSafeFunction`, which is the only safe way to communicate back from a worker.

4.  **Defensive N-API Programming:**
  *  Always check for pending JavaScript exceptions using `env.IsExceptionPending()` after N-API calls that can fail. If an exception is pending, stop execution and return immediately.
  *  Use `Napi::HandleScope` in every function that interacts with the JavaScript engine to ensure proper garbage collection of handles.