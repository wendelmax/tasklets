#pragma once

#include <unordered_map>
#include <mutex>
#include <memory>
#include <napi.h>
#include "js_executor.hpp"

namespace tasklets {
namespace napi {

/**
 * @brief Manages tasklet state with thread safety
 * 
 * Single Responsibility: Only manages state
 * Open/Closed: Extensible for different state types
 * Interface Segregation: Clean interface for state operations
 */
class StateManager {
public:
    StateManager();
    ~StateManager();
    
    // Non-copyable, movable
    StateManager(const StateManager&) = delete;
    StateManager& operator=(const StateManager&) = delete;
    StateManager(StateManager&&) = default;
    StateManager& operator=(StateManager&&) = default;
    
    /**
     * @brief Store tasklet data with proper lifecycle management
     * @param tasklet_id Unique tasklet identifier
     * @param env N-API environment
     * @param js_function Function to store
     * @return true if successful
     */
    bool store_tasklet(uint32_t tasklet_id, Napi::Env env, const Napi::Function& js_function);
    
    /**
     * @brief Get tasklet data
     * @param tasklet_id Tasklet identifier
     * @return Tasklet data if exists, nullptr otherwise
     */
    std::shared_ptr<FunctionReferenceManager> get_tasklet(uint32_t tasklet_id);
    
    /**
     * @brief Remove tasklet data
     * @param tasklet_id Tasklet identifier
     * @return true if removed, false if not found
     */
    bool remove_tasklet(uint32_t tasklet_id);
    
    /**
     * @brief Check if tasklet exists
     * @param tasklet_id Tasklet identifier
     * @return true if exists
     */
    bool has_tasklet(uint32_t tasklet_id) const;
    
    /**
     * @brief Get total number of tasklets
     * @return Number of tasklets
     */
    size_t get_tasklet_count() const;
    
    /**
     * @brief Clear all tasklets
     */
    void clear_all();

private:
    mutable std::mutex mutex_;
    std::unordered_map<uint32_t, std::shared_ptr<FunctionReferenceManager>> tasklets_;
    
    /**
     * @brief Generate unique tasklet ID
     * @return Unique tasklet ID
     */
    uint32_t generate_tasklet_id();
    
    static uint32_t next_tasklet_id_;
};

} // namespace napi
} // namespace tasklets 