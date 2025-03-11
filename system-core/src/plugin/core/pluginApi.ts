import * as Comlink from "comlink";
import wrappedStorageApi from "./wrappers/storage/wrappedStorageApi";
import { StorageOptions, StorageType } from "../../storage/types";
import { WrappedStorageProvider } from "./wrappers/storage/wrappedStorageProvider";
import { HttpApiWrapper } from "./wrappers/network/httpApiWrapper";
import { WebSocketApiWrapper } from "./wrappers/network/webSocketApiWrapper";
import { SocketIOApiWrapper } from "./wrappers/network/socketIOApiWrapper";
import { PermissionObject, PluginGlobalApi } from "./types";

/**
 * Configuration for creating a plugin API
 */
export interface PluginApiConfig {
    /**
     * Plugin unique identifier
     */
    pluginId: string;
    
    /**
     * Plugin human-readable name
     */
    pluginName: string;
    
    /**
     * Plugin permissions
     */
    permissions: PermissionObject;
}

/**
 * Factory class to create plugin global API objects
 */
export class PluginApiFactory {
    /**
     * Create a global API object for a plugin
     * 
     * @param config Plugin configuration
     * @returns A global API object to be injected into the plugin's environment
     */
    createPluginApi(config: PluginApiConfig): PluginGlobalApi {
        // Create the global API object
        const globalApi: PluginGlobalApi = {
            plugin: {
                id: config.pluginId,
                name: config.pluginName
            },

            storage: {
                // Create default storage for this plugin
                default: this.createDefaultStorage(config),

                // Method to create custom storage (only accepts storage options, permissions are determined by system)
                create: (options: StorageOptions) => {
                    return this.createCustomStorage(config, options);
                }
            }
        };

        // Add network API if permissions exist
        if (config.permissions.network) {
            globalApi.network = {};

            // Add HTTP API if permission exists
            if (config.permissions.network.http) {
                globalApi.network.http = new HttpApiWrapper(config.permissions.network);
            }

            // Add WebSocket API if permission exists
            if (config.permissions.network.websocket) {
                globalApi.network.websocket = new WebSocketApiWrapper(config.permissions.network);

                // Add Socket.IO API if WebSocket permission exists
                // (Socket.IO depends on WebSocket permission)
                globalApi.network.socketio = new SocketIOApiWrapper(config.permissions.network);
            }
        }

        return globalApi;
    }

    /**
     * Create the default storage for a plugin
     * 
     * @param config Plugin configuration
     * @returns A wrapped storage provider
     * @private
     */
    private createDefaultStorage(config: PluginApiConfig): WrappedStorageProvider {
        // Default storage uses LocalForage provider with the plugin's namespace
        const storageOptions: StorageOptions = {
            namespace: `plugin-${config.pluginId}`,
            type: StorageType.LOCALFORAGE
        };

        // Get storage permissions from config
        const canRead = !!config.permissions.storage?.read;
        const canWrite = !!config.permissions.storage?.write;

        // Use the comlink-compatible storage API
        return wrappedStorageApi.createStorage(
            storageOptions,
            { canRead, canWrite }
        );
    }

    /**
     * Create a custom storage with specific options
     * 
     * @param config Plugin configuration
     * @param options Storage options
     * @returns A wrapped storage provider with plugin's permissions
     * @private
     */
    private createCustomStorage(
        config: PluginApiConfig,
        options: StorageOptions
    ): WrappedStorageProvider {
        // Use plugin's permissions directly - no ability for plugin to specify custom permissions
        const canRead = !!config.permissions.storage?.read;
        const canWrite = !!config.permissions.storage?.write;

        // Use the comlink-compatible storage API
        return wrappedStorageApi.createStorage(
            options,
            { canRead, canWrite }
        );
    }
}

/**
 * Factory function to create a plugin API for injection into a web worker
 * 
 * @param pluginId The plugin's unique identifier
 * @param pluginName The plugin's human-readable name
 * @param permissions The plugin's permission object from the permission manager
 * @returns A global API object to be injected into the plugin's web worker
 */
export function createPluginWorkerApi(
    pluginId: string,
    pluginName: string,
    permissions: PermissionObject
): PluginGlobalApi {
    // Create configuration object
    const config: PluginApiConfig = {
        pluginId,
        pluginName,
        permissions: {
            storage: permissions.storage,
            network: permissions.network,
            dom: permissions.dom,
            file: permissions.file,
            system: permissions.system
        }
    };

    // Create and return the API
    const factory = new PluginApiFactory();
    return factory.createPluginApi(config);
}

// /**
//  * Expose the plugin worker API with comlink
//  * @param pluginId Plugin ID
//  * @param pluginName Plugin name
//  * @param permissions Permissions object
//  */
// export function exposePluginWorkerApi(
//     pluginId: string,
//     pluginName: string,
//     permissions: PermissionObject
// ): void {
//     const api = createPluginWorkerApi(pluginId, pluginName, permissions);
//     Comlink.expose(api);
// }