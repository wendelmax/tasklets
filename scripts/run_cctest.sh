#!/bin/bash

# Script to build and run C++ tests (cctest) for Tasklets

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "binding.gyp" ]; then
    print_error "binding.gyp not found. Please run this script from the project root."
    exit 1
fi

# Check if node-gyp is available
if ! command -v node-gyp &> /dev/null; then
    print_error "node-gyp not found. Please install it with: npm install -g node-gyp"
    exit 1
fi

# Parse command line arguments
VERBOSE=false
LIST_ONLY=false
SPECIFIC_TEST=""
CLEAN_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -l|--list)
            LIST_ONLY=true
            shift
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -t|--test)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -v, --verbose    Run tests with verbose output"
            echo "  -l, --list       List available tests"
            echo "  -c, --clean      Clean build before running tests"
            echo "  -t, --test NAME  Run specific test by name"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Clean build if requested
if [ "$CLEAN_BUILD" = true ]; then
    print_status "Cleaning previous build..."
    node-gyp clean || true
    rm -f build/Release/cctest || true
fi

# Build cctest executable
print_status "Building cctest executable..."
if ! node-gyp configure; then
    print_error "Failed to configure cctest build"
    exit 1
fi

if ! node-gyp build; then
    print_error "Failed to build cctest"
    exit 1
fi

# Check if the executable was created
CCTEST_EXE="build/Release/cctest"
if [ ! -f "$CCTEST_EXE" ]; then
    print_error "cctest executable not found at $CCTEST_EXE"
    exit 1
fi

print_status "cctest built successfully"

# Prepare arguments for cctest
CCTEST_ARGS=""
if [ "$VERBOSE" = true ]; then
    CCTEST_ARGS="$CCTEST_ARGS -v"
fi

if [ "$LIST_ONLY" = true ]; then
    CCTEST_ARGS="$CCTEST_ARGS -l"
fi

if [ -n "$SPECIFIC_TEST" ]; then
    CCTEST_ARGS="$CCTEST_ARGS $SPECIFIC_TEST"
fi

# Run cctest
print_status "Running cctest..."
echo

if ./"$CCTEST_EXE" $CCTEST_ARGS; then
    echo
    print_status "All tests completed successfully!"
    exit 0
else
    TEST_EXIT_CODE=$?
    echo
    print_error "Tests failed with exit code $TEST_EXIT_CODE"
    exit $TEST_EXIT_CODE
fi 