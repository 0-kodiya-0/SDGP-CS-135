import { PluginId, PluginConfig, PluginGlobalConfig } from "../types";
import BasePluginLoader from "./basePluginLoader";

/**
 * Loader for internal plugins located in the plugins directory
 * Responsible for discovering, loading, and validating plugin configurations
 */
class InternalPluginLoader extends BasePluginLoader {
    private pluginsPath: string;
    private loadedPluginIds: Set<PluginId>;

    constructor() {
        super();
        // Internal plugins are located in a plugins folder outside src
        this.pluginsPath = '/plugins';
        this.loadedPluginIds = new Set<PluginId>();
        console.log(`Internal plugin loader initialized with path: ${this.pluginsPath}`);
    }

    /**
     * Load all internal plugins
     * This only loads plugin configurations, not the actual plugin code
     */
    async loadAllPlugins(): Promise<PluginConfig[]> {
        try {
            // Get the list of internal plugins to load from global config
            const pluginIds = await this.getInternalPluginsList();
            console.log(`Loading internal plugins: ${pluginIds.join(', ')}`);

            const results: PluginConfig[] = [];

            // Load plugins one by one to isolate errors
            for (const id of pluginIds) {
                try {
                    // Load plugin configuration
                    const pluginConfig = await this.loadPluginById(id);

                    // Skip plugins that aren't marked as internal
                    if (pluginConfig.internalPlugin) {
                        results.push(pluginConfig);
                        this.loadedPluginIds.add(id);
                    } else {
                        console.warn(`Plugin ${id} is not marked as internal, skipping`);
                        this.unloadPlugin(id);
                    }
                } catch (error) {
                    console.error(`Failed to load internal plugin ${id}:`, error);
                    // Continue with other plugins
                }
            }

            return results;
        } catch (error) {
            console.error('Error in loadAllPlugins:', error);
            return [];
        }
    }

    /**
     * Unload all internal plugins
     */
    unloadAllPlugins(): void {
        // Unload each internal plugin
        for (const pluginId of this.loadedPluginIds) {
            this.unloadPlugin(pluginId);
        }

        // Clear the set of loaded plugin IDs
        this.loadedPluginIds.clear();

        console.log('All internal plugins unloaded');
    }

    /**
     * Get the list of available internal plugins from the global configuration file
     */
    private async getInternalPluginsList(): Promise<string[]> {
        try {
            // Path to the global plugin configuration file
            const globalConfigPath = `${this.pluginsPath}/plugin.global.conf.json`;
            console.log(`Fetching global plugin configuration from: ${globalConfigPath}`);

            const response = await fetch(globalConfigPath);

            if (!response.ok) {
                console.error(`Failed to load global plugin config: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to load global plugin config: ${response.status} ${response.statusText}`);
            }

            const configText = await response.text();
            const globalConfig: PluginGlobalConfig = JSON.parse(configText);

            if (!globalConfig.internalPlugins || !Array.isArray(globalConfig.internalPlugins)) {
                console.error('Invalid global plugin configuration: missing or invalid internalPlugins array');
                return [];
            }

            // Filter only enabled plugins
            const enabledPlugins = globalConfig.internalPlugins.filter(plugin => plugin.enabled);

            // Extract plugin IDs
            const pluginIds = enabledPlugins.map(plugin => plugin.id);
            console.log(`Found ${pluginIds.length} enabled internal plugins: ${pluginIds.join(', ')}`);

            return pluginIds;
        } catch (error) {
            console.error('Error fetching internal plugins list:', error);
            return [];
        }
    }

    /**
     * Load a plugin by ID
     * This only loads the plugin configuration, not the plugin code
     * @param pluginId The ID of the plugin to load
     */
    private async loadPluginById(pluginId: string): Promise<PluginConfig> {
        try {
            console.log(`Loading internal plugin by ID: ${pluginId}`);

            // Get the plugin path from the global configuration
            const pluginPath = await this.getPluginPathById(pluginId);
            if (!pluginPath) {
                throw new Error(`Plugin path not found for ${pluginId}`);
            }

            // Construct path to plugin.conf.json
            const configPath = `${this.pluginsPath}/${pluginPath}/plugin.conf.json`;
            console.log(`Fetching config from: ${configPath}`);

            // Load and parse the plugin configuration
            const config = await this.loadPluginConfig(configPath, pluginPath);

            // Validate the plugin configuration
            if (!this.validatePluginConfig(config)) {
                throw new Error(`Invalid configuration for plugin ${pluginId}`);
            }

            // Validate plugin authenticity
            if (!this.validatePluginAuthenticity(pluginId, config)) {
                throw new Error(`Plugin ${pluginId} failed authenticity validation`);
            }

            // Register the plugin with the registry
            if (this.registerPlugin(config)) {
                console.log(`Internal plugin ${config.name} registered successfully`);
            } else {
                console.warn(`Internal plugin ${config.name} registration failed, might already be registered`);
            }

            return config;
        } catch (error) {
            console.error(`Failed to load internal plugin ${pluginId}:`, error);
            throw error;
        }
    }

    /**
     * Get the plugin path from the global configuration file
     * @param pluginId The ID of the plugin to find
     * @returns The path to the plugin directory or null if not found
     */
    private async getPluginPathById(pluginId: string): Promise<string | null> {
        try {
            // Path to the global plugin configuration file
            const globalConfigPath = `${this.pluginsPath}/plugin.global.conf.json`;

            const response = await fetch(globalConfigPath);

            if (!response.ok) {
                console.error(`Failed to load global plugin config: ${response.status} ${response.statusText}`);
                return null;
            }

            const configText = await response.text();
            const globalConfig: PluginGlobalConfig = JSON.parse(configText);

            if (!globalConfig.internalPlugins || !Array.isArray(globalConfig.internalPlugins)) {
                console.error('Invalid global plugin configuration: missing or invalid internalPlugins array');
                return null;
            }

            // Find the plugin with matching ID
            const pluginInfo = globalConfig.internalPlugins.find(plugin => plugin.id === pluginId);

            if (!pluginInfo) {
                console.error(`Plugin ${pluginId} not found in global configuration`);
                return null;
            }

            return pluginInfo.path;
        } catch (error) {
            console.error(`Error getting plugin path for ${pluginId}:`, error);
            return null;
        }
    }

    /**
     * Load and parse a plugin configuration file
     * @param configPath Path to the plugin.conf.json file
     * @param pluginPath Path to the plugin directory (for reference)
     */
    private async loadPluginConfig(configPath: string, pluginPath: string): Promise<PluginConfig> {
        try {
            const response = await fetch(configPath);

            if (!response.ok) {
                throw new Error(`Failed to load plugin config: ${response.status} ${response.statusText}`);
            }

            const configText = await response.text();
            console.log(`Raw config text:`, configText.substring(0, 200) + (configText.length > 200 ? '...' : ''));

            try {
                const config = JSON.parse(configText) as PluginConfig;

                // Add plugin path metadata for future reference
                // This doesn't modify the actual config file but helps with loading assets
                config._meta = {
                    basePath: pluginPath
                };

                return config;
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Invalid JSON content:', configText);
                throw new Error(`Failed to parse plugin config: ${parseError}`);
            }
        } catch (error) {
            console.error(`Failed to load plugin config from ${configPath}:`, error);
            throw error;
        }
    }
}

export default InternalPluginLoader;