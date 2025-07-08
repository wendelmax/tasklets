{
  "targets": [
    {
      "target_name": "tasklets",
      "sources": [
        "src/bindings/tasklets_api.cpp",
        "src/bindings/napi_wrapper.cpp",
        "src/core/tasklet.cpp",
        "src/core/microjob.cpp",
        "src/core/memory_manager.cpp",
        "src/core/stats.cpp",
        "src/core/logger.cpp",
        "src/core/native_thread_pool.cpp",
        "src/core/config.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags_cc": [
        "-std=c++17",
        "-fexceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "libraries": [
        "-luv"
      ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15"
          },
          "cflags_cc": [
            "-std=c++17"
          ]
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }]
      ]
    },
    {
      "target_name": "cctest",
      "type": "executable",
      "sources": [
        "tests/cctest/cctest.cpp",
        "tests/cctest/test_runner.cpp",
        "tests/cctest/test_logger.cpp",
        "tests/cctest/test_stats.cpp",
        "tests/cctest/test_tasklet.cpp",
        "tests/cctest/test_microjob.cpp",
        "src/core/tasklet.cpp",
        "src/core/microjob.cpp",
        "src/core/memory_manager.cpp",
        "src/core/stats.cpp",
        "src/core/logger.cpp",
        "src/core/config.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags_cc": [
        "-std=c++17",
        "-fexceptions",
        "-pthread"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "defines": [
        "BUILDING_CCTEST"
      ],
      "ldflags": [
        "-pthread"
      ],
      "libraries": [
        "-luv"
      ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15"
          },
          "cflags_cc": [
            "-std=c++17"
          ]
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          },
          "libraries": [
            "libuv.lib"
          ]
        }],
        ["OS=='linux'", {
          "libraries": [
            "-luv",
            "-lpthread"
          ]
        }]
      ]
    }
  ]
} 