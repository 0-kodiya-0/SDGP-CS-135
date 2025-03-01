import { PermissionObject } from "../../permissions/types";
import storageApi from "../../storage";
import { StorageOptions, StorageType } from "../../storage/types";
import { PluginApiConfig, PluginGlobalApi } from "./types";
import { WrappedStorageProvider } from "./wrappers/storage";

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

        // Create storage provider with plugin's storage permissions
        const provider = storageApi.getStorage(storageOptions);

        // Get storage permissions from config
        const canRead = !!config.permissions.storage?.read;
        const canWrite = !!config.permissions.storage?.write;

        return new WrappedStorageProvider(provider, canRead, canWrite);
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
        // Create the storage provider
        const provider = storageApi.getStorage(options);

        // Use plugin's permissions directly - no ability for plugin to specify custom permissions
        const canRead = !!config.permissions.storage?.read;
        const canWrite = !!config.permissions.storage?.write;

        // Create and return the wrapped provider
        return new WrappedStorageProvider(provider, canRead, canWrite);
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