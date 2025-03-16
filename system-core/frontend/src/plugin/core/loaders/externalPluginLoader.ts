import { PluginId, PluginConfig } from "../types";
import BasePluginLoader from "./basePluginLoader";
import pluginClient from "../api/pluginClientApi";
import { pluginLoaderLogger } from "../utils/logger";

/**
 * Loader for external plugins from remote sources
 * Focuses only on loading and validating individual plugins
 */
class ExternalPluginLoader extends BasePluginLoader {
  constructor() {
    super();
    pluginLoaderLogger('External plugin loader initialized');
  }

  /**
   * Load a specific external plugin by ID
   * @param pluginId ID of the plugin to load
   * @returns Promise resolving to plugin configuration or null if failed
   */
  async loadPluginById(pluginId: PluginId): Promise<PluginConfig | null> {
    try {
      pluginLoaderLogger('Loading external plugin by ID: %s', pluginId);

      // Check if plugin exists
      const exists = await pluginClient.pluginExists(pluginId, false);
      if (!exists) {
        pluginLoaderLogger('External plugin %s does not exist', pluginId);
        return null;
      }

      // Get plugin configuration
      pluginLoaderLogger('Fetching configuration for external plugin %s', pluginId);
      const config = await pluginClient.getPluginConfig(pluginId, false);
      if (!config) {
        pluginLoaderLogger('Failed to load configuration for plugin %s', pluginId);
        return null;
      }

      // Validate plugin configuration
      if (!this.validatePluginConfig(config)) {
        pluginLoaderLogger('Invalid configuration for plugin %s', pluginId);
        return null;
      }

      // Mark as external plugin (explicitly not internal)
      config.internalPlugin = false;

      // Plugin authenticity validation
      this.validatePluginAuthenticity(pluginId, config);

      // Validate plugin files
      const filesValid = await this.validatePluginFiles(pluginId, config);
      if (!filesValid) {
        pluginLoaderLogger('Plugin %s failed file validation', pluginId);
        return null;
      }

      pluginLoaderLogger('External plugin %s loaded successfully', pluginId);
      return config;
    } catch (error) {
      pluginLoaderLogger('Error loading external plugin %s: %o', pluginId, error);
      return null;
    }
  }

  /**
   * Load all external plugins
   * Retrieves a list of available external plugins
   */
  async loadAllPlugins(): Promise<PluginConfig[]> {
    try {
      pluginLoaderLogger('Loading all external plugins');
      
      // Get the list of available external plugins
      const externalPlugins = await pluginClient.getExternalPlugins();
      pluginLoaderLogger('Found %d external plugins', externalPlugins.length);
      
      const validatedPlugins: PluginConfig[] = [];
      
      // Validate each plugin
      for (const config of externalPlugins) {
        try {
          pluginLoaderLogger('Validating external plugin %s', config.id);
          
          // Mark as external plugin (explicitly not internal)
          config.internalPlugin = false;
          
          // Validate plugin configuration
          if (!this.validatePluginConfig(config)) {
            pluginLoaderLogger('Invalid configuration for plugin %s', config.id);
            continue;
          }
          
          // Plugin authenticity validation
          this.validatePluginAuthenticity(config.id, config);
          
          // Validate plugin files
          const filesValid = await this.validatePluginFiles(config.id, config);
          if (!filesValid) {
            pluginLoaderLogger('Plugin %s failed file validation', config.id);
            continue;
          }
          
          validatedPlugins.push(config);
          pluginLoaderLogger('External plugin %s loaded successfully', config.id);
        } catch (error) {
          pluginLoaderLogger('Error validating plugin %s: %o', config.id, error);
        }
      }
      
      pluginLoaderLogger('Successfully validated %d external plugins', validatedPlugins.length);
      return validatedPlugins;
    } catch (error) {
      pluginLoaderLogger('Error loading external plugins: %o', error);
      return [];
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

export default ExternalPluginLoader;