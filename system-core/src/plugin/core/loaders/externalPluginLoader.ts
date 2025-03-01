import { PluginId, PluginConfig } from "../types";
import BasePluginLoader from "./basePluginLoader";

/**
 * Loader for external plugins from remote sources
 * This is a placeholder implementation that will be expanded later
 */
class ExternalPluginLoader extends BasePluginLoader {
    private loadedPluginIds: Set<PluginId>;

    constructor() {
        super();
        this.loadedPluginIds = new Set<PluginId>();
        console.log('External plugin loader initialized (placeholder)');
    }

    /**
     * Load all external plugins
     * This is a placeholder that will be implemented in the future
     */
    async loadAllPlugins(): Promise<PluginConfig[]> {
        console.log('External plugin loading not yet implemented');
        return [];
    }

    /**
     * Unload all external plugins
     */
    unloadAllPlugins(): void {
        // Unload each external plugin
        for (const pluginId of this.loadedPluginIds) {
            this.unloadPlugin(pluginId);
        }

        // Clear the set of loaded plugin IDs
        this.loadedPluginIds.clear();

        console.log('All external plugins unloaded');
    }

    /**
     * Future implementation to load external plugins from a registry server
     * @param registryUrl URL of the external plugin registry
     */
    async loadFromRegistry(registryUrl: string): Promise<PluginConfig[]> {
        console.log(`Loading external plugins from registry: ${registryUrl}`);

        // This would be implemented to fetch plugin metadata from a remote registry
        // Then validate and register each plugin's configuration

        return [];
    }
}

export default ExternalPluginLoader;