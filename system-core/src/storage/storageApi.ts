import { StorageOptions, StorageProvider, StorageType } from './types';
import {
    LocalForageProvider,
    IndexedDBProvider,
    SessionStorageProvider
} from './providers';

/**
 * Main Storage API class that provides a unified interface
 * for persistent storage across different providers
 */
export class StorageApi {
    private providers: Map<string, StorageProvider> = new Map();

    /**
     * Creates or retrieves a storage provider for the given namespace
     * @param options Configuration options for the storage provider
     */
    getStorage(options: StorageOptions): StorageProvider {
        const key = this.getProviderKey(options);

        if (this.providers.has(key)) {
            return this.providers.get(key)!;
        }

        const provider = this.createProviderInstance(options);
        this.providers.set(key, provider);
        return provider;
    }

    /**
     * Creates a new instance of a storage provider
     * @param options Configuration options for the storage provider
     */
    createStorage(options: StorageOptions): StorageProvider {
        const provider = this.createProviderInstance(options);
        const key = this.getProviderKey(options);
        this.providers.set(key, provider);
        return provider;
    }

    /**
     * Gets the provider type based on options or auto-detects the best available
     */
    getProviderType(options: StorageOptions): StorageType {
        if (options.type && options.type !== StorageType.AUTO) {
            return options.type;
        }

        // Auto-detect the best available storage
        try {
            // Check for IndexedDB support
            if (typeof indexedDB !== 'undefined') {
                return StorageType.INDEXEDDB;
            }

            // Fallback to LocalForage which handles multiple storage types
            return StorageType.LOCALFORAGE;
        } catch (error) {
            console.warn('Auto-detection failed, using LocalForage as fallback:', error);
            return StorageType.LOCALFORAGE;
        }
    }

    /**
     * Creates a unique key for the provider in the internal map
     */
    private getProviderKey(options: StorageOptions): string {
        const type = this.getProviderType(options);
        return `${type}:${options.namespace}`;
    }

    /**
     * Creates a provider instance based on the specified type
     */
    private createProviderInstance(options: StorageOptions): StorageProvider {
        const type = this.getProviderType(options);

        switch (type) {
            case StorageType.INDEXEDDB:
                return new IndexedDBProvider(options);

            case StorageType.SESSION:
                return new SessionStorageProvider(options);

            case StorageType.LOCALFORAGE:
            default:
                return new LocalForageProvider(options);
        }
    }
}

// Create a singleton instance of the StorageApi
const storageApi = new StorageApi();
export default storageApi;