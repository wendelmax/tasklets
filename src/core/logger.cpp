#include "logger.hpp"

namespace tasklets {

// Default log level: INFO (shows errors, warnings, and basic information)
LogLevel Logger::current_level_ = LogLevel::INFO;
std::mutex Logger::log_mutex_;

} // namespace tasklets 