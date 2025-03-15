import { PluginId, PluginConfig } from "../types";
import { pluginLoaderLogger } from "../utils/logger";
import BasePluginLoader from "./basePluginLoader";

/**
 * Loader for internal plugins
 * Responsible for discovering and loading internal plugin configurations from the file system
 */
class InternalPluginLoader extends BasePluginLoader {
    private pluginBasePath: string;
    
    constructor(pluginBasePath: string = '/plugins') {
        super();
        this.pluginBasePath = pluginBasePath;
        pluginLoaderLogger('Internal plugin loader initialized with base path: %s', pluginBasePath);
    }

    /**
     * Load all internal plugins from the global configuration file
     * This only loads and validates plugin configurations, not the actual plugin code
     */
    async loadAllPlugins(): Promise<PluginConfig[]> {
        try {
            pluginLoaderLogger('Loading internal plugins from global config');
            
            // Load the global plugin configuration file from the plugins directory
            const globalConfigPath = `${this.pluginBasePath}/plugin.global.conf.json`;
            pluginLoaderLogger('Fetching global config from: %s', globalConfigPath);
            
            const globalConfigResponse = await fetch(globalConfigPath);
            if (!globalConfigResponse.ok) {
                pluginLoaderLogger('Failed to load global plugin config: %s', globalConfigResponse.statusText);
                throw new Error(`Failed to load global plugin config: ${globalConfigResponse.statusText}`);
            }
            
            const globalConfig = await globalConfigResponse.json();
            pluginLoaderLogger('Found %d internal plugins defined in global config', globalConfig.plugins.length);
            
            const validatedPlugins: PluginConfig[] = [];
            
            // Load each plugin's configuration
            for (const pluginEntry of globalConfig.plugins) {
                try {
                    const pluginId = pluginEntry.id;
                    const pluginPath = pluginEntry.path || pluginId;
                    const isEnabled = pluginEntry.enabled !== false; // Default to true if not specified
                    
                    if (!isEnabled) {
                        pluginLoaderLogger('Skipping disabled plugin: %s', pluginId);
                        continue;
                    }
                    
                    pluginLoaderLogger('Loading config for plugin %s from path %s', pluginId, pluginPath);
                    
                    // Load the plugin's configuration file
                    const config = await this.loadPluginConfig(pluginId, pluginPath);
                    if (!config) {
                        pluginLoaderLogger('Failed to load configuration for plugin %s', pluginId);
                        continue;
                    }
                    
                    // Mark as internal plugin
                    config.internalPlugin = true;
                    
                    // Validate plugin configuration
                    if (!this.validatePluginConfig(config)) {
                        pluginLoaderLogger('Invalid configuration for plugin %s', pluginId);
                        continue;
                    }
                    
                    validatedPlugins.push(config);
                    pluginLoaderLogger('Internal plugin %s loaded successfully', pluginId);
                } catch (error) {
                    pluginLoaderLogger('Error loading plugin %s: %o', pluginEntry.id, error);
                }
            }
            
            pluginLoaderLogger('Successfully loaded %d internal plugins', validatedPlugins.length);
            return validatedPlugins;
        } catch (error) {
            pluginLoaderLogger('Error loading internal plugins: %o', error);
            return [];
        }
    }

    /**
     * Load a specific internal plugin by ID
     * @param pluginId ID of the plugin to load
     */
    async loadPluginById(pluginId: PluginId): Promise<PluginConfig | null> {
        try {
            pluginLoaderLogger('Loading internal plugin by ID: %s', pluginId);
            
            // Load the global plugin configuration to find the plugin's path
            const globalConfigPath = `${this.pluginBasePath}/plugin.global.conf.json`;
            pluginLoaderLogger('Fetching global config from: %s', globalConfigPath);
            
            const globalConfigResponse = await fetch(globalConfigPath);
            if (!globalConfigResponse.ok) {
                pluginLoaderLogger('Failed to load global plugin config: %s', globalConfigResponse.statusText);
                throw new Error(`Failed to load global plugin config: ${globalConfigResponse.statusText}`);
            }
            
            const globalConfig = await globalConfigResponse.json();
            
            // Find the plugin entry in the global config
            const pluginEntry = globalConfig.plugins.find((p: any) => p.id === pluginId);
            if (!pluginEntry) {
                pluginLoaderLogger('Internal plugin %s not found in global config', pluginId);
                return null;
            }
            
            // Check if plugin is enabled
            if (pluginEntry.enabled === false) {
                pluginLoaderLogger('Plugin %s is disabled in global config', pluginId);
                return null;
            }
            
            const pluginPath = pluginEntry.path || pluginId;
            pluginLoaderLogger('Loading config for plugin %s from path %s', pluginId, pluginPath);
            
            // Load the plugin configuration
            const config = await this.loadPluginConfig(pluginId, pluginPath);
            if (!config) {
                pluginLoaderLogger('Failed to load configuration for plugin %s', pluginId);
                return null;
            }
            
            // Mark as internal plugin
            config.internalPlugin = true;
            
            // Validate plugin configuration
            if (!this.validatePluginConfig(config)) {
                pluginLoaderLogger('Invalid configuration for plugin %s', pluginId);
                return null;
            }
            
            pluginLoaderLogger('Internal plugin %s loaded successfully', pluginId);
            return config;
        } catch (error) {
            pluginLoaderLogger('Error loading internal plugin %s: %o', pluginId, error);
            return null;
        }
    }
    
    /**
     * Load a plugin's configuration file
     * @param pluginId Plugin ID
     * @param pluginPath Plugin path from global config
     * @returns Promise resolving to plugin configuration or null
     * @private
     */
    private async loadPluginConfig(pluginId: PluginId, pluginPath: string): Promise<PluginConfig | null> {
        try {
            // Construct the path to the plugin's configuration file in the dist directory
            const configUrl = `${this.pluginBasePath}/${pluginPath}/dist/plugin.conf.json`;
            pluginLoaderLogger('Loading plugin config from: %s', configUrl);
            
            // Fetch the plugin configuration file
            const response = await fetch(configUrl);
            if (!response.ok) {
                pluginLoaderLogger('Failed to load plugin config: %s', response.statusText);
                throw new Error(`Failed to load plugin config: ${response.statusText}`);
            }
            
            const config = await response.json();
            
            // Ensure plugin ID matches
            if (config.id !== pluginId) {
                pluginLoaderLogger('Plugin ID mismatch: Expected %s, found %s in config', pluginId, config.id);
                config.id = pluginId; // Override with the ID from the global config
            }
            
            return config;
        } catch (error) {
            pluginLoaderLogger('Error loading config for plugin %s: %o', pluginId, error);
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