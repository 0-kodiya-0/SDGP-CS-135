import { FileEntry, FileMetadata, FileReadOptions } from "../../api/files";
import { PermissionObject, PluginId } from "./types";

/**
 * UI APIs available to plugins
 */
export interface PluginUIApi {
  // Tab management
  tabs: {
    // Open a new tab or focus existing one
    openTab: (pluginId: string, state?: Record<string, unknown>) => Promise<string>;

    // Close a tab
    closeTab: (tabId: string) => Promise<boolean>;

    // Update tab state
    updateTabState: (tabId: string, state: Record<string, unknown>) => Promise<boolean>;

    // Get current tab state (if this plugin owns the tab)
    getTabState: (tabId: string) => Promise<Record<string, unknown> | null>;

    // Get current tab ID (if this plugin owns the active tab)
    getCurrentTabId: () => Promise<string | null>;
  };

  // Modal/dialog functionality
  modals: {
    // Show a confirmation dialog
    confirm: (message: string, title?: string) => Promise<boolean>;

    // Show an alert dialog
    alert: (message: string, title?: string) => Promise<void>;
  };

  // Notifications
  notifications: {
    // Show a notification
    show: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<void>;
  };
}

/**
 * Network APIs available to plugins
 */
export interface PluginNetworkApi {
  // HTTP
  http: {
    // Perform a GET request
    get: <T>(url: string, config?: Record<string, unknown>) => Promise<T>;

    // Perform a POST request
    post: <T>(url: string, data?: unknown, config?: Record<string, unknown>) => Promise<T>;

    // Perform a PUT request
    put: <T>(url: string, data?: unknown, config?: Record<string, unknown>) => Promise<T>;

    // Perform a DELETE request
    delete: <T>(url: string, config?: Record<string, unknown>) => Promise<T>;
  };

  // WebSocket (if permission granted)
  websocket?: {
    // Create a WebSocket connection
    connect: (url: string, namespace?: string) => Promise<string>;

    // Send a message over the WebSocket
    send: (connectionId: string, data: string | ArrayBuffer) => Promise<void>;

    // Close a WebSocket connection
    close: (connectionId: string) => Promise<void>;

    // Listen for messages
    onMessage: (connectionId: string, callback: (data: string | ArrayBuffer) => void) => Promise<void>;
  };
}

/**
 * Plugin message bus interface
 */
export interface PluginMessageBusApi {
  // Send a message to another component
  sendMessage: <T>(target: string, topic: string, payload: T) => Promise<boolean>;
}

/**
 * File system APIs available to plugins
 */
export interface PluginFileApi {
  // Store a file in memory
  storeFile: (file: File) => Promise<FileMetadata>;

  // Store file content directly
  storeFileContent: (name: string, content: ArrayBuffer, type: string) => Promise<FileMetadata>;

  // Read a file by ID
  readFile: (fileId: string) => Promise<FileEntry>;

  // Read file content as text
  readFileAsText: (fileId: string, options?: FileReadOptions) => Promise<string>;

  // Delete a file by ID
  deleteFile: (fileId: string) => Promise<void>;

  // List all files in memory
  listFiles: () => Promise<FileMetadata[]>;

  // Import files from the user's file system
  importFiles: (acceptedTypes?: string[], multiple?: boolean) => Promise<FileMetadata[]>;

  // Download a file to the user's device
  downloadFile: (fileId: string) => Promise<void>;

  // Export a file as a data URL
  exportAsDataURL: (fileId: string) => Promise<string>;
}

/**
 * Storage APIs available to plugins
 */
export interface PluginStorageApi {
  // Default storage
  get: <T>(key: string, defaultValue?: T) => Promise<T | undefined>;
  set: <T>(key: string, value: T) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
  values: <T>() => Promise<T[]>;
  entries: <T>() => Promise<Array<[string, T]>>;
}

/**
 * Revised global API interface for plugins
 * This interface only contains serializable methods and properties
 */
export interface SerializablePluginApi {
  // Plugin information - exposed as methods to prevent modification
  plugin: {
    getId: () => string;
    getName: () => string;
  };

  // State management
  state: {
    // Get the current plugin state
    get: () => Promise<Record<string, unknown>>;

    // Update the plugin state
    update: (updates: Record<string, unknown>) => Promise<boolean>;

    // Reset the plugin state
    reset: () => Promise<boolean>;
  };

  // UI API
  ui: PluginUIApi;

  // Storage API
  storage: PluginStorageApi;

  // File system API
  file: PluginFileApi;

  // Network API (only available if permissions granted)
  network?: PluginNetworkApi;

  // Message bus API
  messageBus: PluginMessageBusApi;
}

/**
 * Internal API reference for implementation
 * This won't be directly exposed to plugins
 */
export interface InternalPluginApiRefs {
  pluginId: PluginId;
  pluginName: string;
  permissions: PermissionObject;

  // Storage references
  storageNamespaces: Map<string, unknown>;

  // Network references
  httpNamespaces: Map<string, unknown>;
  websocketConnections: Map<string, WebSocket>;

  // State management
  state: Record<string, unknown>;

  // Environment ID for UI operations
  environmentId: number;
}