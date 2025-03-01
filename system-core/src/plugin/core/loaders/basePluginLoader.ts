import { PluginRegistry } from "../pluginRegister";
import { PluginConfig } from "../types";

/**
 * Base class for plugin loaders with common functionality
 * Focuses on plugin discovery, loading configurations, and validation
 */
abstract class BasePluginLoader {
    protected registry: PluginRegistry;

    constructor() {
        this.registry = PluginRegistry.getInstance();
        console.log(`Base plugin loader initialized`);
    }

    /**
     * Load all plugins managed by this loader
     */
    abstract loadAllPlugins(): Promise<PluginConfig[]>;

    /**
     * Unload all plugins managed by this loader
     */
    abstract unloadAllPlugins(): void;

    /**
     * Unload a specific plugin by ID
     * @param pluginId The ID of the plugin to unload
     */
    unloadPlugin(pluginId: string): void {
        this.registry.unregisterPlugin(pluginId);
    }

    /**
     * Validate plugin configuration
     * @param config The plugin configuration to validate
     * @returns Boolean indicating if the config is valid
     */
    protected validatePluginConfig(config: PluginConfig): boolean {
        // Check required fields
        if (!config.id || !config.name || !config.version) {
            console.error('Plugin config missing required fields (id, name, or version)');
            return false;
        }

        // Check worker entry point (required)
        if (!config.worker || !config.worker.entryPoint) {
            console.error(`Plugin ${config.id} is missing required worker entry point`);
            return false;
        }

        // Additional validation as needed
        return true;
    }

    /**
     * Validate plugin authenticity
     * This is a placeholder for future authentication mechanisms
     * @param pluginId The plugin ID to validate
     * @param config The plugin configuration
     * @returns Boolean indicating if the plugin is authentic
     */
    protected validatePluginAuthenticity(pluginId: string, config: PluginConfig): boolean {
        // Basic validation: Check if the ID in the config matches the expected ID
        if (config.id !== pluginId) {
            console.error(`Plugin ID mismatch: Expected ${pluginId}, found ${config.id}`);
            return false;
        }

        // Additional authentication checks could be added here:
        // - Digital signatures
        // - Checksums
        // - Trusted source verification

        return true;
    }

    /**
     * Perform additional validation on the plugin
     * @param pluginId The plugin ID
     * @param config The plugin configuration
     * @returns Boolean indicating if the plugin passes additional validation
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected performAdditionalValidation(_pluginId: string, _config: PluginConfig): boolean {
        // This is a hook for derived classes to add more validation
        // By default, no additional validation is performed
        return true;
    }

    /**
     * Register a plugin with the registry
     * @param config The validated plugin configuration
     * @returns Boolean indicating if registration was successful
     */
    protected registerPlugin(config: PluginConfig): boolean {
        return this.registry.registerPlugin(config);
    }
}

export default BasePluginLoader;