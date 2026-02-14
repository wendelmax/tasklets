cmake_minimum_required(VERSION 3.10)

project(tasklets)

# Use cmake-js to set up Node.js addon build
include_directories(${CMAKE_JS_INC})

# Define the source files
set(SOURCE_FILES
    "src/tasklets.cpp"
    "src/core/base/tasklet.cpp"
    "src/core/base/microjob.cpp"
    "src/core/base/logger.cpp"
    "src/core/threading/native_thread_pool.cpp"
    "src/core/threading/multiprocessor.cpp"
    "src/core/memory/memory_manager.cpp"
    "src/core/monitoring/stats.cpp"
    "src/core/automation/auto_config.cpp"
    "src/core/automation/auto_scheduler.cpp"
    "src/core/napi/js_executor.cpp"
    "src/core/napi/state_manager.cpp"
)

# Create the shared library (addon)
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

# Get node-addon-api include directory
execute_process(COMMAND node -e "console.log(require('node-addon-api').include)"
                WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
                OUTPUT_VARIABLE NODE_ADDON_API_DIR
                OUTPUT_STRIP_TRAILING_WHITESPACE)

# Strip quotes from the path
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

# Send message to debug include path
message(STATUS "node-addon-api include dir: ${NODE_ADDON_API_DIR}")


# Set C++ standard
set_property(TARGET ${PROJECT_NAME} PROPERTY CXX_STANDARD 17)
set_property(TARGET ${PROJECT_NAME} PROPERTY CXX_STANDARD_REQUIRED ON)

# Check for MinGW cross-compilation
if(CMAKE_CXX_COMPILER MATCHES "mingw")
    message(STATUS "Detected MinGW cross-compilation")
    set(WIN32 1)
    set(UNIX 0)
    set(CMAKE_SYSTEM_NAME "Windows")
endif()

message(STATUS "CMAKE_SYSTEM_NAME: ${CMAKE_SYSTEM_NAME}")
message(STATUS "WIN32: ${WIN32}")
message(STATUS "UNIX: ${UNIX}")

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${NODE_ADDON_API_DIR}
    src
    src/core
    src/core/base
    src/core/threading
    src/core/memory
    src/core/monitoring
    src/core/automation
    src/core/napi
)

# Platform-specific settings
if(MSVC)
    # Windows (MSVC) settings
    target_compile_options(${PROJECT_NAME} PRIVATE /EHsc /W3)
    target_compile_definitions(${PROJECT_NAME} PRIVATE _WIN32 WIN32_LEAN_AND_MEAN)
elseif(MINGW OR CMAKE_CXX_COMPILER MATCHES "mingw")
    # Windows (MinGW) settings
    target_compile_options(${PROJECT_NAME} PRIVATE -fexceptions -Wall -Wextra -O2)
    target_compile_definitions(${PROJECT_NAME} PRIVATE _WIN32 WIN32_LEAN_AND_MEAN)
    target_link_options(${PROJECT_NAME} PRIVATE -static-libgcc -static-libstdc++ -static)
elseif(APPLE)
    # macOS settings
    target_compile_options(${PROJECT_NAME} PRIVATE -fexceptions -Wall -Wextra)
elseif(UNIX)
    # Linux settings
    target_compile_options(${PROJECT_NAME} PRIVATE -fexceptions -Wall -Wextra -O2)
    target_compile_definitions(${PROJECT_NAME} PRIVATE _GNU_SOURCE)
endif()

# Common definitions
target_compile_definitions(${PROJECT_NAME} PRIVATE
    NAPI_DISABLE_CPP_EXCEPTIONS
    TASKLETS_VERSION="1.0.0"
    NODE_GYP_MODULE_NAME=tasklets
)

# Libraries
# Libraries
# Libraries
if(WIN32)
    if(DEFINED ENV{NODE_LIB_PATH})
        message(STATUS "Using custom NODE_LIB_PATH: $ENV{NODE_LIB_PATH}")
        target_link_libraries(${PROJECT_NAME} $ENV{NODE_LIB_PATH})
    else()
        target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
    endif()
elseif(UNIX AND NOT APPLE)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} uv pthread)
else()
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
endif()

# Installation (optional, but good for structure)
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
