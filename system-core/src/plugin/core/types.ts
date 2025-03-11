import * as Comlink from "comlink";
import { StorageOptions } from "../../api/storage/types";
import { WrappedStorageProvider } from "./wrappers/storage";
import { PluginWorkerAPI } from "./pluginWorkerApi";
import { HttpApiWrapper, WebSocketApiWrapper, SocketIOApiWrapper } from "./wrappers/network";

// Base types and IDs
export type PluginId = string;

// Network subpermission types
export type NetworkSubPermissionType = 'http' | 'websocket' | 'socketio';

// Storage subpermission types
export type StorageSubPermissionType = 'read' | 'write';

// Network subpermissions
export interface NetworkPermission {
    http?: boolean;
    websocket?: boolean;
    socketio?: boolean;
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

// Plugin Settings Interface
export interface PluginSettings {
    enabled?: boolean;
    autoStart?: boolean;
    displayMode?: 'hidden' | 'minimal' | 'full';
    customOptions?: Record<string, unknown>;
    [key: string]: unknown;
}

// Categories and tags for plugin search
export interface PluginTaxonomy {
    categories?: string[];
    tags?: string[];
}

// Updated Plugin Config Structure
export interface PluginConfig {
    id: string;
    name: string;
    version: string;
    description?: string;
    icon?: string;
    author?: string;
    internalPlugin: boolean;

    // UI components
    view?: {
        summary?: {
            entryPoint: string;
        };
        expand?: {
            entryPoint: string;
        };
    };

    // Background process
    background?: {
        entryPoint: string;
    };

    // Permissions requested by the plugin
    permissions?: PermissionObject;

    // Plugin assets
    assets?: {
        bundles?: string[];
        images?: string[];
        other?: string[];
    };

    // Settings
    settings?: PluginSettings;

    // Taxonomy for search
    categories?: string[];
    tags?: string[];

    // Plugin popularity/stats for sorting in search
    popularity?: number;
    lastUpdated?: string;
    created?: string;

    // Metadata (internal use only, not in actual config file)
    _meta?: {
        basePath: string;
        [key: string]: unknown;
    };
}

/**
 * Interface for a registered plugin with active components tracking
 */
export interface RegisteredPlugin {
    id: PluginId;
    pluginConfig: PluginConfig;
    permissions: PermissionObject;
    approved: boolean;

    // Active background worker information
    activeBackground?: {
        worker: Worker;
        proxy: Comlink.Remote<PluginWorkerAPI>;
        blobUrl?: string;
    };

    // Active view instances
    activeViews: {
        id: string;  // Unique identifier for the view instance
        type: 'summary' | 'expand';
        iframe?: HTMLIFrameElement;
    }[];
}

/**
 * Interface for a loaded plugin (with additional details)
 */
export interface LoadedPlugin {
    id: string;
    name: string;
    config: PluginConfig;
    path?: string;  // Path to the plugin directory
    hasUI: boolean;  // Has any view entry points
    hasBackground: boolean; // Has background entry point
}

/**
 * Plugin status information
 */
export interface PluginStatus {
    isActive: boolean;
    version: string;
    features?: string[];
    lastError?: string;
    resourceUsage?: {
        memory?: number;
        cpu?: number;
    };
    [key: string]: unknown;
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
    storage?: {
        // Default storage for this plugin
        default: WrappedStorageProvider;

        // Create custom storage (permissions are determined by system)
        create: (options: StorageOptions) => WrappedStorageProvider;
    };

    network?: {
        http?: HttpApiWrapper;
        websocket?: WebSocketApiWrapper;
        socketio?: SocketIOApiWrapper;
    }

    // Additional APIs can be added here as the system grows
    // network?: { ... };
    // dom?: { ... };
    // etc.

    // Allow for future extensions
    [key: string]: unknown;
}

/**
 * Plugin global configuration
 */
export interface PluginGlobalConfig {
    version: string;
    lastUpdated: string;
    internalPlugins: {
        id: string;
        path: string;
        enabled: boolean;
    }[];
    settings: {
        autoLoad: boolean;
        defaultTimeout: number;
    };
}

/**
 * Plugin worker configuration
 */
export interface PluginWorkerConfig {
    pluginId: PluginId;
    pluginName: string;
    entryPoint: string;
    permissions: PermissionObject;
}

/**
 * Plugin search options
 */
export interface PluginSearchOptions {
    query?: string;
    categories?: string[];
    tags?: string[];
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'popularity' | 'updated' | 'created';
    sortDirection?: 'asc' | 'desc';
    includeInternal?: boolean;
    includeExternal?: boolean;
}

/**
 * Plugin search results
 */
export interface PluginSearchResults {
    plugins: PluginConfig[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Extended plugin status with more details
 */
export interface ExtendedPluginStatus {
    id: PluginId;
    isLoaded: boolean;
    isRegistered: boolean;
    isApproved: boolean;
    isActive: boolean;
    workerStatus?: PluginStatus;
    config?: PluginConfig;
    lastError?: string;
    activeViews?: number;
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
    valid: boolean;
    missingFiles: string[];
    warnings?: string[];
    errors?: string[];
}