{
  "targets": [
    {
      "target_name": "tasklets",
      "sources": [
        "src/tasklets.cpp",
        "src/core/base/tasklet.cpp",
        "src/core/base/microjob.cpp",
        "src/core/base/logger.cpp",
        "src/core/threading/native_thread_pool.cpp",
        "src/core/threading/multiprocessor.cpp",
        "src/core/memory/memory_manager.cpp",
        "src/core/monitoring/stats.cpp",
        "src/core/automation/auto_config.cpp",
        "src/core/automation/auto_scheduler.cpp",
        "src/core/napi/js_executor.cpp",
        "src/core/napi/state_manager.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src",
        "src/core",
        "src/core/base",
        "src/core/threading",
        "src/core/memory",
        "src/core/monitoring",
        "src/core/automation",
        "src/core/napi"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags_cc": [
        "-std=c++17",
        "-fexceptions",
        "-Wall",
        "-Wextra",
        "-O2"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "TASKLETS_VERSION=\"1.0.0\"",
        "NODE_GYP_MODULE_NAME=tasklets"
      ],
      "libraries": [
        "-luv",
        "-lpthread"
      ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CPLUSPLUSFLAGS": [
              "-std=c++17",
              "-Wall",
              "-Wextra"
            ]
          },
          "cflags_cc": [
            "-std=c++17"
          ]
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "WarningLevel": 3,
              "AdditionalOptions": [
                "/std:c++17",
                "/EHsc"
              ]
            }
          }
        }],
        ["OS=='linux'", {
          "cflags_cc": [
            "-std=c++17",
            "-fexceptions",
            "-Wall",
            "-Wextra",
            "-O2",
            "-D_GNU_SOURCE"
          ]
        }]
      ]
    }
  ]
} 