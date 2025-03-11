import { PluginId, PluginConfig } from "../types";
import BasePluginLoader from "./basePluginLoader";
import pluginClient from "../api/pluginClientApi";

/**
 * Loader for internal plugins
 * Responsible for discovering and validating internal plugin configurations
 */
class InternalPluginLoader extends BasePluginLoader {
    constructor() {
        super();
        console.log('Internal plugin loader initialized');
    }

    /**
     * Load all internal plugins
     * This only loads and validates plugin configurations, not the actual plugin code
     */
    async loadAllPlugins(): Promise<PluginConfig[]> {
        try {
            // Get the list of available internal plugins
            const pluginConfigs = await pluginClient.getInternalPlugins();
            console.log(`Found ${pluginConfigs.length} internal plugins`);

            const validatedPlugins: PluginConfig[] = [];

            // Validate each plugin
            for (const config of pluginConfigs) {
                try {
                    // Validate plugin configuration
                    if (!this.validatePluginConfig(config)) {
                        console.error(`Invalid configuration for plugin ${config.id}`);
                        continue;
                    }

                    // Plugin authenticity validation is a placeholder for now
                    // Will be properly implemented in the future
                    this.validatePluginAuthenticity(config.id, config);

                    // Validate plugin files
                    const filesValid = await this.validatePluginFiles(config.id, config);
                    if (!filesValid) {
                        console.error(`Plugin ${config.id} failed file validation`);
                        continue;
                    }

                    validatedPlugins.push(config);
                    console.log(`Internal plugin ${config.id} loaded successfully`);
                } catch (error) {
                    console.error(`Error validating plugin ${config.id}:`, error);
                }
            }

            return validatedPlugins;
        } catch (error) {
            console.error('Error loading internal plugins:', error);
            return [];
        }
    }

    /**
     * Load a specific internal plugin by ID
     * @param pluginId ID of the plugin to load
     */
    async loadPluginById(pluginId: PluginId): Promise<PluginConfig | null> {
        try {
            console.log(`Loading internal plugin by ID: ${pluginId}`);

            // Check if plugin exists
            const exists = await pluginClient.pluginExists(pluginId, true);
            if (!exists) {
                console.error(`Internal plugin ${pluginId} does not exist`);
                return null;
            }

            // Get plugin configuration
            const config = await pluginClient.getPluginConfig(pluginId, true);
            if (!config) {
                console.error(`Failed to load configuration for plugin ${pluginId}`);
                return null;
            }

            // Validate plugin configuration
            if (!this.validatePluginConfig(config)) {
                console.error(`Invalid configuration for plugin ${pluginId}`);
                return null;
            }

            // Plugin authenticity validation is a placeholder for now
            // Will be properly implemented in the future
            this.validatePluginAuthenticity(pluginId, config);

            // Validate plugin files
            const filesValid = await this.validatePluginFiles(pluginId, config);
            if (!filesValid) {
                console.error(`Plugin ${pluginId} failed file validation`);
                return null;
            }

            console.log(`Internal plugin ${pluginId} loaded successfully`);
            return config;
        } catch (error) {
            console.error(`Error loading internal plugin ${pluginId}:`, error);
            return null;
        }
    }

    /**
     * Unload functionality is not needed in the loader
     * This method is required by the base class but does nothing
     */
    unloadAllPlugins(): void {
        // No implementation needed - handled by PluginManager
    }

    /**
     * Unload functionality is not needed in the loader
     * This method is required by the base class but does nothing
     */
    unloadPlugin(pluginId: PluginId): void {
        // No implementation needed - handled by PluginManager
    }
}

export default InternalPluginLoader;