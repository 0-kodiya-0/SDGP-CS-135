import { PluginConfig, PluginId } from '../types';
import pluginClient from '../api/pluginClientApi';

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
      console.error('Plugin config missing required fields (id, name, or version)');
      return false;
    }

    // Background entry point is only required for plugins with background functionality
    if (config.background && !config.background.entryPoint) {
      console.error(`Plugin ${config.id} has background defined but missing entry point`);
      return false;
    }

    // View entry points are only required for plugins with UI functionality
    if (config.view) {
      if (config.view.summary && !config.view.summary.entryPoint) {
        console.error(`Plugin ${config.id} has summary view defined but missing entry point`);
        return false;
      }

      if (config.view.expand && !config.view.expand.entryPoint) {
        console.error(`Plugin ${config.id} has expand view defined but missing entry point`);
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
      const validation = await pluginClient.validatePluginFiles(pluginId, config);
      
      if (!validation.valid) {
        console.error(`Plugin ${pluginId} has missing files:`, validation.missingFiles);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to validate files for plugin ${pluginId}:`, error);
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
    // Possible validations to add:
    // - Digital signatures verification
    // - Checksums validation
    // - Trusted source verification
    // - Code signing verification
    
    // For now, just do a basic ID match
    if (config.id !== pluginId) {
      console.warn(`Plugin ID mismatch: Expected ${pluginId}, found ${config.id}`);
      // Still returning true for now to allow development
    }

    return true;
  }
}

export default BasePluginLoader;