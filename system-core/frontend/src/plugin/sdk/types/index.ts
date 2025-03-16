/**
 * @package PluginSDK
 * @description Type definitions for developing plugins
 * @version 1.0.0
 */

/**
 * ===========================
 * Core Plugin Types
 * ===========================
 */

/**
 * Unique identifier for a plugin
 */
export type PluginId = string;

/**
 * Interface that must be implemented by plugin background scripts
 */
export interface PluginWorkerAPI {
    /**
     * Initialize the plugin worker
     * Called when the plugin is first loaded
     * 
     * @returns A promise that resolves when initialization is complete
     */
    initialize(): Promise<void>;

    /**
     * Prepare for termination and clean up resources
     * Called before the worker is terminated by the system
     * 
     * @returns A promise that resolves when cleanup is complete
     */
    terminate(): Promise<void>;

    /**
     * Get the current status of the plugin
     * 
     * @returns A promise that resolves with the plugin's status
     */
    getStatus(): Promise<PluginStatus>;

    /**
     * Handle a message from the system
     * Optional method for plugins that want to receive messages
     * 
     * @param type Message type
     * @param payload Message data
     * @returns A promise that resolves when the message has been processed
     */
    handleMessage?<T>(type: string, payload: T): Promise<void>;
}

/**
 * Plugin status information
 */
export interface PluginStatus {
    /**
     * Whether the plugin is currently active
     */
    isActive: boolean;

    /**
     * Version string of the plugin
     */
    version: string;

    /**
     * List of features provided by the plugin
     */
    features?: string[];

    /**
     * Last error message, if any
     */
    lastError?: string;

    /**
     * Resource usage metrics
     */
    resourceUsage?: {
        /**
         * Memory usage in bytes
         */
        memory?: number;

        /**
         * CPU usage percentage
         */
        cpu?: number;
    };

    /**
     * Additional custom status properties
     */
    [key: string]: unknown;
}

/**
 * Plugin configuration structure
 */
export interface PluginConfig {
    /**
     * Unique identifier for the plugin
     */
    id: string;

    /**
     * Human-readable name of the plugin
     */
    name: string;

    /**
     * Version string following semantic versioning
     */
    version: string;

    /**
     * Optional description of the plugin
     */
    description?: string;

    /**
     * Optional URL or path to the plugin's icon
     */
    icon?: string;

    /**
     * Optional author information
     */
    author?: string;

    /**
     * Whether this is an internal system plugin
     */
    internalPlugin: boolean;

    /**
     * UI component definitions
     */
    view?: {
        /**
         * Summary view (compact display)
         */
        summary?: {
            /**
             * Path to the entry point for the summary view
             */
            entryPoint: string;
        };

        /**
         * Expanded view (full display)
         */
        expand?: {
            /**
             * Path to the entry point for the expanded view
             */
            entryPoint: string;
        };
    };

    /**
     * Background process definition
     */
    background?: {
        /**
         * Path to the entry point for the background worker
         */
        entryPoint: string;
    };

    /**
     * Permissions requested by the plugin
     */
    permissions?: PermissionObject;

    /**
     * Plugin assets
     */
    assets?: {
        /**
         * JavaScript bundles
         */
        bundles?: string[];

        /**
         * Image assets
         */
        images?: string[];

        /**
         * Other asset files
         */
        other?: string[];
    };

    /**
     * Plugin settings
     */
    settings?: PluginSettings;

    /**
     * Categories for plugin search and organization
     */
    categories?: string[];

    /**
     * Tags for plugin search and filtering
     */
    tags?: string[];

    /**
     * Popularity score for sorting in search results
     */
    popularity?: number;

    /**
     * Date the plugin was last updated
     */
    lastUpdated?: string;

    /**
     * Date the plugin was created
     */
    created?: string;
}

/**
 * Plugin settings that can be configured by users
 */
export interface PluginSettings {
    /**
     * Whether the plugin is enabled
     */
    enabled?: boolean;

    /**
     * Whether to start the plugin automatically on system startup
     */
    autoStart?: boolean;

    /**
     * Display mode for the plugin UI
     */
    displayMode?: 'hidden' | 'minimal' | 'full';

    /**
     * Custom plugin-specific options
     */
    customOptions?: Record<string, unknown>;

    /**
     * Additional plugin settings
     */
    [key: string]: unknown;
}

/**
 * ===========================
 * Permission System
 * ===========================
 */

/**
 * Network subpermission types
 */
export type NetworkSubPermissionType = 'http' | 'websocket' | 'socketio';

/**
 * Storage subpermission types
 */
export type StorageSubPermissionType = 'read' | 'write';

/**
 * Network permissions
 */
export interface NetworkPermission {
    /**
     * Permission to make HTTP requests
     */
    http?: boolean;

    /**
     * Permission to establish WebSocket connections
     */
    websocket?: boolean;

    /**
     * Permission to use Socket.IO (requires websocket permission)
     */
    socketio?: boolean;
}

/**
 * Storage permissions
 */
export interface StoragePermission {
    /**
     * Permission to read from storage
     */
    read?: boolean;

    /**
     * Permission to write to storage
     */
    write?: boolean;
}

/**
 * Complete permission object
 */
export interface PermissionObject {
    /**
     * Network communication permissions
     */
    network?: NetworkPermission;

    /**
     * Data storage permissions
     */
    storage?: StoragePermission;

    /**
     * DOM manipulation permission
     */
    dom?: boolean;

    /**
     * File system access permission
     */
    file?: boolean;

    /**
     * System-level operations permission
     */
    system?: boolean;
}

/**
 * ===========================
 * Messaging System
 * ===========================
 */

/**
 * Message target types within a plugin
 */
export enum MessageTarget {
    /**
     * Background script
     */
    BACKGROUND = 'background',

    /**
     * Summary view
     */
    SUMMARY = 'summary',

    /**
     * Expand view
     */
    EXPAND = 'expand',

    /**
     * All views (summary and expand)
     */
    ALL_VIEWS = 'all-views',
}

/**
 * Plugin message interface for inter-component communication
 */
export interface PluginMessage<T> {
    /**
     * Message ID
     */
    id: string;

    /**
     * Plugin ID (the plugin this message belongs to)
     */
    pluginId: PluginId;

    /**
     * Source component that sent the message (background, summary, expand, or view ID)
     */
    source: string;

    /**
     * Target component (background, summary, expand, all-views, or view ID)
     */
    target: string;

    /**
     * Message topic/channel
     */
    topic: string;

    /**
     * Message data payload
     */
    payload: T;

    /**
     * Timestamp when the message was created
     */
    timestamp: number;
}

/**
 * ===========================
 * Storage System
 * ===========================
 */

/**
 * Storage options
 */
export interface StorageOptions {
    /**
     * Namespace for the storage
     */
    namespace: string;

    /**
     * Storage type (e.g., 'localStorage', 'indexedDB')
     */
    type: string;

    /**
     * Additional storage options
     */
    [key: string]: unknown;
}

/**
 * Storage provider interface
 */
export interface StorageProvider {
    /**
     * Get a value from storage
     * @param key The key to retrieve
     * @param defaultValue Optional default value if key doesn't exist
     */
    get<T>(key: string, defaultValue?: T): Promise<T | undefined>;

    /**
     * Set a value in storage
     * @param key The key to set
     * @param value The value to store
     */
    set<T>(key: string, value: T): Promise<void>;

    /**
     * Check if a key exists in storage
     * @param key The key to check
     */
    has(key: string): Promise<boolean>;

    /**
     * Delete a key from storage
     * @param key The key to delete
     */
    delete(key: string): Promise<void>;

    /**
     * Clear all values in this namespace
     */
    clear(): Promise<void>;

    /**
     * Get all keys in this namespace
     */
    keys(): Promise<string[]>;

    /**
     * Get all values in this namespace
     */
    values<T>(): Promise<T[]>;

    /**
     * Get all entries in this namespace
     */
    entries<T>(): Promise<Array<[string, T]>>;
}

/**
 * ===========================
 * Events System
 * ===========================
 */

/**
 * Base event interface for all plugin events
 */
export interface PluginEvent {
    /**
     * ID of the plugin this event relates to
     */
    pluginId: PluginId;

    /**
     * Timestamp when the event occurred
     */
    timestamp: number;
}

/**
 * Worker lifecycle events
 */
export interface PluginWorkerStartedEvent extends PluginEvent {
    /**
     * Plugin configuration
     */
    config: PluginConfig;
}

export interface PluginWorkerStoppedEvent extends PluginEvent {
    /**
     * Reason for worker stopping
     */
    reason?: 'user' | 'system' | 'error';
}

export interface PluginWorkerErrorEvent extends PluginEvent {
    /**
     * Error message
     */
    error: string;

    /**
     * Whether the error is fatal
     */
    fatal?: boolean;
}

/**
 * Plugin communication events
 */
export interface PluginMessageEvent extends PluginEvent {
    /**
     * Message type
     */
    type: string;

    /**
     * Message payload
     */
    payload: unknown;
}

/**
 * Plugin registration events
 */
export interface PluginRegisteredEvent extends PluginEvent {
    /**
     * Plugin configuration
     */
    config: PluginConfig;
}

export interface PluginUnregisteredEvent extends PluginEvent {
    /**
     * Reason for unregistration
     */
    reason?: string;
}

/**
 * Plugin UI events
 */
export interface PluginUiDisplayEvent extends PluginEvent {
    /**
     * Plugin configuration
     */
    config: PluginConfig;

    /**
     * Type of view being displayed
     */
    viewType: 'summary' | 'expand';

    /**
     * Path to the UI component
     */
    uiPath: string;
}

/**
 * ===========================
 * Plugin Global API
 * ===========================
 */

/**
 * Global object containing plugin APIs
 */
export interface PluginGlobalApi {
    /**
     * Plugin information
     */
    plugin: {
        /**
         * Unique identifier of the plugin
         */
        id: string;

        /**
         * Human-readable name of the plugin
         */
        name: string;
    };

    /**
     * Storage APIs
     */
    storage?: {
        /**
         * Default storage for this plugin
         */
        default: StorageProvider;

        /**
         * Create custom storage (permissions are determined by system)
         * @param options Storage options
         */
        create: (options: StorageOptions) => StorageProvider;
    };

    /**
     * Network APIs (available only with appropriate permissions)
     */
    network?: {
        /**
         * HTTP API (available with 'http' permission)
         */
        http?: {
            /**
             * Create an HTTP client instance
             * @param namespace Instance identifier
             * @param config Configuration options
             */
            createInstance: (namespace: string, config?: Record<string, unknown>) => unknown;
        };

        /**
         * WebSocket API (available with 'websocket' permission)
         */
        websocket?: {
            /**
             * Create a WebSocket connection
             * @param namespace Instance identifier
             */
            createConnection: (namespace: string) => unknown;
        };

        /**
         * Socket.IO API (available with 'websocket' permission)
         */
        socketio?: {
            /**
             * Create a Socket.IO connection
             * @param namespace Instance identifier
             * @param options Connection options
             */
            createConnection: (namespace: string, options?: Record<string, unknown>) => unknown;
        };
    };

    /**
     * Additional APIs for future extensions
     */
    [key: string]: unknown;
}

/**
 * ===========================
 * Error Types
 * ===========================
 */

/**
 * Base error class for plugin-related errors
 */
export class PluginError extends Error {
    /**
     * ID of the plugin that caused the error
     */
    pluginId?: PluginId;

    /**
     * Creates a new PluginError
     * @param message Error message
     * @param pluginId Optional ID of the plugin that caused the error
     */
    constructor(message: string, pluginId?: PluginId) {
        super(message);
        this.name = 'PluginError';
        this.pluginId = pluginId;
    }
}

/**
 * Error thrown when a plugin fails to load
 */
export class PluginLoadError extends PluginError {
    constructor(message: string, pluginId?: PluginId) {
        super(message, pluginId);
        this.name = 'PluginLoadError';
    }
}

/**
 * Error thrown when a plugin encounters an error during execution
 */
export class PluginExecutionError extends PluginError {
    constructor(message: string, pluginId?: PluginId) {
        super(message, pluginId);
        this.name = 'PluginExecutionError';
    }
}

/**
 * Error thrown when a plugin attempts an operation without the required permissions
 */
export class PluginPermissionError extends PluginError {
    constructor(operation: string, pluginId?: PluginId) {
        super(`Permission denied: Operation "${operation}" requires appropriate permissions`, pluginId);
        this.name = 'PluginPermissionError';
    }
}