// Import for BasePluginLoader
import { PluginConfig, PluginId } from '../types';
import pluginClient from '../api/pluginClientApi';
import { pluginLoaderLogger } from '../utils/logger';

/**
 * Base class for plugin loaders with common functionality
 * Focuses on plugin discovery and validation only
 */
abstract class BasePluginLoader {
  /**
   * Load all plugins managed by this loader
   * Note: This is primarily implemented by InternalPluginLoader
   */
  abstract loadAllPlugins(): Promise<PluginConfig[]>;

  /**
   * Load a specific plugin by ID
   * @param pluginId ID of the plugin to load
   * @returns Promise resolving to plugin configuration or null if failed
   */
  abstract loadPluginById(pluginId: PluginId): Promise<PluginConfig | null>;

  /**
   * Unload functionality is not needed in the loader
   * This is a stub method that can be overridden if needed
   */
  abstract unloadAllPlugins(): void;

  /**
   * Unload functionality is not needed in the loader
   * This is a stub method that can be overridden if needed
   */
  abstract unloadPlugin(pluginId: PluginId): void;

  /**
   * Validate plugin configuration
   * @param config The plugin configuration to validate
   * @returns Boolean indicating if the config is valid
   */
  protected validatePluginConfig(config: PluginConfig): boolean {
    // Check required fields
    if (!config.id || !config.name || !config.version) {
      pluginLoaderLogger('Plugin config missing required fields (id, name, or version)');
      return false;
    }

    // Background entry point is only required for plugins with background functionality
    if (config.background && !config.background.entryPoint) {
      pluginLoaderLogger('Plugin %s has background defined but missing entry point', config.id);
      return false;
    }

    // View entry points are only required for plugins with UI functionality
    if (config.view) {
      if (config.view.summary && !config.view.summary.entryPoint) {
        pluginLoaderLogger('Plugin %s has summary view defined but missing entry point', config.id);
        return false;
      }

      if (config.view.expand && !config.view.expand.entryPoint) {
        pluginLoaderLogger('Plugin %s has expand view defined but missing entry point', config.id);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate plugin files existence
   * @param pluginId The plugin ID to validate
   * @param config The plugin configuration
   * @returns Promise resolving to boolean indicating if all required files exist
   */
  protected async validatePluginFiles(pluginId: PluginId, config: PluginConfig): Promise<boolean> {
    try {
      pluginLoaderLogger('Validating files for plugin %s', pluginId);
      const validation = await pluginClient.validatePluginFiles(pluginId, config);
      
      if (!validation.valid) {
        pluginLoaderLogger('Plugin %s has missing files: %o', pluginId, validation.missingFiles);
        return false;
      }
      
      pluginLoaderLogger('Plugin %s files validated successfully', pluginId);
      return true;
    } catch (error) {
      pluginLoaderLogger('Failed to validate files for plugin %s: %o', pluginId, error);
      return false;
    }
  }

  /**
   * Placeholder for plugin authenticity validation
   * This will be implemented in the future
   * 
   * @param pluginId The plugin ID to validate
   * @param config The plugin configuration
   * @returns Boolean always returns true for now
   */
  protected validatePluginAuthenticity(pluginId: PluginId, config: PluginConfig): boolean {
    // TODO: Implement proper plugin authenticity validation in the future
    
    // For now, just do a basic ID match
    if (config.id !== pluginId) {
      pluginLoaderLogger('Plugin ID mismatch: Expected %s, found %s', pluginId, config.id);
      // Still returning true for now to allow development
    }

    return true;
  }
}

export default BasePluginLoader;