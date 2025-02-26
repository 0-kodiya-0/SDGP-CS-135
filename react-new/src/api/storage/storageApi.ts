import { StorageOptions, StorageProvider } from './types';
import { WebStorageProvider } from './providers/webProvider';

/**
 * Main Storage API class that provides a unified interface
 * for both Electron and web environments
 */
export class StorageApi {
    private providers: Map<string, StorageProvider> = new Map();

    /**
     * Creates or retrieves a storage provider for the given namespace
     * @param options Configuration options for the storage provider
     */
    getStorage(options: StorageOptions): StorageProvider {
        if (this.providers.has(options.namespace)) {
            return this.providers.get(options.namespace)!;
        }

        const provider = new WebStorageProvider(options);

        this.providers.set(options.namespace, provider);
        return provider;
    }

    /**
     * Creates a new instance of a storage provider with a unique namespace
     * @param options Configuration options for the storage provider
     */
    createStorage(options: StorageOptions): StorageProvider {
        const provider = new WebStorageProvider(options);

        this.providers.set(options.namespace, provider);
        return provider;
    }
}

// Create a singleton instance of the StorageApi
const storageApi = new StorageApi();
export default storageApi;