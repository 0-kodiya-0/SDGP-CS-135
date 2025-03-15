import { PluginStatus } from "./types";
import { PluginMessage } from "./types.message";

/**
 * PluginWorkerAPI - Interface defining the contract between the system and plugin components
 * 
 * This interface must be implemented by all plugin components (background scripts, views)
 * to enable communication with the plugin system.
 */
export interface PluginWorkerAPI {
    /**
     * Initialize the plugin component
     * Called when the plugin is first loaded
     * 
     * @returns A promise that resolves when initialization is complete
     */
    initialize(): Promise<void>;

    /**
     * Prepare for termination and clean up resources
     * Called before the component is terminated by the system
     * 
     * @returns A promise that resolves when cleanup is complete
     */
    terminate(): Promise<void>;

    /**
     * Get the current status of the plugin
     * 
     * @returns A promise that resolves with the plugin's status
     */
    getStatus(): Promise<PluginStatus>;

    /**
     * Handle a message from the system or other plugin components
     * Required for all plugin components to support messaging
     * 
     * @param type Message topic/type
     * @param message Full message object with payload
     * @returns A promise that resolves when the message has been processed
     */
    handleMessage<T>(type: string, message: PluginMessage<T>): Promise<void>;
}