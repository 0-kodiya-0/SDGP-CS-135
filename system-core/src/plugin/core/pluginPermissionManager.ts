import { 
    NetworkSubPermissionType, 
    PermissionObject, 
    PluginId, 
    StorageSubPermissionType 
} from "./types";

/**
 * Permission Manager - Handles plugin permissions at runtime
 * 
 * This manager focuses on storing and checking permissions for plugins
 * without handling the registration lifecycle.
 */
export class PermissionManager {
    private pluginPermissions: Map<PluginId, PermissionObject> = new Map();
    private approvedPlugins: Set<PluginId> = new Set();

    /**
     * Register a plugin's permissions with the permission manager
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param permissions - The initial permissions to set
     * @param approved - Whether the plugin is approved (default: false)
     * @returns true if registration was successful
     */
    public registerPluginPermissions(
        pluginId: PluginId, 
        permissions: PermissionObject, 
        approved: boolean = false
    ): boolean {
        if (this.pluginPermissions.has(pluginId)) {
            console.warn(`Plugin ${pluginId} permissions are already registered.`);
            return false;
        }

        this.pluginPermissions.set(pluginId, { ...permissions });
        
        if (approved) {
            this.approvedPlugins.add(pluginId);
        }
        
        return true;
    }

    /**
     * Update a plugin's permissions
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param permissions - The new permissions to set
     * @param approved - Whether to mark the plugin as approved (default: true)
     * @returns true if update was successful
     */
    public updatePluginPermissions(
        pluginId: PluginId, 
        permissions: PermissionObject,
        approved: boolean = true
    ): boolean {
        if (!this.pluginPermissions.has(pluginId)) {
            console.warn(`Plugin ${pluginId} permissions are not registered.`);
            return false;
        }

        this.pluginPermissions.set(pluginId, { ...permissions });
        
        if (approved) {
            this.approvedPlugins.add(pluginId);
        }
        
        return true;
    }

    /**
     * Unregister a plugin's permissions
     * 
     * @param pluginId - Unique identifier for the plugin
     * @returns true if unregistration was successful
     */
    public unregisterPluginPermissions(pluginId: PluginId): boolean {
        if (!this.pluginPermissions.has(pluginId)) {
            console.warn(`Plugin ${pluginId} permissions are not registered.`);
            return false;
        }

        this.pluginPermissions.delete(pluginId);
        this.approvedPlugins.delete(pluginId);
        
        return true;
    }

    /**
     * Set a plugin's approval status
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param approved - Whether the plugin should be approved
     * @returns true if setting approval was successful
     */
    public setPluginApproval(pluginId: PluginId, approved: boolean): boolean {
        if (!this.pluginPermissions.has(pluginId)) {
            console.warn(`Plugin ${pluginId} permissions are not registered.`);
            return false;
        }

        if (approved) {
            this.approvedPlugins.add(pluginId);
        } else {
            this.approvedPlugins.delete(pluginId);
        }
        
        return true;
    }

    /**
     * Check if a plugin has permission for a boolean resource type (dom, file, system)
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param resource - Resource type to check (must be a boolean permission type)
     * @returns true if the plugin has the permission
     */
    public hasBooleanPermission(pluginId: PluginId, resource: 'dom' | 'file' | 'system'): boolean {
        if (!this.isApproved(pluginId)) {
            return false;
        }

        const permissions = this.pluginPermissions.get(pluginId);
        return permissions ? !!permissions[resource] : false;
    }

    /**
     * Check if a plugin has permission for network subpermission
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param subpermission - Network subpermission to check
     * @returns true if the plugin has the subpermission
     */
    public hasNetworkPermission(pluginId: PluginId, subpermission: NetworkSubPermissionType): boolean {
        if (!this.isApproved(pluginId)) {
            return false;
        }

        const permissions = this.pluginPermissions.get(pluginId);
        
        if (!permissions || !permissions.network) {
            return false;
        }

        return !!permissions.network[subpermission];
    }

    /**
     * Check if a plugin has permission for storage subpermission
     * 
     * @param pluginId - Unique identifier for the plugin
     * @param subpermission - Storage subpermission to check
     * @returns true if the plugin has the subpermission
     */
    public hasStoragePermission(pluginId: PluginId, subpermission: StorageSubPermissionType): boolean {
        if (!this.isApproved(pluginId)) {
            return false;
        }

        const permissions = this.pluginPermissions.get(pluginId);
        
        if (!permissions || !permissions.storage) {
            return false;
        }

        return !!permissions.storage[subpermission];
    }

    /**
     * Get all permissions for a plugin
     * 
     * @param pluginId - Unique identifier for the plugin
     * @returns Object containing all permissions or undefined if plugin not registered
     */
    public getPluginPermissions(pluginId: PluginId): PermissionObject | undefined {
        const permissions = this.pluginPermissions.get(pluginId);
        
        if (!permissions) {
            console.warn(`Plugin ${pluginId} permissions are not registered.`);
            return undefined;
        }

        return { ...permissions };
    }

    /**
     * Check if a plugin is registered with the permission manager
     * 
     * @param pluginId - Unique identifier for the plugin
     * @returns true if the plugin is registered
     */
    public isRegistered(pluginId: PluginId): boolean {
        return this.pluginPermissions.has(pluginId);
    }

    /**
     * Check if a plugin is approved
     * 
     * @param pluginId - Unique identifier for the plugin
     * @returns true if the plugin is approved
     */
    public isApproved(pluginId: PluginId): boolean {
        return this.approvedPlugins.has(pluginId);
    }
}

// Create a singleton instance
export const permissionManager = new PermissionManager();

export default permissionManager;