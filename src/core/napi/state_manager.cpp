#include "state_manager.hpp"
#include "../base/logger.hpp"

namespace tasklets {
namespace napi {

// Static member initialization
uint32_t StateManager::next_tasklet_id_ = 1;

// =====================================================================
// StateManager Implementation
// =====================================================================

StateManager::StateManager() {
    Logger::info("Tasklets", "StateManager initialized");
}

StateManager::~StateManager() {
    std::lock_guard<std::mutex> lock(mutex_);
    tasklets_.clear();
    Logger::info("Tasklets", "StateManager destroyed");
}

bool StateManager::store_tasklet(uint32_t tasklet_id, Napi::Env env, const Napi::Function& js_function) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    try {
        auto tasklet_data = std::make_shared<FunctionReferenceManager>();
        
        if (!tasklet_data->store_function(env, js_function)) {
            Logger::error("Tasklets", "Failed to store function for tasklet " + std::to_string(tasklet_id));
            return false;
        }
        
        tasklets_[tasklet_id] = tasklet_data;
        Logger::info("Tasklets", "Stored tasklet " + std::to_string(tasklet_id));
        return true;
        
    } catch (const std::exception& e) {
        Logger::error("Tasklets", "Exception storing tasklet " + std::to_string(tasklet_id) + ": " + e.what());
        return false;
    }
}

std::shared_ptr<FunctionReferenceManager> StateManager::get_tasklet(uint32_t tasklet_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = tasklets_.find(tasklet_id);
    if (it != tasklets_.end()) {
        Logger::info("Tasklets", "Retrieved tasklet " + std::to_string(tasklet_id));
        return it->second;
    }
    
    Logger::warn("Tasklets", "Tasklet " + std::to_string(tasklet_id) + " not found");
    return nullptr;
}

bool StateManager::remove_tasklet(uint32_t tasklet_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = tasklets_.find(tasklet_id);
    if (it != tasklets_.end()) {
        tasklets_.erase(it);
        Logger::info("Tasklets", "Removed tasklet " + std::to_string(tasklet_id));
        return true;
    }
    
    Logger::warn("Tasklets", "Tasklet " + std::to_string(tasklet_id) + " not found for removal");
    return false;
}

bool StateManager::has_tasklet(uint32_t tasklet_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return tasklets_.find(tasklet_id) != tasklets_.end();
}

size_t StateManager::get_tasklet_count() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return tasklets_.size();
}

void StateManager::clear_all() {
    std::lock_guard<std::mutex> lock(mutex_);
    size_t count = tasklets_.size();
    tasklets_.clear();
    Logger::info("Tasklets", "Cleared all " + std::to_string(count) + " tasklets");
}

uint32_t StateManager::generate_tasklet_id() {
    return next_tasklet_id_++;
}

} // namespace napi
} // namespace tasklets 