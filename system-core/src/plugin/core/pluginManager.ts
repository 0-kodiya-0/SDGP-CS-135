import {
    PluginId,
    PluginConfig,
    ExtendedPluginStatus,
    PluginLoadError,
    PluginExecutionError
  } from './types';
  import { InternalPluginLoader, ExternalPluginLoader } from './loaders';
  import pluginRegistry from './pluginRegistry';
  import backgroundExecutor from './executors/backgroundPluginExecutor';
  import eventBus from '../../events';
  import { PluginLoadedEvent, PluginLoadErrorEvent } from './types.event';
  
  /**
   * Central manager for the plugin system
   * Coordinates between loaders, registry, and executors
   */
  export class PluginManager {
    private static instance: PluginManager;
    private internalLoader: InternalPluginLoader;
    private externalLoader: ExternalPluginLoader;
    private initialized: boolean = false;
  
    private constructor() {
      this.internalLoader = new InternalPluginLoader();
      this.externalLoader = new ExternalPluginLoader();
      console.log('Plugin manager initialized');
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
     * This loads internal plugins but does not automatically execute them
     */
    public async initialize(): Promise<void> {
      if (this.initialized) {
        console.log('Plugin system already initialized');
        return;
      }
  
      try {
        console.log('Initializing plugin system');
  
        // Load internal plugins
        const internalPlugins = await this.internalLoader.loadAllPlugins();
        console.log(`Loaded ${internalPlugins.length} internal plugin configurations`);
  
        // Register each plugin with the registry
        for (const config of internalPlugins) {
          // Only register if not already registered
          if (!pluginRegistry.isPluginRegistered(config.id)) {
            pluginRegistry.registerPlugin(config);
          }
  
          // Emit plugin loaded event
          eventBus.emit('pluginLoaded', {
            pluginId: config.id,
            config,
            isInternal: true,
            timestamp: Date.now()
          } as PluginLoadedEvent);
        }
  
        this.initialized = true;
        console.log('Plugin system initialized successfully');
      } catch (error) {
        console.error('Failed to initialize plugin system:', error);
        throw error;
      }
    }
  
    /**
     * Shutdown the plugin system
     */
    public async shutdown(): Promise<void> {
      try {
        // Get all active plugin IDs
        const activePluginIds = pluginRegistry.getActivePluginIds();
  
        // Stop all workers through the executor
        for (const pluginId of activePluginIds) {
          await backgroundExecutor.stopWorker(pluginId, 'system');
        }
  
        // Unregister all plugins
        for (const pluginId of pluginRegistry.getRegisteredPluginIds()) {
          pluginRegistry.unregisterPlugin(pluginId, 'system shutdown');
        }
  
        this.initialized = false;
        console.log('Plugin system shut down successfully');
      } catch (error) {
        console.error('Error shutting down plugin system:', error);
        throw error;
      }
    }
  
    /**
     * Load a single plugin by ID
     * 
     * @param pluginId Plugin ID to load
     * @param isInternal Whether the plugin is internal
     * @returns Promise resolving to the plugin config or null if failed
     */
    public async loadPlugin(pluginId: PluginId, isInternal: boolean = true): Promise<PluginConfig | null> {
      try {
        // Check if already registered in registry
        if (pluginRegistry.isPluginRegistered(pluginId)) {
          return pluginRegistry.getPluginConfig(pluginId) || null;
        }
  
        // Use appropriate loader
        const loader = isInternal ? this.internalLoader : this.externalLoader;
        const config = await loader.loadPluginById(pluginId);
  
        if (config) {
          // Emit plugin loaded event
          eventBus.emit('pluginLoaded', {
            pluginId,
            config,
            isInternal,
            timestamp: Date.now()
          } as PluginLoadedEvent);
  
          return config;
        }
  
        return null;
      } catch (error) {
        const loadError = new PluginLoadError(
          `Error loading plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`,
          pluginId
        );
        console.error(loadError);
  
        // Emit plugin load error event
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
      const results: PluginConfig[] = [];
  
      for (const id of pluginIds) {
        const config = await this.loadPlugin(id, isInternal);
        if (config) {
          results.push(config);
        }
      }
  
      return results;
    }
  
    /**
     * Register a plugin with the registry
     * 
     * @param pluginId Plugin ID to register
     * @returns Promise resolving to true if successful
     */
    public async registerPlugin(pluginId: PluginId): Promise<boolean> {
      try {
        // Check if plugin is already registered
        if (pluginRegistry.isPluginRegistered(pluginId)) {
          console.log(`Plugin ${pluginId} is already registered`);
          return true;
        }
  
        // First check if the plugin config is already available in registry
        // (Could have been loaded but not registered)
        let config = pluginRegistry.getPluginConfig(pluginId);
  
        // If not loaded, try to load it
        if (!config) {
          // Try internal first, then external
          config = await this.loadPlugin(pluginId, true) || await this.loadPlugin(pluginId, false);
  
          if (!config) {
            const error = new PluginLoadError(`Failed to load plugin ${pluginId} for registration`, pluginId);
            console.error(error);
            return false;
          }
        }
  
        // Register with registry
        return pluginRegistry.registerPlugin(config);
      } catch (error) {
        console.error(`Error registering plugin ${pluginId}:`, error);
        return false;
      }
    }
  
    /**
     * Approve a registered plugin
     * 
     * @param pluginId Plugin ID to approve
     * @returns Promise resolving to true if successful
     */
    public async approvePlugin(pluginId: PluginId): Promise<boolean> {
      try {
        // Check if plugin is registered
        if (!pluginRegistry.isPluginRegistered(pluginId)) {
          console.error(`Plugin ${pluginId} is not registered`);
          return false;
        }
  
        // Approve the plugin
        return pluginRegistry.approvePlugin(pluginId);
      } catch (error) {
        console.error(`Error approving plugin ${pluginId}:`, error);
        return false;
      }
    }
  
    /**
     * Execute a plugin's background process
     * 
     * @param pluginId Plugin ID to execute
     * @returns Promise resolving to true if successful
     */
    public async executePlugin(pluginId: PluginId): Promise<boolean> {
      try {
        // Check if plugin is registered and approved
        if (!pluginRegistry.isPluginRegistered(pluginId)) {
          console.error(`Plugin ${pluginId} is not registered`);
          return false;
        }
  
        if (!pluginRegistry.isPluginApproved(pluginId)) {
          console.error(`Plugin ${pluginId} is not approved`);
          return false;
        }
  
        // Get plugin config and permissions
        const config = pluginRegistry.getPluginConfig(pluginId);
        const permissions = pluginRegistry.getPluginPermissions(pluginId);
  
        if (!config || !permissions) {
          console.error(`Failed to get config or permissions for plugin ${pluginId}`);
          return false;
        }
  
        // Check if plugin has a background process
        if (!config.background || !config.background.entryPoint) {
          console.log(`Plugin ${pluginId} does not have a background process`);
          return false;
        }
  
        // Execute the plugin's background process
        const proxy = await backgroundExecutor.executeWorker(pluginId, config, permissions);
        return proxy !== null;
      } catch (error) {
        const execError = new PluginExecutionError(
          `Error executing plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`,
          pluginId
        );
        console.error(execError);
  
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
     * Stop a plugin's background process
     * 
     * @param pluginId Plugin ID to stop
     * @param reason Reason for stopping
     * @returns Promise resolving to true if successful
     */
    public async stopPlugin(pluginId: PluginId, reason: 'user' | 'system' | 'error' = 'user'): Promise<boolean> {
      try {
        return await backgroundExecutor.stopWorker(pluginId, reason);
      } catch (error) {
        console.error(`Error stopping plugin ${pluginId}:`, error);
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
      return pluginRegistry.unregisterPlugin(pluginId, reason);
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
        // Load plugin
        const config = await this.loadPlugin(pluginId, isInternal);
        if (!config) {
          return false;
        }
  
        // Register plugin
        return pluginRegistry.registerPlugin(config);
      } catch (error) {
        console.error(`Error loading and registering plugin ${pluginId}:`, error);
        return false;
      }
    }
  
    /**
     * Complete plugin setup: load, register, approve, and execute
     * 
     * @param pluginId Plugin ID to setup
     * @param isInternal Whether the plugin is internal
     * @returns Promise resolving to true if successful
     */
    public async setupPlugin(pluginId: PluginId, isInternal: boolean = true): Promise<boolean> {
      try {
        // Load and register
        const registered = await this.loadAndRegisterPlugin(pluginId, isInternal);
        if (!registered) {
          return false;
        }
  
        // Approve
        const approved = await this.approvePlugin(pluginId);
        if (!approved) {
          return false;
        }
  
        // Get plugin config
        const config = pluginRegistry.getPluginConfig(pluginId);
        if (!config) {
          return false;
        }
  
        // Execute if has background
        if (config.background && config.background.entryPoint) {
          return await this.executePlugin(pluginId);
        }
  
        return true;
      } catch (error) {
        console.error(`Error setting up plugin ${pluginId}:`, error);
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
      return pluginRegistry.hasActiveWorker(pluginId);
    }
  
    /**
     * Get the status of a plugin
     * 
     * @param pluginId Plugin ID to check
     * @returns Promise resolving to the plugin status
     */
    public async getPluginStatus(pluginId: PluginId): Promise<ExtendedPluginStatus> {
      // Check if registered and approved
      const isRegistered = pluginRegistry.isPluginRegistered(pluginId);
      const isApproved = pluginRegistry.isPluginApproved(pluginId);
  
      // Check if active
      const isActive = pluginRegistry.hasActiveWorker(pluginId);
  
      // Get worker status if active
      let workerStatus = null;
      if (isActive) {
        workerStatus = await backgroundExecutor.getWorkerStatus(pluginId);
      }
  
      // Get config
      const config = pluginRegistry.getPluginConfig(pluginId);
  
      return {
        id: pluginId,
        isLoaded: isRegistered, // If it's registered, it's loaded
        isRegistered,
        isApproved,
        isActive,
        workerStatus,
        config
      };
    }
  
    /**
     * Get all loaded plugins
     * 
     * @returns Array of loaded plugin configs
     */
    public getLoadedPlugins(): PluginConfig[] {
      // Get all registered plugins from registry
      const registeredPlugins = pluginRegistry.getAllPlugins();
  
      // Extract the plugin configs
      return registeredPlugins.map(plugin => plugin.pluginConfig);
    }
  
    /**
     * Get all active plugins
     * 
     * @returns Array of active plugin IDs
     */
    public getActivePluginIds(): PluginId[] {
      return pluginRegistry.getActivePluginIds();
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
      return pluginRegistry.getActiveViews(pluginId).length;
    }
  
    /**
     * Get all plugins with active views
     * 
     * @returns Array of plugin IDs with active views
     */
    public getPluginsWithActiveViews(): PluginId[] {
      return pluginRegistry.getRegisteredPluginIds().filter(id =>
        pluginRegistry.hasActiveViews(id)
      );
    }
  }
  
  export default PluginManager.getInstance();