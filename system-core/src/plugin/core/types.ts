import { StorageOptions } from "../../storage/types";
import { WrappedStorageProvider } from "./wrappers/storage";

// Base permission types
export type PermissionResourceType = 'network' | 'storage' | 'dom' | 'file' | 'system';

// Network subpermission types
export type NetworkSubPermissionType = 'http' | 'websocket';

// Storage subpermission types
export type StorageSubPermissionType = 'read' | 'write';

// Network subpermissions
export interface NetworkPermission {
    http?: boolean;
    websocket?: boolean;
}

// Storage subpermissions
export interface StoragePermission {
    read?: boolean;
    write?: boolean;
}

// Permission object type definition
export interface PermissionObject {
    network?: NetworkPermission;
    storage?: StoragePermission;
    dom?: boolean;
    file?: boolean;
    system?: boolean;
}

export interface RegisteredPlugin {
    id: PluginId;
    pluginConfig: PluginConfig;
    permissions: PermissionObject;
    approved: boolean;
}

/**
 * Interface representing a loaded plugin configuration
 * Note: This does not include execution-related properties
 * as those will be managed by the plugin manager
 */
export interface LoadedPlugin {
    id: string;
    name: string;
    config: PluginConfig;
    path?: string;  // Path to the plugin directory from the plugins root
    hasUI: boolean;
    hasBackground: boolean;
    isDevelopmentMock?: boolean;
}

export type PluginId = string;

// Add additional metadata to PluginConfig
export interface PluginConfig {
    // Existing fields from your current definition
    id: string;
    name: string;
    version: string;
    description?: string;
    icon?: string;
    internalPlugin: boolean;

    ui?: {
        entryPoint: string;
        summaryView?: string;
        expandView?: string;
    };

    background?: {
        entryPoint: string;
    };

    worker: {
        entryPoint: string;
    };

    permissions?: PermissionObject;

    assets?: {
        bundles?: string[];
        images?: string[];
        other?: string[];
    };

    settings?: Record<string, unknown>;

    // New metadata field for internal use (not in the actual config file)
    _meta?: {
        basePath: string;
        [key: string]: unknown;
    };
}

export interface PluginMetaInformation {
    id: string;
    path: string;
    enabled: boolean;
}

export interface PluginGlobalConfig {
    version: string;
    lastUpdated: string;
    internalPlugins: PluginMetaInformation[];
    settings: {
        autoLoad: boolean;
        defaultTimeout: number;
    };
}


/**
 * Plugin API configuration
 */
export interface PluginApiConfig {
    // Plugin identification
    pluginId: string;
    pluginName: string;

    // Plugin permissions - updated to match new format
    permissions: {
        storage?: {
            read?: boolean;
            write?: boolean;
        };
        network?: {
            http?: boolean;
            websocket?: boolean;
        };
        dom?: boolean;
        file?: boolean;
        system?: boolean;
    };
}

/**
 * Global object containing plugin APIs
 */
export interface PluginGlobalApi {
    // Plugin information
    plugin: {
        id: string;
        name: string;
    };

    // Storage APIs
    storage: {
        // Default storage for this plugin
        default: WrappedStorageProvider;

        // Create custom storage (permissions are determined by system based on plugin's allowed permissions)
        create: (options: StorageOptions) => WrappedStorageProvider;
    };

    // Additional APIs can be added here as the system grows
    // network: { ... },
    // dom: { ... },
    // etc.
}