// src/plugin/core/pluginWorkerApi.ts
import { PluginStatus } from "./types";

/**
 * PluginWorkerAPI - Interface defining the contract between the system and plugin workers
 * 
 * This interface must be implemented by all plugin background scripts to enable
 * communication with the plugin system.
 */
export interface PluginWorkerAPI {
    /**
     * Initialize the plugin worker
     * Called when the plugin is first loaded
     * 
     * @returns A promise that resolves when initialization is complete
     */
    initialize(): Promise<void>;

    /**
     * Prepare for termination and clean up resources
     * Called before the worker is terminated by the system
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
     * Handle a message from the system
     * Optional method for plugins that want to receive messages
     * 
     * @param type Message type
     * @param payload Message data
     * @returns A promise that resolves when the message has been processed
     */
    handleMessage?<T>(type: string, payload: T): Promise<void>;
}

/**
 * Default implementation of the PluginWorkerAPI for fallback/error cases
 */
export class DefaultPluginWorkerAPI implements PluginWorkerAPI {
    private error?: Error;
    private pluginId: string;
    private pluginStatus: PluginStatus;

    constructor(pluginId: string, error?: Error) {
        this.pluginId = pluginId;
        this.error = error;
        this.pluginStatus = {
            isActive: !error,
            version: '0.0.0',
            features: [],
            lastError: error?.message
        };
    }

    async initialize(): Promise<void> {
        if (this.error) {
            throw this.error;
        }
        console.warn(`Default implementation of initialize() called for plugin ${this.pluginId}`);
    }

    async terminate(): Promise<void> {
        console.warn(`Default implementation of terminate() called for plugin ${this.pluginId}`);
        return Promise.resolve();
    }

    async getStatus(): Promise<PluginStatus> {
        return this.pluginStatus;
    }
}