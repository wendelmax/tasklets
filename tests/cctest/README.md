# Tasklets C++ Test Suite (cctest)

This directory contains the C++ test suite for the Tasklets library using a custom testing framework called `cctest`.

## Overview

The cctest suite provides comprehensive testing for all core components of the Tasklets library:

- **Base Components**: Tasklet, MicroJob, Logger
- **Threading**: NativeThreadPool, Multiprocessor
- **Monitoring**: Stats collection and analysis
- **Automation**: AutoConfig, AutoScheduler
- **Memory Management**: MemoryManager, ObjectPool

## Test Files

### Core Tests
- `test_tasklet.cpp` - Tests for the Tasklet class
- `test_microjob.cpp` - Tests for the MicroJob structure
- `test_native_thread_pool.cpp` - Tests for thread pool functionality
- `test_stats.cpp` - Tests for statistics collection
- `test_logger.cpp` - Tests for logging functionality

### New Component Tests
- `test_auto_config.cpp` - Tests for automatic configuration system
- `test_memory_manager.cpp` - Tests for memory management
- `test_auto_scheduler.cpp` - Tests for automatic scheduling

### Framework Files
- `cctest.h` - Testing framework header
- `cctest.cpp` - Testing framework implementation
- `test_runner.cpp` - Main test runner and CLI

## Running Tests

### Using the Build Script

The easiest way to run tests is using the provided build script:

```bash
# Run all tests
./scripts/run_cctest.sh

# Run with verbose output
./scripts/run_cctest.sh -v

# List all available tests
./scripts/run_cctest.sh -l

# Run a specific test
./scripts/run_cctest.sh TaskletConstruction

# Only compile (don't run)
./scripts/run_cctest.sh compile

# Clean build directory
./scripts/run_cctest.sh clean

# Show help
./scripts/run_cctest.sh --help
```

### Manual Compilation

If you prefer to compile manually:

```bash
# Create build directory
mkdir -p build

# Compile test suite
g++ -std=c++17 -Wall -Wextra -O2 -g \
    -Isrc -Itests/cctest \
    tests/cctest/*.cpp \
    src/core/base/*.cpp \
    src/core/monitoring/*.cpp \
    src/core/threading/*.cpp \
    src/core/automation/*.cpp \
    src/core/memory/*.cpp \
    -o build/cctest \
    -luv -lpthread

# Run tests
./build/cctest

# Run with verbose output
./build/cctest -v

# List tests
./build/cctest -l

# Run specific test
./build/cctest TaskletConstruction
```

## Test Framework Features

### Assertion Macros
- `ASSERT_TRUE(condition)` - Assert condition is true
- `ASSERT_FALSE(condition)` - Assert condition is false
- `ASSERT_EQ(expected, actual)` - Assert equality
- `ASSERT_NE(expected, actual)` - Assert inequality
- `ASSERT_LT(left, right)` - Assert less than
- `ASSERT_LE(left, right)` - Assert less than or equal
- `ASSERT_GT(left, right)` - Assert greater than
- `ASSERT_GE(left, right)` - Assert greater than or equal
- `ASSERT_STREQ(expected, actual)` - Assert string equality
- `ASSERT_STRNE(expected, actual)` - Assert string inequality
- `ASSERT_NULLPTR(ptr)` - Assert pointer is null
- `ASSERT_NOT_NULLPTR(ptr)` - Assert pointer is not null
- `FAIL(message)` - Force test failure

### Test Registration
```cpp
// Automatic registration with TEST macro
TEST(MyTestName) {
    // Test code here
    ASSERT_TRUE(some_condition);
}

// Manual registration
void my_test_function() {
    // Test code here
}
REGISTER_TEST(my_test_function);
```

## Test Categories

### Unit Tests
- Individual component functionality
- State management
- Error handling
- Edge cases

### Integration Tests
- Component interactions
- Thread safety
- Memory management
- Performance characteristics

### Stress Tests
- High load scenarios
- Concurrent access
- Memory pressure
- Long-running operations

## Adding New Tests

1. Create a new test file: `test_component_name.cpp`
2. Include the necessary headers:
   ```cpp
   #include "cctest.h"
   #include "../../src/core/path/to/component.hpp"
   ```
3. Use the TEST macro for automatic registration:
   ```cpp
   TEST(ComponentNameTest) {
       // Test implementation
   }
   ```
4. Add the test file to `test_runner.cpp` includes
5. Update the build script if needed

## Test Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Isolation**: Each test should be independent and not rely on other tests
3. **Cleanup**: Always clean up resources in tests
4. **Assertions**: Use specific assertions rather than generic ones
5. **Edge Cases**: Test boundary conditions and error scenarios
6. **Thread Safety**: Test concurrent access patterns
7. **Performance**: Include performance tests for critical paths

## Dependencies

- **Compiler**: C++17 compatible compiler (g++, clang++)
- **libuv**: For async I/O and timers
- **pthread**: For threading support

## Troubleshooting

### Compilation Issues
- Ensure you have a C++17 compatible compiler
- Check that libuv is installed and accessible
- Verify all source files exist and are accessible

### Runtime Issues
- Check that the test binary has execute permissions
- Ensure libuv and pthread libraries are available
- Look for missing implementation files

### Test Failures
- Run with verbose output to see detailed failure information
- Check that all dependencies are properly initialized
- Verify that test environment is clean

## Continuous Integration

The test suite is designed to be easily integrated into CI/CD pipelines:

```bash
# CI script example
#!/bin/bash
set -e
./scripts/run_cctest.sh -v
```

## Coverage

The test suite aims to provide comprehensive coverage of:

- ✅ All public APIs
- ✅ Error handling paths
- ✅ Thread safety scenarios
- ✅ Memory management
- ✅ Performance characteristics
- ✅ Integration scenarios

## Contributing

When adding new features to Tasklets, please:

1. Add corresponding tests for new functionality
2. Update existing tests if APIs change
3. Ensure all tests pass before submitting changes
4. Add integration tests for complex features
5. Update this README if test structure changes 