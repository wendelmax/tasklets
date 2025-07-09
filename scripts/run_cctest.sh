#!/bin/bash

# Tasklets C++ Test Suite Runner
# This script compiles and runs the cctest suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
TEST_DIR="tests/cctest"
SRC_DIR="src"
CCTEST_BINARY="${BUILD_DIR}/cctest"

# Compiler settings
CXX=${CXX:-g++}
CXXFLAGS="-std=c++17 -Wall -Wextra -O2 -g"
INCLUDES="-I${SRC_DIR} -I${TEST_DIR}"
LIBS="-luv -lpthread"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v $CXX &> /dev/null; then
        print_error "Compiler $CXX not found"
        exit 1
    fi
    
    if ! pkg-config --exists libuv; then
        print_warning "libuv not found via pkg-config, trying direct linking"
    fi
    
    print_success "Dependencies check completed"
}

# Function to create build directory
create_build_dir() {
    print_status "Creating build directory..."
    mkdir -p $BUILD_DIR
    print_success "Build directory ready"
}

# Function to compile tests
compile_tests() {
    print_status "Compiling test suite..."
    
    # Source files
    SRC_FILES=(
        "${TEST_DIR}/cctest.cpp"
        "${TEST_DIR}/test_runner.cpp"
        "${TEST_DIR}/test_tasklet.cpp"
        "${TEST_DIR}/test_microjob.cpp"
        "${TEST_DIR}/test_native_thread_pool.cpp"
        "${TEST_DIR}/test_stats.cpp"
        "${TEST_DIR}/test_logger.cpp"
        "${TEST_DIR}/test_auto_config.cpp"
        "${TEST_DIR}/test_memory_manager.cpp"
        "${TEST_DIR}/test_auto_scheduler.cpp"
    )
    
    # Implementation files (if they exist)
    IMPL_FILES=(
        "${SRC_DIR}/core/base/tasklet.cpp"
        "${SRC_DIR}/core/base/microjob.cpp"
        "${SRC_DIR}/core/base/logger.cpp"
        "${SRC_DIR}/core/monitoring/stats.cpp"
        "${SRC_DIR}/core/threading/native_thread_pool.cpp"
        "${SRC_DIR}/core/threading/multiprocessor.cpp"
        "${SRC_DIR}/core/automation/auto_config.cpp"
        "${SRC_DIR}/core/automation/auto_scheduler.cpp"
        "${SRC_DIR}/core/memory/memory_manager.cpp"
    )
    
    # Build command
    CMD="$CXX $CXXFLAGS $INCLUDES"
    
    # Add source files that exist
    for file in "${SRC_FILES[@]}"; do
        if [ -f "$file" ]; then
            CMD="$CMD $file"
        else
            print_warning "Source file not found: $file"
        fi
    done
    
    # Add implementation files that exist
    for file in "${IMPL_FILES[@]}"; do
        if [ -f "$file" ]; then
            CMD="$CMD $file"
        else
            print_warning "Implementation file not found: $file"
        fi
    done
    
    CMD="$CMD -o $CCTEST_BINARY $LIBS"
    
    print_status "Running: $CMD"
    eval $CMD
    
    if [ $? -eq 0 ]; then
        print_success "Compilation successful"
    else
        print_error "Compilation failed"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    print_status "Running test suite..."
    
    if [ ! -f "$CCTEST_BINARY" ]; then
        print_error "Test binary not found: $CCTEST_BINARY"
        exit 1
    fi
    
    # Parse command line arguments
    VERBOSE=""
    TEST_NAME=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE="-v"
                shift
                ;;
            -l|--list)
                $CCTEST_BINARY -l
                exit 0
                ;;
            -h|--help)
                $CCTEST_BINARY -h
                exit 0
                ;;
            *)
                TEST_NAME="$1"
                shift
                ;;
        esac
    done
    
    # Run tests
    if [ -n "$TEST_NAME" ]; then
        print_status "Running specific test: $TEST_NAME"
        $CCTEST_BINARY $VERBOSE "$TEST_NAME"
    else
        print_status "Running all tests"
        $CCTEST_BINARY $VERBOSE
    fi
    
    if [ $? -eq 0 ]; then
        print_success "All tests passed!"
    else
        print_error "Some tests failed"
        exit 1
    fi
}

# Function to clean build
clean_build() {
    print_status "Cleaning build directory..."
    rm -rf $BUILD_DIR
    print_success "Build directory cleaned"
}

# Main execution
main() {
    print_status "Tasklets C++ Test Suite Runner"
    echo "======================================"
    
    # Parse command line arguments
    case "${1:-}" in
        clean)
            clean_build
            exit 0
            ;;
        compile)
            check_dependencies
            create_build_dir
            compile_tests
            exit 0
            ;;
        run)
            shift
            run_tests "$@"
            exit 0
            ;;
        -h|--help)
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  compile    Compile the test suite"
            echo "  run        Run the test suite (default)"
            echo "  clean      Clean build directory"
            echo ""
            echo "Options for run command:"
            echo "  -v, --verbose  Enable verbose output"
            echo "  -l, --list     List all available tests"
            echo "  -h, --help     Show this help message"
            echo "  [test_name]    Run specific test"
            echo ""
            echo "Examples:"
            echo "  $0                    # Compile and run all tests"
            echo "  $0 run -v             # Run all tests with verbose output"
            echo "  $0 run TaskletConstruction  # Run specific test"
            echo "  $0 run -l             # List all tests"
            echo "  $0 compile            # Only compile"
            echo "  $0 clean              # Clean build"
            exit 0
            ;;
    esac
    
    # Default: compile and run
    check_dependencies
    create_build_dir
    compile_tests
    run_tests "$@"
}

# Run main function with all arguments
main "$@" 