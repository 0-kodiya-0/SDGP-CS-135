import {
  PluginId,
  PluginConfig,
  ExtendedPluginStatus,
} from './types';
import { InternalPluginLoader, ExternalPluginLoader } from './loaders';
import pluginRegistry from './pluginRegistry';
import backgroundScriptExecutor from './executors/backgroundScriptExecutor';
import eventBus from '../../events';
import { PluginLoadedEvent, PluginLoadErrorEvent } from './types.event';
import { PluginLoadError, PluginExecutionError } from './types.error';
import { pluginManagerLogger } from './utils/logger';

/**
 * Central manager for the plugin system
 * Responsible for plugin lifecycle management including:
 * - Loading plugin configurations
 * - Managing plugin registration and approval
 * - Executing background scripts
 * - Monitoring plugin status
 */
export class PluginManager {
  private static instance: PluginManager;
  private internalLoader: InternalPluginLoader;
  private externalLoader: ExternalPluginLoader;
  private initialized: boolean = false;

  private constructor() {
    this.internalLoader = new InternalPluginLoader();
    this.externalLoader = new ExternalPluginLoader();
    pluginManagerLogger('Plugin manager initialized');
  }

  /**
   * Get the singleton instance of the PluginManager
   */
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Initialize the plugin system
   * Loads internal plugins and automatically approves them
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      pluginManagerLogger('Plugin system already initialized');
      return;
    }

    try {
      pluginManagerLogger('Initializing plugin system');

      // Load all internal plugins
      pluginManagerLogger('Loading internal plugin configurations');
      const internalPlugins = await this.internalLoader.loadAllPlugins();
      pluginManagerLogger('Loaded %d internal plugin configurations', internalPlugins.length);

      // Register and auto-approve each internal plugin
      for (const config of internalPlugins) {
        try {
          // Only register if not already registered
          if (!pluginRegistry.isPluginRegistered(config.id)) {
            pluginManagerLogger('Registering internal plugin %s', config.id);
            pluginRegistry.registerPlugin(config);
            pluginManagerLogger('Internal plugin %s registered successfully', config.id);

            // Auto-approve internal plugins
            pluginManagerLogger('Auto-approving internal plugin %s', config.id);
            pluginRegistry.approvePlugin(config.id);
            pluginManagerLogger('Internal plugin %s automatically approved', config.id);
          } else {
            pluginManagerLogger('Internal plugin %s already registered', config.id);
          }

          // Emit plugin loaded event
          pluginManagerLogger('Emitting plugin loaded event for %s', config.id);
          eventBus.emit('pluginLoaded', {
            pluginId: config.id,
            config,
            isInternal: true,
            timestamp: Date.now()
          } as PluginLoadedEvent);
        } catch (error) {
          pluginManagerLogger('Error registering or approving internal plugin %s: %o', config.id, error);
        }
      }

      this.initialized = true;
      pluginManagerLogger('Plugin system initialized successfully');
    } catch (error) {
      pluginManagerLogger('Failed to initialize plugin system: %o', error);
      throw error;
    }
  }

  /**
   * Shutdown the plugin system
   * Stops all active plugin workers and unregisters all plugins
   */
  public async shutdown(): Promise<void> {
    try {
      // Get all active plugin IDs
      const activePluginIds = pluginRegistry.getActivePluginIds();
      pluginManagerLogger('Shutting down plugin system with %d active plugins', activePluginIds.length);

      // Stop all workers through the executor
      for (const pluginId of activePluginIds) {
        pluginManagerLogger('Stopping worker for plugin %s', pluginId);
        await backgroundScriptExecutor.stopWorker(pluginId, 'system');
      }

      // Unregister all plugins
      const registeredPluginIds = pluginRegistry.getRegisteredPluginIds();
      pluginManagerLogger('Unregistering %d plugins', registeredPluginIds.length);

      for (const pluginId of registeredPluginIds) {
        pluginManagerLogger('Unregistering plugin %s during shutdown', pluginId);
        pluginRegistry.unregisterPlugin(pluginId, 'system shutdown');
      }

      this.initialized = false;
      pluginManagerLogger('Plugin system shut down successfully');
    } catch (error) {
      pluginManagerLogger('Error shutting down plugin system: %o', error);
      throw error;
    }
  }

  /**
   * Load a single plugin by ID
   * Delegates to the appropriate loader based on plugin type
   * Auto-approves internal plugins
   * 
   * @param pluginId Plugin ID to load
   * @param isInternal Whether the plugin is internal or external
   * @returns Promise resolving to the plugin config or null if failed
   */
  public async loadPlugin(pluginId: PluginId, isInternal: boolean = true): Promise<PluginConfig | null> {
    try {
      pluginManagerLogger('Loading %s plugin: %s', isInternal ? 'internal' : 'external', pluginId);

      // Check if already registered in registry
      if (pluginRegistry.isPluginRegistered(pluginId)) {
        pluginManagerLogger('Plugin %s is already registered, retrieving config', pluginId);
        return pluginRegistry.getPluginConfig(pluginId) || null;
      }

      // Use appropriate loader
      const loader = isInternal ? this.internalLoader : this.externalLoader;
      pluginManagerLogger('Using %s loader for plugin %s', isInternal ? 'internal' : 'external', pluginId);

      const config = await loader.loadPluginById(pluginId);

      if (config) {
        pluginManagerLogger('Successfully loaded plugin config for %s', pluginId);

        // Auto-approve internal plugins
        if (isInternal && pluginRegistry.registerPlugin(config)) {
          pluginManagerLogger('Auto-approving internal plugin %s after loading', pluginId);
          pluginRegistry.approvePlugin(pluginId);
        }

        // Emit plugin loaded event
        pluginManagerLogger('Emitting plugin loaded event for %s', pluginId);
        eventBus.emit('pluginLoaded', {
          pluginId,
          config,
          isInternal,
          timestamp: Date.now()
        } as PluginLoadedEvent);

        return config;
      }

      pluginManagerLogger('Failed to load plugin %s', pluginId);
      return null;
    } catch (error) {
      const loadError = new PluginLoadError(
        `Error loading plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`,
        pluginId
      );
      pluginManagerLogger('Error loading plugin %s: %o', pluginId, loadError);

      // Emit plugin load error event
      pluginManagerLogger('Emitting plugin load error event for %s', pluginId);
      eventBus.emit('pluginLoadError', {
        pluginId,
        error: loadError.message,
        isInternal,
        timestamp: Date.now()
      } as PluginLoadErrorEvent);

      return null;
    }
  }

  /**
   * Load multiple plugins by ID
   * 
   * @param pluginIds Array of plugin IDs to load
   * @param isInternal Whether the plugins are internal
   * @returns Promise resolving to an array of successfully loaded configs
   */
  public async loadPlugins(pluginIds: PluginId[], isInternal: boolean = true): Promise<PluginConfig[]> {
    pluginManagerLogger('Loading multiple plugins: %s, isInternal: %s', pluginIds.join(', '), isInternal);
    const results: PluginConfig[] = [];

    for (const id of pluginIds) {
      pluginManagerLogger('Loading plugin %s as part of batch', id);
      const config = await this.loadPlugin(id, isInternal);
      if (config) {
        results.push(config);
      }
    }

    pluginManagerLogger('Successfully loaded %d/%d plugins', results.length, pluginIds.length);
    return results;
  }

  /**
   * Register a plugin with the registry
   * Attempts to load the plugin if it's not already loaded
   * Auto-approves internal plugins
   * 
   * @param pluginId Plugin ID to register
   * @returns Promise resolving to true if successful
   */
  public async registerPlugin(pluginId: PluginId): Promise<boolean> {
    pluginManagerLogger('Registering plugin %s', pluginId);
    try {
      // Check if plugin is already registered
      if (pluginRegistry.isPluginRegistered(pluginId)) {
        pluginManagerLogger('Plugin %s is already registered', pluginId);
        return true;
      }

      // First check if the plugin config is already available in registry
      let config = pluginRegistry.getPluginConfig(pluginId);
      let isInternalPlugin = false;

      // If not loaded, try to load it
      if (!config) {
        pluginManagerLogger('Plugin %s not registered, attempting to load', pluginId);

        // Try internal first, then external
        config = await this.loadPlugin(pluginId, true);
        if (config) {
          isInternalPlugin = true;
          pluginManagerLogger('Successfully loaded plugin %s as internal plugin', pluginId);
        } else {
          config = await this.loadPlugin(pluginId, false);
          if (config) {
            pluginManagerLogger('Successfully loaded plugin %s as external plugin', pluginId);
          }
        }

        if (!config) {
          pluginManagerLogger('Failed to load plugin %s for registration', pluginId);
          return false;
        }
      } else {
        // Check if the plugin is internal based on its config
        isInternalPlugin = !!config.internalPlugin;
        pluginManagerLogger('Using existing config for plugin %s (internal: %s)', pluginId, isInternalPlugin);
      }

      // Register with registry
      pluginManagerLogger('Registering plugin %s with registry', pluginId);
      const registered = pluginRegistry.registerPlugin(config);

      if (!registered) {
        pluginManagerLogger('Failed to register plugin %s with registry', pluginId);
        return false;
      }

      pluginManagerLogger('Successfully registered plugin %s', pluginId);

      // Auto-approve internal plugins
      if (registered && isInternalPlugin) {
        pluginManagerLogger('Auto-approving internal plugin %s', pluginId);
        pluginRegistry.approvePlugin(pluginId);
      }

      return registered;
    } catch (error) {
      pluginManagerLogger('Error registering plugin %s: %o', pluginId, error);
      return false;
    }
  }

  /**
   * Approve a registered plugin
   * This grants the plugin its requested permissions
   * 
   * @param pluginId Plugin ID to approve
   * @returns Promise resolving to true if successful
   */
  public async approvePlugin(pluginId: PluginId): Promise<boolean> {
    pluginManagerLogger('Approving plugin %s', pluginId);
    try {
      // Check if plugin is registered
      if (!pluginRegistry.isPluginRegistered(pluginId)) {
        pluginManagerLogger('Plugin %s is not registered, cannot approve', pluginId);
        return false;
      }

      // Approve the plugin
      const result = pluginRegistry.approvePlugin(pluginId);
      if (result) {
        pluginManagerLogger('Successfully approved plugin %s', pluginId);
      } else {
        pluginManagerLogger('Failed to approve plugin %s', pluginId);
      }

      return result;
    } catch (error) {
      pluginManagerLogger('Error approving plugin %s: %o', pluginId, error);
      return false;
    }
  }

  /**
   * Execute a plugin's background process
   * 
   * @param pluginId Plugin ID to execute
   * @param environmentId Current environment ID for the plugin context
   * @returns Promise resolving to true if successful
   */
  public async executePlugin(pluginId: PluginId, environmentId: number): Promise<boolean> {
    try {
      pluginManagerLogger('Executing plugin %s in environment %d', pluginId, environmentId);

      // Check if plugin is registered and approved
      if (!pluginRegistry.isPluginRegistered(pluginId)) {
        pluginManagerLogger('Plugin %s is not registered', pluginId);
        return false;
      }

      if (!pluginRegistry.isPluginApproved(pluginId)) {
        pluginManagerLogger('Plugin %s is not approved', pluginId);
        return false;
      }

      // Get plugin config and permissions
      const config = pluginRegistry.getPluginConfig(pluginId);
      const permissions = pluginRegistry.getPluginPermissions(pluginId);

      if (!config || !permissions) {
        pluginManagerLogger('Failed to get config or permissions for plugin %s', pluginId);
        return false;
      }

      // Check if plugin has a background process
      if (!config.background || !config.background.entryPoint) {
        pluginManagerLogger('Plugin %s does not have a background process', pluginId);
        return false;
      }

      // Execute the plugin's background process
      pluginManagerLogger('Executing background process for plugin %s', pluginId);
      const proxy = await backgroundScriptExecutor.executeWorker(
        pluginId,
        config,
        permissions,
        environmentId
      );

      if (proxy) {
        pluginManagerLogger('Plugin %s executed successfully', pluginId);
        return true;
      } else {
        pluginManagerLogger('Failed to execute plugin %s', pluginId);
        return false;
      }
    } catch (error) {
      const execError = new PluginExecutionError(
        `Error executing plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`,
        pluginId
      );
      pluginManagerLogger('Error executing plugin %s: %o', pluginId, execError);

      // Emit plugin worker error event
      eventBus.emit('pluginWorkerError', {
        pluginId,
        error: execError.message,
        timestamp: Date.now(),
        fatal: true
      });

      return false;
    }
  }

  /**
   * Setup and execute all internal plugins for a given environment
   * 
   * @param environmentId Current environment ID
   * @returns Promise resolving to the number of successfully executed plugins
   */
  public async executeAllInternalPlugins(environmentId: number): Promise<number> {
    try {
      pluginManagerLogger('Executing all internal plugins for environment %d', environmentId);

      // Get all registered internal plugins
      const plugins = pluginRegistry.getAllPlugins()
        .filter(plugin => plugin.pluginConfig.internalPlugin);

      pluginManagerLogger('Found %d internal plugins to execute', plugins.length);

      let executedCount = 0;

      // Execute each plugin
      for (const plugin of plugins) {
        pluginManagerLogger('Executing internal plugin %s in environment %d', plugin.id, environmentId);
        const executed = await this.executePlugin(plugin.id, environmentId);
        if (executed) {
          executedCount++;
          pluginManagerLogger('Successfully executed internal plugin %s', plugin.id);
        } else {
          pluginManagerLogger('Failed to execute internal plugin %s', plugin.id);
        }
      }

      pluginManagerLogger('Successfully executed %d/%d internal plugins', executedCount, plugins.length);
      return executedCount;
    } catch (error) {
      pluginManagerLogger('Error executing internal plugins: %o', error);
      return 0;
    }
  }

  /**
   * Stop a plugin's background process
   * 
   * @param pluginId Plugin ID to stop
   * @param reason Reason for stopping the worker
   * @returns Promise resolving to true if successful
   */
  public async stopPlugin(pluginId: PluginId, reason: 'user' | 'system' | 'error' = 'user'): Promise<boolean> {
    try {
      pluginManagerLogger('Stopping plugin %s (reason: %s)', pluginId, reason);
      const result = await backgroundScriptExecutor.stopWorker(pluginId, reason);
      if (result) {
        pluginManagerLogger('Successfully stopped plugin %s', pluginId);
      } else {
        pluginManagerLogger('Failed to stop plugin %s', pluginId);
      }
      return result;
    } catch (error) {
      pluginManagerLogger('Error stopping plugin %s: %o', pluginId, error);
      return false;
    }
  }

  /**
   * Unregister a plugin from the system
   * This will stop its background process if running
   * 
   * @param pluginId Plugin ID to unregister
   * @param reason Reason for unregistration
   * @returns Promise resolving to true if successful
   */
  public async unregisterPlugin(pluginId: PluginId, reason?: string): Promise<boolean> {
    pluginManagerLogger('Unregistering plugin %s, reason: %s', pluginId, reason || 'not specified');
    const result = pluginRegistry.unregisterPlugin(pluginId, reason);
    if (result) {
      pluginManagerLogger('Successfully unregistered plugin %s', pluginId);
    } else {
      pluginManagerLogger('Failed to unregister plugin %s', pluginId);
    }
    return result;
  }

  /**
   * Load and register a plugin
   * This does not approve or execute the plugin
   * 
   * @param pluginId Plugin ID to load and register
   * @param isInternal Whether the plugin is internal
   * @returns Promise resolving to true if successful
   */
  public async loadAndRegisterPlugin(pluginId: PluginId, isInternal: boolean = true): Promise<boolean> {
    try {
      pluginManagerLogger('Loading and registering plugin %s (internal: %s)', pluginId, isInternal);

      // Load plugin
      const config = await this.loadPlugin(pluginId, isInternal);
      if (!config) {
        pluginManagerLogger('Failed to load plugin %s', pluginId);
        return false;
      }

      // Register plugin
      const registered = pluginRegistry.registerPlugin(config);
      if (registered) {
        pluginManagerLogger('Successfully registered plugin %s', pluginId);
      } else {
        pluginManagerLogger('Failed to register plugin %s', pluginId);
      }

      return registered;
    } catch (error) {
      pluginManagerLogger('Error loading and registering plugin %s: %o', pluginId, error);
      return false;
    }
  }

  /**
   * Complete plugin setup: load, register, approve, and execute
   * 
   * @param pluginId Plugin ID to setup
   * @param isInternal Whether the plugin is internal
   * @param environmentId Current environment ID
   * @returns Promise resolving to true if successful
   */
  public async setupPlugin(
    pluginId: PluginId,
    isInternal: boolean = true,
    environmentId: number
  ): Promise<boolean> {
    try {
      pluginManagerLogger('Setting up plugin %s (internal: %s) for environment %d',
        pluginId, isInternal, environmentId);

      // Load and register
      const registered = await this.loadAndRegisterPlugin(pluginId, isInternal);
      if (!registered) {
        pluginManagerLogger('Failed to load and register plugin %s', pluginId);
        return false;
      }

      // Approve if not already approved (internal plugins should be auto-approved)
      if (!pluginRegistry.isPluginApproved(pluginId)) {
        pluginManagerLogger('Approving plugin %s', pluginId);
        const approved = await this.approvePlugin(pluginId);
        if (!approved) {
          pluginManagerLogger('Failed to approve plugin %s', pluginId);
          return false;
        }
      } else {
        pluginManagerLogger('Plugin %s is already approved', pluginId);
      }

      // Get plugin config
      const config = pluginRegistry.getPluginConfig(pluginId);
      if (!config) {
        pluginManagerLogger('Failed to get config for plugin %s', pluginId);
        return false;
      }

      // Execute if has background
      if (config.background && config.background.entryPoint) {
        pluginManagerLogger('Executing background process for plugin %s', pluginId);
        const executed = await this.executePlugin(pluginId, environmentId);
        if (!executed) {
          pluginManagerLogger('Failed to execute plugin %s', pluginId);
          return false;
        }
        pluginManagerLogger('Successfully executed plugin %s', pluginId);
        return true;
      }

      pluginManagerLogger('Plugin %s setup completed (no background process)', pluginId);
      return true;
    } catch (error) {
      pluginManagerLogger('Error setting up plugin %s: %o', pluginId, error);
      return false;
    }
  }

  /**
   * Check if a plugin is currently active (background worker running)
   * 
   * @param pluginId Plugin ID to check
   * @returns true if the plugin is active
   */
  public isPluginActive(pluginId: PluginId): boolean {
    const isActive = pluginRegistry.hasActiveWorker(pluginId);
    pluginManagerLogger('Plugin %s active status: %s', pluginId, isActive);
    return isActive;
  }

  /**
   * Get the status of a plugin
   * 
   * @param pluginId Plugin ID to check
   * @returns Promise resolving to the plugin status
   */
  public async getPluginStatus(pluginId: PluginId): Promise<ExtendedPluginStatus> {
    pluginManagerLogger('Getting status for plugin %s', pluginId);

    // Check if registered and approved
    const isRegistered = pluginRegistry.isPluginRegistered(pluginId);
    const isApproved = pluginRegistry.isPluginApproved(pluginId);

    // Check if active
    const isActive = pluginRegistry.hasActiveWorker(pluginId);

    // Get worker status if active
    let workerStatus = null;
    if (isActive) {
      pluginManagerLogger('Plugin %s is active, getting worker status', pluginId);
      workerStatus = await backgroundScriptExecutor.getWorkerStatus(pluginId);
    }

    // Get config
    const config = pluginRegistry.getPluginConfig(pluginId);

    const status : ExtendedPluginStatus= {
      id: pluginId,
      isLoaded: isRegistered, // If it's registered, it's loaded
      isRegistered,
      isApproved,
      isActive,
      workerStatus,
      config
    };

    pluginManagerLogger('Plugin %s status: %o', pluginId, {
      isRegistered,
      isApproved,
      isActive,
      hasWorkerStatus: !!workerStatus
    });

    return status;
  }

  /**
   * Get all loaded plugins
   * 
   * @returns Array of loaded plugin configs
   */
  public getLoadedPlugins(): PluginConfig[] {
    // Get all registered plugins from registry
    const registeredPlugins = pluginRegistry.getAllPlugins();
    pluginManagerLogger('Retrieved %d loaded plugins', registeredPlugins.length);

    // Extract the plugin configs
    return registeredPlugins.map(plugin => plugin.pluginConfig);
  }

  /**
   * Get all active plugins
   * 
   * @returns Array of active plugin IDs
   */
  public getActivePluginIds(): PluginId[] {
    const activeIds = pluginRegistry.getActivePluginIds();
    pluginManagerLogger('Retrieved %d active plugin IDs', activeIds.length);
    return activeIds;
  }

  /**
   * Check if the plugin system is initialized
   * 
   * @returns true if initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the count of active views for a plugin
   * 
   * @param pluginId Plugin ID to check
   * @returns Number of active views
   */
  public getActiveViewCount(pluginId: PluginId): number {
    const views = pluginRegistry.getActiveViews(pluginId);
    pluginManagerLogger('Plugin %s has %d active views', pluginId, views.length);
    return views.length;
  }

  /**
   * Get all plugins with active views
   * 
   * @returns Array of plugin IDs with active views
   */
  public getPluginsWithActiveViews(): PluginId[] {
    const plugins = pluginRegistry.getRegisteredPluginIds().filter(id =>
      pluginRegistry.hasActiveViews(id)
    );
    pluginManagerLogger('Found %d plugins with active views', plugins.length);
    return plugins;
  }
}

export default PluginManager.getInstance();