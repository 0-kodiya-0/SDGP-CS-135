import permissionManager from "./pluginPermissionManager";
import { PluginId, RegisteredPlugin, PluginConfig, PermissionObject } from "./types";

/**
 * Plugin Manager - Handles plugin registration lifecycle
 * 
 * This manager keeps track of registered plugins and manages their registration,
 * approval, and unregistration processes.
 */
export class PluginRegistry {
    private static instance: PluginRegistry;
    private registeredPlugins: Map<PluginId, RegisteredPlugin> = new Map();

    public static getInstance(): PluginRegistry {
        if (!PluginRegistry.instance) {
            PluginRegistry.instance = new PluginRegistry();
        }
        return PluginRegistry.instance;
    }

    /**
     * Register a plugin with the manager (pending approval)
     * 
     * @param pluginConfig - The plugin's validated pluginConfig containing metadata and permissions
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
            approved: false
        });

        // Also register with permission manager
        permissionManager.registerPluginPermissions(pluginId, emptyPermissions);

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

        // Update permissions in permission manager
        permissionManager.updatePluginPermissions(pluginId, plugin.permissions);

        console.log(`Plugin ${pluginId} approved with permissions:`, plugin.permissions);
        return true;
    }

    /**
     * Unregister a plugin from the manager
     * 
     * @param pluginId - Unique identifier for the plugin to unregister
     * @returns true if unregistration was successful
     */
    public unregisterPlugin(pluginId: PluginId): boolean {
        if (!this.registeredPlugins.has(pluginId)) {
            console.warn(`Plugin ${pluginId} is not registered.`);
            return false;
        }

        this.registeredPlugins.delete(pluginId);

        // Also unregister from permission manager
        permissionManager.unregisterPluginPermissions(pluginId);

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
        const plugin = this.registeredPlugins.get(pluginId);
        return plugin ? plugin.approved : false;
    }

    /**
     * Get all registered plugins
     * 
     * @returns Array of registered plugin IDs
     */
    public getRegisteredPluginIds(): PluginId[] {
        return Array.from(this.registeredPlugins.keys());
    }

    /**
     * Get all pending approval plugins
     * 
     * @returns Array of plugin IDs pending approval
     */
    public getPendingApprovalPluginIds(): PluginId[] {
        return Array.from(this.registeredPlugins.entries())
            .filter(([, plugin]) => !plugin.approved)
            .map(([id]) => id);
    }

    /**
     * Get all approved plugins
     * 
     * @returns Array of approved plugin IDs
     */
    public getApprovedPluginIds(): PluginId[] {
        return Array.from(this.registeredPlugins.entries())
            .filter(([, plugin]) => plugin.approved)
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
     * Get the full plugin configuration
     * 
     * @param pluginId - Unique identifier for the plugin
     * @returns The plugin configuration or undefined if plugin not registered
     */
    public getPluginConfig(pluginId: PluginId): PluginConfig | undefined {
        const plugin = this.registeredPlugins.get(pluginId);
        return plugin ? plugin.pluginConfig : undefined;
    }
}

// Create a singleton instance
export const pluginManager = new PluginRegistry();

export default pluginManager;