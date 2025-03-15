import {
    SerializablePluginApi,
    InternalPluginApiRefs,
    PluginUIApi,
    PluginStorageApi,
    PluginNetworkApi,
    PluginMessageBusApi,
    PluginFileApi
} from './types.pluginApi';
import { PermissionObject, PluginConfig } from './types';
import { MessageTarget } from './types.message';
import { PluginPermissionError } from './types.error';
import storageApi from '../../api/storage';
import { networkApi, ProviderType } from '../../api/network';
import pluginMessageBus from './pluginMessageBus';
import { useTabStore } from '../../features/required/tab_view/store';
import fileSystemApi from '../../api/files';
import { pluginApiLogger } from './utils/logger';

/**
 * Class that implements the SerializablePluginApi interface
 * to provide a Comlink-friendly API for plugins
 */
export class PluginApiService implements SerializablePluginApi {
    private refs: InternalPluginApiRefs;
    private readonly pluginSourceType: MessageTarget;
    private readonly pluginConfig: PluginConfig;
    private readonly BASE_NAMESPACE: string;

    // Plugin identity - exposed as methods instead of properties to prevent modification
    plugin: {
        getId: () => string;
        getName: () => string;
    };

    // Other APIs as function-based interfaces
    state: SerializablePluginApi['state'];
    ui: PluginUIApi;
    storage: PluginStorageApi;
    network?: PluginNetworkApi;
    messageBus: PluginMessageBusApi;
    file: PluginFileApi;

    constructor(
        pluginConfig: PluginConfig,
        environmentId: number,
        initialState: Record<string, unknown> = {},
        sourceType: MessageTarget = MessageTarget.BACKGROUND
    ) {
        pluginApiLogger('Creating API service for plugin %s in environment %d', pluginConfig.id, environmentId);
        this.pluginConfig = JSON.parse(JSON.stringify(pluginConfig)) as PluginConfig;
        this.BASE_NAMESPACE = `plugin-${pluginConfig.id}`;

        // Create deep copies of all input objects to prevent external modification
        const permissionsCopy = JSON.parse(JSON.stringify(pluginConfig.permissions)) as PermissionObject;
        const initialStateCopy = JSON.parse(JSON.stringify(initialState)) as Record<string, unknown>;

        // Set up internal references
        this.refs = {
            pluginId: pluginConfig.id,
            pluginName: pluginConfig.name,
            permissions: permissionsCopy,
            storageNamespaces: new Map(),
            httpNamespaces: new Map(),
            websocketConnections: new Map(),
            state: initialStateCopy,
            environmentId
        };

        // Store the source type for message bus
        this.pluginSourceType = sourceType;

        // Plugin info - exposed as methods to prevent modification
        this.plugin = {
            getId: () => this.refs.pluginId,
            getName: () => this.refs.pluginName
        };

        // Initialize APIs
        pluginApiLogger('Initializing API modules for plugin %s', pluginConfig.id);
        this.state = this.createStateApi();
        this.ui = this.createUIApi();
        this.storage = this.createStorageApi();
        this.file = this.createFileApi();
        this.messageBus = this.createMessageBusApi();

        // Initialize network API if permissions exist
        if (pluginConfig.permissions?.network) {
            pluginApiLogger('Plugin %s has network permissions, initializing network API', pluginConfig.id);
            this.network = this.createNetworkApi();
        }
        
        pluginApiLogger('API service for plugin %s initialized successfully', pluginConfig.id);
    }

    /**
     * Validate permission
     */
    private validatePermission(permission: string, subPermission?: string): void {
        const permissions = this.refs.permissions;

        if (!permissions) {
            pluginApiLogger('Permission validation failed for plugin %s: No permissions object', this.refs.pluginId);
            throw new PluginPermissionError(permission);
        }

        if (permission === 'storage' && subPermission) {
            if (!permissions.storage || !permissions.storage[subPermission as keyof typeof permissions.storage]) {
                pluginApiLogger('Storage permission validation failed for plugin %s: %s', 
                               this.refs.pluginId, subPermission);
                throw new PluginPermissionError(`storage:${subPermission}`);
            }
        } else if (permission === 'network' && subPermission) {
            if (!permissions.network || !permissions.network[subPermission as keyof typeof permissions.network]) {
                pluginApiLogger('Network permission validation failed for plugin %s: %s', 
                               this.refs.pluginId, subPermission);
                throw new PluginPermissionError(`network:${subPermission}`);
            }
        } else if (!permissions[permission as keyof typeof permissions]) {
            pluginApiLogger('Permission validation failed for plugin %s: %s', 
                           this.refs.pluginId, permission);
            throw new PluginPermissionError(permission);
        }
    }

    /**
     * Create the state management API
     */
    private createStateApi(): SerializablePluginApi['state'] {
        pluginApiLogger('Creating state API for plugin %s', this.refs.pluginId);
        return {
            get: async () => {
                // Return a copy to prevent direct modification of internal state
                return JSON.parse(JSON.stringify(this.refs.state));
            },

            update: async (updates: Record<string, unknown>) => {
                try {
                    // Validate updates
                    if (!updates || typeof updates !== 'object') {
                        pluginApiLogger('Invalid state updates for plugin %s', this.refs.pluginId);
                        return false;
                    }

                    pluginApiLogger('Updating state for plugin %s', this.refs.pluginId);
                    // Merge updates into state
                    this.refs.state = {
                        ...this.refs.state,
                        ...JSON.parse(JSON.stringify(updates)) // Deep copy to prevent reference sharing
                    };
                    return true;
                } catch (error) {
                    pluginApiLogger('Error updating state for plugin %s: %o', this.refs.pluginId, error);
                    return false;
                }
            },

            reset: async () => {
                try {
                    pluginApiLogger('Resetting state for plugin %s', this.refs.pluginId);
                    this.refs.state = {};
                    return true;
                } catch (error) {
                    pluginApiLogger('Error resetting state for plugin %s: %o', this.refs.pluginId, error);
                    return false;
                }
            }
        };
    }

    /**
     * Create the UI API for tabs and other UI controls
     */
    private createUIApi(): PluginUIApi {
        pluginApiLogger('Creating UI API for plugin %s', this.refs.pluginId);
        return {
            tabs: {
                openTab: async (pluginId: string, state: Record<string, unknown> = {}) => {
                    try {
                        // Ensure the plugin can only open tabs for itself
                        if (pluginId !== this.refs.pluginId) {
                            pluginApiLogger('Plugin %s attempted to open a tab for %s. This is not allowed.', 
                                           this.refs.pluginId, pluginId);
                            return '';
                        }

                        pluginApiLogger('Opening tab for plugin %s', pluginId);
                        const store = useTabStore.getState();

                        // Create a copy of state to prevent reference issues
                        const stateCopy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;

                        const tabId = store.addTab(this.refs.environmentId, this.pluginConfig, stateCopy);
                        pluginApiLogger('Tab opened for plugin %s: %s', pluginId, tabId);
                        return tabId;
                    } catch (error) {
                        pluginApiLogger('Error opening tab for plugin %s: %o', this.refs.pluginId, error);
                        return '';
                    }
                },

                closeTab: async (tabId: string) => {
                    try {
                        pluginApiLogger('Closing tab %s for plugin %s', tabId, this.refs.pluginId);
                        // Verify this plugin owns the tab
                        const store = useTabStore.getState();
                        const tabViews = store.tabViews;
                        const tabView = tabViews[this.refs.environmentId];

                        if (!tabView) return false;

                        const tab = tabView.tabs.find(t => t.id === tabId);
                        if (!tab || tab.pluginId !== this.refs.pluginId) {
                            pluginApiLogger('Plugin %s attempted to close tab %s that it doesn\'t own', 
                                           this.refs.pluginId, tabId);
                            return false;
                        }

                        store.closeTab(this.refs.environmentId, tabId);
                        pluginApiLogger('Tab %s closed for plugin %s', tabId, this.refs.pluginId);
                        return true;
                    } catch (error) {
                        pluginApiLogger('Error closing tab %s for plugin %s: %o', 
                                       tabId, this.refs.pluginId, error);
                        return false;
                    }
                },

                updateTabState: async (tabId: string, state: Record<string, unknown>) => {
                    try {
                        // Verify this plugin owns the tab
                        const store = useTabStore.getState();
                        const tabViews = store.tabViews;
                        const tabView = tabViews[this.refs.environmentId];

                        if (!tabView) return false;

                        const tab = tabView.tabs.find(t => t.id === tabId);
                        if (!tab || tab.pluginId !== this.refs.pluginId) {
                            pluginApiLogger('Plugin %s attempted to update tab %s that it doesn\'t own', 
                                          this.refs.pluginId, tabId);
                            return false;
                        }

                        // Create a deep copy of state
                        const stateCopy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;

                        store.updateTabState(this.refs.environmentId, tabId, stateCopy);
                        pluginApiLogger('Updated state for tab %s for plugin %s', tabId, this.refs.pluginId);
                        return true;
                    } catch (error) {
                        pluginApiLogger('Error updating tab state for %s in plugin %s: %o', 
                                      tabId, this.refs.pluginId, error);
                        return false;
                    }
                },

                getTabState: async (tabId: string) => {
                    try {
                        const store = useTabStore.getState();
                        const tabViews = store.tabViews;
                        const tabView = tabViews[this.refs.environmentId];

                        if (!tabView) return null;

                        const tab = tabView.tabs.find(t => t.id === tabId);
                        if (!tab || tab.pluginId !== this.refs.pluginId) {
                            pluginApiLogger('Plugin %s attempted to get state for tab %s that it doesn\'t own', 
                                          this.refs.pluginId, tabId);
                            return null;
                        }

                        // Return a copy of the state to prevent reference issues
                        return tab.state ? JSON.parse(JSON.stringify(tab.state)) : {};
                    } catch (error) {
                        pluginApiLogger('Error getting tab state for %s in plugin %s: %o', 
                                      tabId, this.refs.pluginId, error);
                        return null;
                    }
                },

                getCurrentTabId: async () => {
                    try {
                        const store = useTabStore.getState();
                        const activeTabId = store.activeTabId;

                        if (!activeTabId) return null;

                        const tabViews = store.tabViews;
                        const tabView = tabViews[this.refs.environmentId];

                        if (!tabView) return null;

                        const tab = tabView.tabs.find(t => t.id === activeTabId);
                        if (!tab || tab.pluginId !== this.refs.pluginId) return null;

                        return tab.id;
                    } catch (error) {
                        pluginApiLogger('Error getting current tab ID for plugin %s: %o', 
                                      this.refs.pluginId, error);
                        return null;
                    }
                }
            },

            modals: {
                confirm: async (message: string, title?: string) => {
                    pluginApiLogger('Plugin %s showing confirmation dialog', this.refs.pluginId);
                    return window.confirm(title ? `${title}\n\n${message}` : message);
                },

                alert: async (message: string, title?: string) => {
                    pluginApiLogger('Plugin %s showing alert dialog', this.refs.pluginId);
                    window.alert(title ? `${title}\n\n${message}` : message);
                }
            },

            notifications: {
                show: async (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
                    pluginApiLogger('Plugin %s showing notification: %s (%s)', 
                                   this.refs.pluginId, message, type);
                    // In a real implementation, we would show an actual notification UI
                }
            }
        };
    }

    /**
     * Create the storage API with proxy methods
     */
    private createStorageApi(): PluginStorageApi {
        pluginApiLogger('Creating storage API for plugin %s', this.refs.pluginId);
        // Create a base storage provider with the plugin namespace
        const defaultStorage = storageApi.getStorage({ namespace: this.BASE_NAMESPACE });

        return {
            get: async <T>(key: string, defaultValue?: T) => {
                try {
                    this.validatePermission('storage', 'read');
                    return await defaultStorage.get<T>(key, defaultValue);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage get error for plugin %s: %o', this.refs.pluginId, error);
                    return defaultValue as T;
                }
            },

            set: async <T>(key: string, value: T) => {
                try {
                    this.validatePermission('storage', 'write');
                    pluginApiLogger('Storing data for key %s in plugin %s', key, this.refs.pluginId);
                    // Ensure value is serializable
                    const serializedValue = JSON.parse(JSON.stringify(value));
                    await defaultStorage.set(key, serializedValue);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage set error for plugin %s: %o', this.refs.pluginId, error);
                }
            },

            has: async (key: string) => {
                try {
                    this.validatePermission('storage', 'read');
                    return await defaultStorage.has(key);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage has error for plugin %s: %o', this.refs.pluginId, error);
                    return false;
                }
            },

            delete: async (key: string) => {
                try {
                    this.validatePermission('storage', 'write');
                    pluginApiLogger('Deleting key %s for plugin %s', key, this.refs.pluginId);
                    await defaultStorage.delete(key);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage delete error for plugin %s: %o', this.refs.pluginId, error);
                }
            },

            clear: async () => {
                try {
                    this.validatePermission('storage', 'write');
                    pluginApiLogger('Clearing all storage for plugin %s', this.refs.pluginId);
                    await defaultStorage.clear();
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage clear error for plugin %s: %o', this.refs.pluginId, error);
                }
            },

            keys: async () => {
                try {
                    this.validatePermission('storage', 'read');
                    return await defaultStorage.keys();
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage keys error for plugin %s: %o', this.refs.pluginId, error);
                    return [];
                }
            },

            values: async <T>() => {
                try {
                    this.validatePermission('storage', 'read');
                    return await defaultStorage.values<T>();
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage values error for plugin %s: %o', this.refs.pluginId, error);
                    return [];
                }
            },

            entries: async <T>() => {
                try {
                    this.validatePermission('storage', 'read');
                    return await defaultStorage.entries<T>();
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('Storage entries error for plugin %s: %o', this.refs.pluginId, error);
                    return [];
                }
            }
        };
    }

    /**
     * Create the file API
     */
    private createFileApi(): PluginFileApi {
        pluginApiLogger('Creating file API for plugin %s', this.refs.pluginId);
        return {
            storeFile: async (file: File) => {
                try {
                    this.validatePermission('file');
                    pluginApiLogger('Storing file "%s" (%s, %d bytes) for plugin %s', 
                                  file.name, file.type, file.size, this.refs.pluginId);
                    return await fileSystemApi.storeFile(file);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File store error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error('Failed to store file');
                }
            },

            storeFileContent: async (name: string, content: ArrayBuffer, type: string) => {
                try {
                    this.validatePermission('file');
                    pluginApiLogger('Storing file content "%s" (%s, %d bytes) for plugin %s', 
                                  name, type, content.byteLength, this.refs.pluginId);
                    return await fileSystemApi.storeFileContent(name, content, type);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File store content error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error('Failed to store file content');
                }
            },

            readFile: async (fileId: string) => {
                try {
                    this.validatePermission('file');
                    pluginApiLogger('Reading file %s for plugin %s', fileId, this.refs.pluginId);
                    return await fileSystemApi.readFile(fileId);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File read error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error(`Failed to read file with ID ${fileId}`);
                }
            },

            readFileAsText: async (fileId: string, options) => {
                try {
                    this.validatePermission('file');
                    return await fileSystemApi.readFileAsText(fileId, options);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File read as text error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error(`Failed to read file as text with ID ${fileId}`);
                }
            },

            deleteFile: async (fileId: string) => {
                try {
                    this.validatePermission('file');
                    pluginApiLogger('Deleting file %s for plugin %s', fileId, this.refs.pluginId);
                    await fileSystemApi.deleteFile(fileId);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File delete error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error(`Failed to delete file with ID ${fileId}`);
                }
            },

            listFiles: async () => {
                try {
                    this.validatePermission('file');
                    return await fileSystemApi.listFiles();
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File list error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error('Failed to list files');
                }
            },

            importFiles: async (acceptedTypes, multiple) => {
                try {
                    this.validatePermission('file');
                    pluginApiLogger('Importing files for plugin %s', this.refs.pluginId);
                    return await fileSystemApi.importFiles(acceptedTypes, multiple);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File import error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error('Failed to import files');
                }
            },

            downloadFile: async (fileId: string) => {
                try {
                    this.validatePermission('file');
                    pluginApiLogger('Downloading file %s for plugin %s', fileId, this.refs.pluginId);
                    await fileSystemApi.downloadFile(fileId);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File download error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error(`Failed to download file with ID ${fileId}`);
                }
            },

            exportAsDataURL: async (fileId: string) => {
                try {
                    this.validatePermission('file');
                    return await fileSystemApi.exportAsDataURL(fileId);
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('File export as data URL error for plugin %s: %o', this.refs.pluginId, error);
                    throw new Error(`Failed to export file with ID ${fileId} as data URL`);
                }
            }
        };
    }

    /**
     * Create the network API with proxy methods
     */
    private createNetworkApi(): PluginNetworkApi {
        pluginApiLogger('Creating network API for plugin %s', this.refs.pluginId);
        // Create a base Axios instance with the plugin namespace
        const axiosInstance = networkApi.createAxiosInstance({
            type: ProviderType.HTTP,
            namespace: this.BASE_NAMESPACE
        });

        const httpApi: PluginNetworkApi['http'] = {
            get: async <T>(url: string, config: Record<string, unknown> = {}) => {
                try {
                    this.validatePermission('network', 'http');
                    pluginApiLogger('Plugin %s making HTTP GET request to %s', this.refs.pluginId, url);
                    const response = await axiosInstance.get<T>(url, config);
                    return response.data;
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('HTTP GET error for plugin %s: %o', this.refs.pluginId, error);
                    throw error;
                }
            },

            post: async <T>(url: string, data?: unknown, config: Record<string, unknown> = {}) => {
                try {
                    this.validatePermission('network', 'http');
                    pluginApiLogger('Plugin %s making HTTP POST request to %s', this.refs.pluginId, url);
                    // Ensure data is serializable
                    const serializedData = data ? JSON.parse(JSON.stringify(data)) : undefined;
                    const response = await axiosInstance.post<T>(url, serializedData, config);
                    return response.data;
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('HTTP POST error for plugin %s: %o', this.refs.pluginId, error);
                    throw error;
                }
            },

            put: async <T>(url: string, data?: unknown, config: Record<string, unknown> = {}) => {
                try {
                    this.validatePermission('network', 'http');
                    pluginApiLogger('Plugin %s making HTTP PUT request to %s', this.refs.pluginId, url);
                    // Ensure data is serializable
                    const serializedData = data ? JSON.parse(JSON.stringify(data)) : undefined;
                    const response = await axiosInstance.put<T>(url, serializedData, config);
                    return response.data;
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('HTTP PUT error for plugin %s: %o', this.refs.pluginId, error);
                    throw error;
                }
            },

            delete: async <T>(url: string, config: Record<string, unknown> = {}) => {
                try {
                    this.validatePermission('network', 'http');
                    pluginApiLogger('Plugin %s making HTTP DELETE request to %s', this.refs.pluginId, url);
                    const response = await axiosInstance.delete<T>(url, config);
                    return response.data;
                } catch (error) {
                    if (error instanceof PluginPermissionError) {
                        throw error;
                    }
                    pluginApiLogger('HTTP DELETE error for plugin %s: %o', this.refs.pluginId, error);
                    throw error;
                }
            }
        };

        const api: PluginNetworkApi = {
            http: httpApi
        };

        // Add WebSocket API if permission granted
        if (this.refs.permissions.network?.websocket) {
            pluginApiLogger('Adding WebSocket API for plugin %s', this.refs.pluginId);
            api.websocket = {
                connect: async (url: string, namespace = 'default') => {
                    try {
                        this.validatePermission('network', 'websocket');
                        const connectionId = `${namespace}-${Date.now()}`;
                        pluginApiLogger('Plugin %s connecting to WebSocket: %s (connection ID: %s)', 
                                      this.refs.pluginId, url, connectionId);
                        
                        const ws = networkApi.createWebSocket({
                            type: ProviderType.WEBSOCKET,
                            namespace: `${this.BASE_NAMESPACE}-${connectionId}`
                        });

                        // Store the WebSocket connection
                        this.refs.websocketConnections.set(connectionId, ws);

                        return connectionId;
                    } catch (error) {
                        if (error instanceof PluginPermissionError) {
                            throw error;
                        }
                        pluginApiLogger('WebSocket connect error for plugin %s: %o', this.refs.pluginId, error);
                        return '';
                    }
                },

                send: async (connectionId: string, data: string | ArrayBuffer) => {
                    try {
                        this.validatePermission('network', 'websocket');
                        const ws = this.refs.websocketConnections.get(connectionId);
                        if (!ws) {
                            pluginApiLogger('WebSocket connection %s not found for plugin %s', 
                                          connectionId, this.refs.pluginId);
                            throw new Error(`WebSocket connection ${connectionId} not found`);
                        }

                        pluginApiLogger('Plugin %s sending data via WebSocket %s', 
                                      this.refs.pluginId, connectionId);
                        ws.send(data);
                    } catch (error) {
                        if (error instanceof PluginPermissionError) {
                            throw error;
                        }
                        pluginApiLogger('WebSocket send error for plugin %s: %o', this.refs.pluginId, error);
                    }
                },

                close: async (connectionId: string) => {
                    try {
                        this.validatePermission('network', 'websocket');
                        const ws = this.refs.websocketConnections.get(connectionId);
                        if (!ws) {
                            pluginApiLogger('WebSocket connection %s not found for plugin %s', 
                                          connectionId, this.refs.pluginId);
                            throw new Error(`WebSocket connection ${connectionId} not found`);
                        }

                        pluginApiLogger('Plugin %s closing WebSocket connection %s', 
                                      this.refs.pluginId, connectionId);
                        ws.close();
                        this.refs.websocketConnections.delete(connectionId);
                    } catch (error) {
                        if (error instanceof PluginPermissionError) {
                            throw error;
                        }
                        pluginApiLogger('WebSocket close error for plugin %s: %o', this.refs.pluginId, error);
                    }
                },

                onMessage: async (connectionId: string, callback: (data: string | ArrayBuffer) => void) => {
                    try {
                        this.validatePermission('network', 'websocket');
                        const ws = this.refs.websocketConnections.get(connectionId);
                        if (!ws) {
                            pluginApiLogger('WebSocket connection %s not found for plugin %s',
                                connectionId, this.refs.pluginId);
                            throw new Error(`WebSocket connection ${connectionId} not found`);
                        }

                        pluginApiLogger('Plugin %s registering message handler for WebSocket %s',
                            this.refs.pluginId, connectionId);
                        ws.onmessage = (event) => {
                            callback(event.data);
                        };
                    } catch (error) {
                        if (error instanceof PluginPermissionError) {
                            throw error;
                        }
                    }
                }
            };
        }

        return api;
    }

    /**
     * Create the message bus API
     */
    private createMessageBusApi(): PluginMessageBusApi {
        pluginApiLogger('Creating message bus API for plugin %s', this.refs.pluginId);
        return {
            sendMessage: async <T>(target: string, topic: string, payload: T) => {
                try {
                    pluginApiLogger('Plugin %s sending message: topic=%s, target=%s', 
                                  this.refs.pluginId, topic, target);
                    
                    // Ensure payload is serializable
                    const serializedPayload = JSON.parse(JSON.stringify(payload));

                    // Use the appropriate source type (SUMMARY, EXPAND, etc.)
                    return await pluginMessageBus.sendMessage(
                        this.refs.pluginId,
                        this.pluginSourceType,
                        target,
                        topic,
                        serializedPayload
                    );
                } catch (error) {
                    pluginApiLogger('Send message error for plugin %s: %o', this.refs.pluginId, error);
                    return false;
                }
            }
        };
    }
}

/**
 * Create a serializable plugin API for use with Comlink
 * @param pluginConfig Plugin configuration
 * @param environmentId Current environment ID
 * @param initialState Initial state for the plugin
 * @param sourceType Message source type
 */
export function createPluginApi(
    pluginConfig: PluginConfig,
    environmentId: number,
    initialState: Record<string, unknown> = {},
    sourceType: MessageTarget
): SerializablePluginApi {
    pluginApiLogger('Creating plugin API for %s (env: %d)', pluginConfig.id, environmentId);
    return new PluginApiService(
        pluginConfig,
        environmentId,
        initialState,
        sourceType
    );
}

export default createPluginApi;