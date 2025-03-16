import * as Comlink from "comlink";
import {
  PluginId,
  PluginConfig,
  PermissionObject,
  RegisteredPlugin
} from "./types";
import { PluginWorkerAPI } from "./pluginWorkerApi";
import {
  PluginRegisteredEvent,
  PluginUnregisteredEvent,
  PluginApprovedEvent,
  PluginWorkerStartedEvent,
  PluginWorkerStoppedEvent,
  PluginUiDisplayEvent,
  PluginUiHideEvent
} from "./types.event";
import eventBus from "../../events";
import { pluginRegistryLogger } from "./utils/logger";

/**
 * Plugin Registry - Central store for all plugin information
 * 
 * - Handles plugin registration lifecycle
 * - Tracks permissions and approval status
 * - Maintains active worker and view references
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private registeredPlugins: Map<PluginId, RegisteredPlugin> = new Map();
  private approvedPlugins: Set<PluginId> = new Set();

  private constructor() {
    pluginRegistryLogger('Plugin registry initialized');
  }

  /**
   * Get the singleton instance of the PluginRegistry
   */
  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Register a plugin with the registry (pending approval)
   * 
   * @param pluginConfig - The plugin's validated configuration
   * @returns true if registration was successful
   */
  public registerPlugin(pluginConfig: PluginConfig): boolean {
    const pluginId = pluginConfig.id;
    pluginRegistryLogger('Registering plugin %s', pluginId);

    if (this.registeredPlugins.has(pluginId)) {
      pluginRegistryLogger('Plugin %s is already registered', pluginId);
      return false;
    }

    // Create an empty permission object structure
    const emptyPermissions: PermissionObject = {};

    this.registeredPlugins.set(pluginId, {
      id: pluginId,
      pluginConfig,
      permissions: emptyPermissions, // No permissions granted until approved
      approved: false,
      activeViews: [] // Initialize with no active views
    });

    // Emit plugin registered event
    eventBus.emit('pluginRegistered', {
      pluginId,
      config: pluginConfig,
      timestamp: Date.now()
    } as PluginRegisteredEvent);

    pluginRegistryLogger('Plugin %s registered (pending approval)', pluginId);
    return true;
  }

  /**
   * Approve a plugin and grant its requested permissions
   * 
   * @param pluginId - Unique identifier for the plugin to approve
   * @returns true if approval was successful
   */
  public approvePlugin(pluginId: PluginId): boolean {
    pluginRegistryLogger('Approving plugin %s', pluginId);
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      pluginRegistryLogger('Plugin %s is not registered', pluginId);
      return false;
    }

    if (plugin.approved) {
      pluginRegistryLogger('Plugin %s is already approved', pluginId);
      return false;
    }

    // Extract permissions from pluginConfig
    const requestedPermissions = plugin.pluginConfig.permissions as PermissionObject;

    // Grant permissions
    plugin.permissions = { ...requestedPermissions };
    plugin.approved = true;

    // Add to approved plugins set
    this.approvedPlugins.add(pluginId);

    // Emit plugin approved event
    eventBus.emit('pluginApproved', {
      pluginId,
      config: plugin.pluginConfig,
      timestamp: Date.now()
    } as PluginApprovedEvent);

    pluginRegistryLogger('Plugin %s approved with permissions: %o', pluginId, plugin.permissions);
    return true;
  }

  /**
   * Register a background worker for a plugin
   * 
   * @param pluginId Plugin ID
   * @param worker Worker instance
   * @param proxy Comlink proxy to the worker
   * @param blobUrl Optional blob URL for cleanup
   * @returns true if successful
   */
  public registerWorker(
    pluginId: PluginId,
    worker: Worker,
    proxy: Comlink.Remote<PluginWorkerAPI>,
    blobUrl?: string
  ): boolean {
    pluginRegistryLogger('Registering worker for plugin %s', pluginId);
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      pluginRegistryLogger('Plugin %s is not registered', pluginId);
      return false;
    }

    // Store worker info
    plugin.activeBackground = { worker, proxy, blobUrl };

    // Update the plugin in the registry
    this.registeredPlugins.set(pluginId, plugin);

    // Emit worker started event
    eventBus.emit('pluginWorkerStarted', {
      pluginId,
      config: plugin.pluginConfig,
      timestamp: Date.now()
    } as PluginWorkerStartedEvent);

    pluginRegistryLogger('Worker registered for plugin %s', pluginId);
    return true;
  }

  /**
   * Unregister a background worker for a plugin
   * 
   * @param pluginId Plugin ID
   * @param reason Reason for stopping the worker
   * @returns true if successful
   */
  public unregisterWorker(pluginId: PluginId, reason: 'user' | 'system' | 'error' = 'user'): boolean {
    pluginRegistryLogger('Unregistering worker for plugin %s (reason: %s)', pluginId, reason);
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin || !plugin.activeBackground) {
      pluginRegistryLogger('No active worker found for plugin %s', pluginId);
      return false;
    }

    // Get worker info for cleanup
    const { worker, blobUrl } = plugin.activeBackground;

    // Terminate the worker
    worker.terminate();

    // Clean up blob URL if it exists
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }

    // Remove worker info
    plugin.activeBackground = undefined;

    // Update the plugin in the registry
    this.registeredPlugins.set(pluginId, plugin);

    // Emit worker stopped event
    eventBus.emit('pluginWorkerStopped', {
      pluginId,
      reason,
      timestamp: Date.now()
    } as PluginWorkerStoppedEvent);

    pluginRegistryLogger('Worker unregistered for plugin %s', pluginId);
    return true;
  }

  /**
   * Register a view for a plugin
   * 
   * @param pluginId Plugin ID
   * @param viewId Unique ID for the view instance
   * @param type Type of view ('summary' or 'expand')
   * @param iframe Optional iframe reference
   * @returns true if successful
   */
  public registerView(
    pluginId: PluginId,
    viewId: string,
    type: 'summary' | 'expand',
    proxy: Comlink.Remote<PluginWorkerAPI>,
    iframe?: HTMLIFrameElement,
  ): boolean {
    pluginRegistryLogger('Registering view for plugin %s: %s (%s)', pluginId, viewId, type);
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      pluginRegistryLogger('Plugin %s is not registered', pluginId);
      return false;
    }

    // Check if this view ID already exists
    const existingViewIndex = plugin.activeViews.findIndex(v => v.id === viewId);
    if (existingViewIndex >= 0) {
      // Update existing view
      pluginRegistryLogger('Updating existing view %s for plugin %s', viewId, pluginId);
      plugin.activeViews[existingViewIndex] = { id: viewId, type, iframe, proxy };
    } else {
      // Add new view
      pluginRegistryLogger('Adding new view %s for plugin %s', viewId, pluginId);
      plugin.activeViews.push({ id: viewId, type, iframe, proxy });
    }

    // Update the plugin in the registry
    this.registeredPlugins.set(pluginId, plugin);

    // Emit view display event
    eventBus.emit('pluginUiDisplay', {
      pluginId,
      config: plugin.pluginConfig,
      viewType: type,
      uiPath: viewId, // Use viewId as the path for event
      timestamp: Date.now()
    } as PluginUiDisplayEvent);

    return true;
  }

  /**
   * Unregister a view for a plugin
   * 
   * @param pluginId Plugin ID
   * @param viewId Unique ID for the view instance
   * @returns true if successful
   */
  public unregisterView(pluginId: PluginId, viewId: string): boolean {
    pluginRegistryLogger('Unregistering view %s for plugin %s', viewId, pluginId);
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      pluginRegistryLogger('Plugin %s is not registered', pluginId);
      return false;
    }

    // Find the view
    const viewIndex = plugin.activeViews.findIndex(v => v.id === viewId);
    if (viewIndex < 0) {
      pluginRegistryLogger('View %s not found for plugin %s', viewId, pluginId);
      return false;
    }

    // Remove the view
    plugin.activeViews.splice(viewIndex, 1);
    pluginRegistryLogger('View %s removed from plugin %s', viewId, pluginId);

    // Update the plugin in the registry
    this.registeredPlugins.set(pluginId, plugin);

    // Emit view hide event
    eventBus.emit('pluginUiHide', {
      pluginId,
      timestamp: Date.now()
    } as PluginUiHideEvent);

    return true;
  }

  /**
   * Unregister a plugin from the registry
   * 
   * @param pluginId - Unique identifier for the plugin to unregister
   * @param reason - Reason for unregistration
   * @returns true if unregistration was successful
   */
  public unregisterPlugin(pluginId: PluginId, reason?: string): boolean {
    pluginRegistryLogger('Unregistering plugin %s', pluginId);
    
    if (!this.registeredPlugins.has(pluginId)) {
      pluginRegistryLogger('Plugin %s is not registered', pluginId);
      return false;
    }

    // Get the plugin to clean up active components
    const plugin = this.registeredPlugins.get(pluginId)!;

    // Clean up background worker if active
    if (plugin.activeBackground) {
      pluginRegistryLogger('Cleaning up background worker for plugin %s', pluginId);
      this.unregisterWorker(pluginId, 'system');
    }

    // Clear from maps and sets
    this.registeredPlugins.delete(pluginId);
    this.approvedPlugins.delete(pluginId);

    // Emit plugin unregistered event
    eventBus.emit('pluginUnregistered', {
      pluginId,
      reason,
      timestamp: Date.now()
    } as PluginUnregisteredEvent);

    pluginRegistryLogger('Plugin %s unregistered successfully', pluginId);
    return true;
  }

  /**
   * Check if a plugin is registered
   * 
   * @param pluginId - Unique identifier for the plugin
   * @returns true if the plugin is registered
   */
  public isPluginRegistered(pluginId: PluginId): boolean {
    return this.registeredPlugins.has(pluginId);
  }

  /**
   * Check if a plugin is approved
   * 
   * @param pluginId - Unique identifier for the plugin
   * @returns true if the plugin is approved
   */
  public isPluginApproved(pluginId: PluginId): boolean {
    return this.approvedPlugins.has(pluginId);
  }

  /**
   * Check if a plugin has an active background worker
   * 
   * @param pluginId Plugin ID to check
   * @returns true if the plugin has an active worker
   */
  public hasActiveWorker(pluginId: PluginId): boolean {
    const plugin = this.registeredPlugins.get(pluginId);
    return !!plugin?.activeBackground;
  }

  /**
   * Get worker proxy for a plugin
   * 
   * @param pluginId Plugin ID
   * @returns Worker proxy or null if not active
   */
  public getWorkerProxy(pluginId: PluginId): Comlink.Remote<PluginWorkerAPI> | null {
    const plugin = this.registeredPlugins.get(pluginId);
    return plugin?.activeBackground?.proxy || null;
  }

  /**
   * Get all active plugin IDs (plugins with running workers)
   * 
   * @returns Array of active plugin IDs
   */
  public getActivePluginIds(): PluginId[] {
    const activeIds = Array.from(this.registeredPlugins.entries())
      .filter(([, plugin]) => !!plugin.activeBackground)
      .map(([id]) => id);
    
    pluginRegistryLogger('Found %d active plugins', activeIds.length);
    return activeIds;
  }

  /**
   * Get granted permissions for a plugin
   * 
   * @param pluginId - Unique identifier for the plugin
   * @returns Object containing granted permissions or undefined if plugin not registered/approved
   */
  public getPluginPermissions(pluginId: PluginId): PermissionObject | undefined {
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      pluginRegistryLogger('Plugin %s is not registered', pluginId);
      return undefined;
    }

    if (!plugin.approved) {
      pluginRegistryLogger('Plugin %s is not approved', pluginId);
      return undefined;
    }

    return { ...plugin.permissions };
  }

  /**
   * Get the full plugin configuration
   * 
   * @param pluginId - Unique identifier for the plugin
   * @returns The plugin configuration or undefined if plugin not registered
   */
  public getPluginConfig(pluginId: PluginId): PluginConfig | undefined {
    const plugin = this.registeredPlugins.get(pluginId);
    return plugin ? plugin.pluginConfig : undefined;
  }

  /**
   * Get a registered plugin
   * 
   * @param pluginId Plugin ID
   * @returns The registered plugin or undefined if not found
   */
  public getPlugin(pluginId: PluginId): RegisteredPlugin | undefined {
    return this.registeredPlugins.get(pluginId);
  }

  /**
   * Get all registered plugins
   * 
   * @returns Array of registered plugins
   */
  public getAllPlugins(): RegisteredPlugin[] {
    return Array.from(this.registeredPlugins.values());
  }

  /**
   * Get all registered plugin IDs
   * 
   * @returns Array of registered plugin IDs
   */
  public getRegisteredPluginIds(): PluginId[] {
    return Array.from(this.registeredPlugins.keys());
  }

  /**
   * Check if a plugin has any active views
   * 
   * @param pluginId Plugin ID to check
   * @returns true if the plugin has any active views
   */
  public hasActiveViews(pluginId: PluginId): boolean {
    const plugin = this.registeredPlugins.get(pluginId);
    return !!plugin?.activeViews.length;
  }

  /**
   * Get active views for a plugin
   * 
   * @param pluginId Plugin ID
   * @returns Array of active view information
   */
  public getActiveViews(pluginId: PluginId): RegisteredPlugin['activeViews'] {
    const plugin = this.registeredPlugins.get(pluginId);
    return plugin?.activeViews || [];
  }
}

export default PluginRegistry.getInstance();