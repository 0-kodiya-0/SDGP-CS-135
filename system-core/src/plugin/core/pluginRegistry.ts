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
  PluginApprovalRevokedEvent,
  PluginWorkerStartedEvent,
  PluginWorkerStoppedEvent,
  PluginUiDisplayEvent,
  PluginUiHideEvent
} from "./types.event";
import eventBus from "../../events";

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

  private constructor() { }

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

    if (this.registeredPlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is already registered.`);
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

    console.log(`Plugin ${pluginId} registered (pending approval) with requested permissions:`, pluginConfig.permissions);
    return true;
  }

  /**
   * Approve a plugin and grant its requested permissions
   * 
   * @param pluginId - Unique identifier for the plugin to approve
   * @returns true if approval was successful
   */
  public approvePlugin(pluginId: PluginId): boolean {
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not registered.`);
      return false;
    }

    if (plugin.approved) {
      console.warn(`Plugin ${pluginId} is already approved.`);
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

    console.log(`Plugin ${pluginId} approved with permissions:`, plugin.permissions);
    return true;
  }

  /**
   * Set plugin approval status
   * 
   * @param pluginId - Unique identifier for the plugin
   * @param approved - Whether to approve the plugin
   * @returns true if successful
   */
  public setPluginApproval(pluginId: PluginId, approved: boolean): boolean {
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not registered.`);
      return false;
    }

    if (approved) {
      // If approving, use the full approve flow
      if (!plugin.approved) {
        return this.approvePlugin(pluginId);
      }
    } else {
      // If revoking approval
      plugin.approved = false;
      this.approvedPlugins.delete(pluginId);

      // Emit event
      eventBus.emit('pluginApprovalRevoked', {
        pluginId,
        timestamp: Date.now()
      } as PluginApprovalRevokedEvent);

      console.log(`Approval revoked for plugin ${pluginId}`);
    }

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
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not registered.`);
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

    console.log(`Worker registered for plugin ${pluginId}`);
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
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin || !plugin.activeBackground) {
      console.warn(`No active worker found for plugin ${pluginId}`);
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

    console.log(`Worker unregistered for plugin ${pluginId}`);
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
    iframe?: HTMLIFrameElement
  ): boolean {
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not registered.`);
      return false;
    }

    // Check if this view ID already exists
    const existingViewIndex = plugin.activeViews.findIndex(v => v.id === viewId);
    if (existingViewIndex >= 0) {
      // Update existing view
      plugin.activeViews[existingViewIndex] = { id: viewId, type, iframe };
    } else {
      // Add new view
      plugin.activeViews.push({ id: viewId, type, iframe });
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

    console.log(`View registered for plugin ${pluginId}: ${viewId} (${type})`);
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
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not registered.`);
      return false;
    }

    // Find the view
    const viewIndex = plugin.activeViews.findIndex(v => v.id === viewId);
    if (viewIndex < 0) {
      console.warn(`View ${viewId} not found for plugin ${pluginId}`);
      return false;
    }

    // Remove the view
    plugin.activeViews.splice(viewIndex, 1);

    // Update the plugin in the registry
    this.registeredPlugins.set(pluginId, plugin);

    // Emit view hide event
    eventBus.emit('pluginUiHide', {
      pluginId,
      timestamp: Date.now()
    } as PluginUiHideEvent);

    console.log(`View unregistered for plugin ${pluginId}: ${viewId}`);
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
    if (!this.registeredPlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is not registered.`);
      return false;
    }

    // Get the plugin to clean up active components
    const plugin = this.registeredPlugins.get(pluginId)!;

    // Clean up background worker if active
    if (plugin.activeBackground) {
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

    console.log(`Plugin ${pluginId} unregistered.`);
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

  /**
   * Get all registered plugin IDs
   * 
   * @returns Array of registered plugin IDs
   */
  public getRegisteredPluginIds(): PluginId[] {
    return Array.from(this.registeredPlugins.keys());
  }

  /**
   * Get all pending approval plugin IDs
   * 
   * @returns Array of plugin IDs pending approval
   */
  public getPendingApprovalPluginIds(): PluginId[] {
    return Array.from(this.registeredPlugins.entries())
      .filter(([id]) => !this.approvedPlugins.has(id))
      .map(([id]) => id);
  }

  /**
   * Get all approved plugin IDs
   * 
   * @returns Array of approved plugin IDs
   */
  public getApprovedPluginIds(): PluginId[] {
    return Array.from(this.approvedPlugins);
  }

  /**
   * Get all active plugin IDs (plugins with running workers)
   * 
   * @returns Array of active plugin IDs
   */
  public getActivePluginIds(): PluginId[] {
    return Array.from(this.registeredPlugins.entries())
      .filter(([, plugin]) => !!plugin.activeBackground)
      .map(([id]) => id);
  }

  /**
   * Get requested permissions for a plugin (from pluginConfig)
   * 
   * @param pluginId - Unique identifier for the plugin
   * @returns Object containing requested permissions or undefined if plugin not registered
   */
  public getRequestedPermissions(pluginId: PluginId): PermissionObject | undefined {
    const plugin = this.registeredPlugins.get(pluginId);

    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not registered.`);
      return undefined;
    }

    return plugin.pluginConfig.permissions as PermissionObject;
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
      console.warn(`Plugin ${pluginId} is not registered.`);
      return undefined;
    }

    if (!plugin.approved) {
      console.warn(`Plugin ${pluginId} is not approved.`);
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
}

export default PluginRegistry.getInstance();