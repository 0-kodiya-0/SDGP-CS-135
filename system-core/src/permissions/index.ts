import { PluginManifest } from "../plugin/types";
import { PermissionType, PluginId, RegisteredPlugin } from "./types";

/**
 * Permission Manager - Handles plugin permissions at runtime
 * 
 * This manager keeps track of registered plugins and their permissions,
 * providing methods to check if operations are allowed.
 */
export class PermissionManager {
    private registeredPlugins: Map<PluginId, RegisteredPlugin> = new Map();

    /**
     * Register a plugin with the permission manager (pending approval)
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param manifest - The plugin's manifest containing metadata and permissions
     * @returns true if registration was successful
     */
    public registerPlugin(pluginId: PluginId, manifest: PluginManifest): boolean {
        if (this.registeredPlugins.has(pluginId)) {
            console.warn(`Plugin ${pluginId} is already registered.`);
            return false;
        }

        // Use the simplified permission types directly from manifest
        const permissionTypes: PermissionType[] = manifest.permissions as PermissionType[];

        this.registeredPlugins.set(pluginId, {
            id: pluginId,
            manifest,
            permissions: [], // No permissions granted until approved
            approved: false
        });

        console.log(`Plugin ${pluginId} registered (pending approval) with requested permissions:`, permissionTypes);
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

        // Use the simplified permission types directly from manifest
        const permissionTypes: PermissionType[] = plugin.manifest.permissions as PermissionType[];

        // Grant permissions
        plugin.permissions = [...permissionTypes];
        plugin.approved = true;

        console.log(`Plugin ${pluginId} approved with permissions:`, plugin.permissions);
        return true;
    }

    /**
     * Unregister a plugin from the permission manager
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
        console.log(`Plugin ${pluginId} unregistered.`);
        return true;
    }

    /**
     * Check if a plugin has a specific permission
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param permission - Permission type to check
     * @returns true if the plugin has the permission
     */
    public hasPermission(pluginId: PluginId, permission: PermissionType): boolean {
        const plugin = this.registeredPlugins.get(pluginId);

        if (!plugin) {
            console.warn(`Plugin ${pluginId} is not registered.`);
            return false;
        }

        if (!plugin.approved) {
            console.warn(`Plugin ${pluginId} is not approved yet.`);
            return false;
        }

        return plugin.permissions.includes(permission);
    }

    /**
     * Add a permission to a registered plugin
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param permission - Permission to add
     * @returns true if the permission was added successfully
     */
    public addPermission(pluginId: PluginId, permission: PermissionType): boolean {
        const plugin = this.registeredPlugins.get(pluginId);

        if (!plugin) {
            console.warn(`Plugin ${pluginId} is not registered.`);
            return false;
        }

        if (!plugin.approved) {
            console.warn(`Plugin ${pluginId} is not approved yet.`);
            return false;
        }

        if (plugin.permissions.includes(permission)) {
            console.warn(`Plugin ${pluginId} already has permission: ${permission}`);
            return false;
        }

        plugin.permissions.push(permission);
        console.log(`Added permission ${permission} to plugin ${pluginId}`);
        return true;
    }

    /**
     * Remove a permission from a registered plugin
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param permission - Permission to remove
     * @returns true if the permission was removed successfully
     */
    public removePermission(pluginId: PluginId, permission: PermissionType): boolean {
        const plugin = this.registeredPlugins.get(pluginId);

        if (!plugin) {
            console.warn(`Plugin ${pluginId} is not registered.`);
            return false;
        }

        if (!plugin.approved) {
            console.warn(`Plugin ${pluginId} is not approved yet.`);
            return false;
        }

        const index = plugin.permissions.indexOf(permission);
        if (index === -1) {
            console.warn(`Plugin ${pluginId} does not have permission: ${permission}`);
            return false;
        }

        plugin.permissions.splice(index, 1);
        console.log(`Removed permission ${permission} from plugin ${pluginId}`);
        return true;
    }

    /**
     * Get all permissions for a plugin
     * 
     * @param pluginId - Unique identifier for the plugin
     * @returns Array of permission types or undefined if plugin not registered
     */
    public getPluginPermissions(pluginId: PluginId): PermissionType[] | undefined {
        const plugin = this.registeredPlugins.get(pluginId);

        if (!plugin) {
            console.warn(`Plugin ${pluginId} is not registered.`);
            return undefined;
        }

        return [...plugin.permissions];
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, plugin]) => !plugin.approved)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(([id, _]) => id);
    }

    /**
     * Get all approved plugins
     * 
     * @returns Array of approved plugin IDs
     */
    public getApprovedPluginIds(): PluginId[] {
        return Array.from(this.registeredPlugins.entries())
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, plugin]) => plugin.approved)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(([id, _]) => id);
    }

    /**
     * Get requested permissions for a plugin (from manifest)
     * 
     * @param pluginId - Unique identifier for the plugin
     * @returns Array of requested permission types or undefined if plugin not registered
     */
    public getRequestedPermissions(pluginId: PluginId): PermissionType[] | undefined {
        const plugin = this.registeredPlugins.get(pluginId);

        if (!plugin) {
            console.warn(`Plugin ${pluginId} is not registered.`);
            return undefined;
        }

        // Use the simplified permission types directly from manifest
        const permissionTypes: PermissionType[] = plugin.manifest.permissions as PermissionType[];

        return permissionTypes;
    }
}

// Create a singleton instance
export const permissionManager = new PermissionManager();

export default permissionManager;