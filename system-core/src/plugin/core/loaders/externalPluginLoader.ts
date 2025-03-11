import { PluginId, PluginConfig } from "../types";
import BasePluginLoader from "./basePluginLoader";
import pluginClient from "../api/pluginClientApi";

/**
 * Loader for external plugins from remote sources
 * Focuses only on loading and validating individual plugins
 */
class ExternalPluginLoader extends BasePluginLoader {
  constructor() {
    super();
    console.log('External plugin loader initialized');
  }

  /**
   * Load a specific external plugin by ID
   * @param pluginId ID of the plugin to load
   * @returns Promise resolving to plugin configuration or null if failed
   */
  async loadPluginById(pluginId: PluginId): Promise<PluginConfig | null> {
    try {
      console.log(`Loading external plugin by ID: ${pluginId}`);

      // Check if plugin exists
      const exists = await pluginClient.pluginExists(pluginId, false);
      if (!exists) {
        console.error(`External plugin ${pluginId} does not exist`);
        return null;
      }

      // Get plugin configuration
      const config = await pluginClient.getPluginConfig(pluginId, false);
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

      console.log(`External plugin ${pluginId} loaded successfully`);
      return config;
    } catch (error) {
      console.error(`Error loading external plugin ${pluginId}:`, error);
      return null;
    }
  }

  /**
   * Not implemented for external plugins - use loadPluginById instead
   * This is intentionally left as a stub that returns an empty array
   */
  async loadAllPlugins(): Promise<PluginConfig[]> {
    console.warn('loadAllPlugins is not implemented for external plugins. Use loadPluginById instead.');
    return [];
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

export default ExternalPluginLoader;