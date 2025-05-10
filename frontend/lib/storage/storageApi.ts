import localforage from 'localforage';
import { StorageOptions, StorageProvider, StorageType } from './types';
import { LocalForageProvider, SessionStorageProvider } from './providers';
import { storageLogger } from '../logger';

/**
 * Main Storage API class that provides a unified interface
 * using localForage as the underlying implementation
 */
export class StorageApi {
    private instances: Map<string, StorageProvider> = new Map();
    private static instance: StorageApi;

    private constructor() {
        storageLogger('Initializing StorageApi');
        storageLogger('LocalForage configured with drivers: INDEXEDDB, WEBSQL, LOCALSTORAGE');
    }

    public static getInstance(): StorageApi {
        if (!StorageApi.instance) {
            StorageApi.instance = new StorageApi();
        }
        return StorageApi.instance;
    }

    /**
     * Gets or creates a storage provider for the given namespace
     */
    getStorage(options: StorageOptions): StorageProvider {
        const { namespace, type } = options;
        const key = `${type || 'auto'}:${namespace}`;
        storageLogger('Getting storage provider: %s', key);

        // Return existing instance if available
        if (this.instances.has(key)) {
            storageLogger('Using existing provider for %s', key);
            return this.instances.get(key)!;
        }

        // Create a new storage provider
        storageLogger('Creating new provider for %s', key);
        const provider = this.createStorageProvider(options);
        this.instances.set(key, provider);
        return provider;
    }

    /**
     * Creates a new storage provider
     */
    createStorage(options: StorageOptions): StorageProvider {
        storageLogger('Explicitly creating new storage provider: %s:%s',
            options.type || 'auto', options.namespace);
        const provider = this.createStorageProvider(options);
        const key = `${options.type || 'auto'}:${options.namespace}`;
        this.instances.set(key, provider);
        return provider;
    }

    /**
     * Creates the appropriate storage provider based on the options
     */
    private createStorageProvider(options: StorageOptions): StorageProvider {
        const { namespace, type, defaults } = options;
        storageLogger('Creating storage provider: namespace=%s, type=%s', namespace, type);

        // Configure storage based on type
        const config: LocalForageOptions = {
            name: namespace,
            storeName: `store-${namespace}`,
            description: `Storage for ${namespace}`,
            version: 1,
            driver: localforage.INDEXEDDB,
            ...(options.connectionOptions || {})
        };

        // Set driver based on type
        if (type === StorageType.LOCALFORAGE) {
            storageLogger('Using default localforage driver order for %s', namespace);
            // Use default driver order
        } else if (type === StorageType.INDEXEDDB) {
            storageLogger('Using dedicated IndexedDB driver for %s', namespace);
            config.driver = localforage.INDEXEDDB;
        } else if (type === StorageType.SESSION) {
            storageLogger('Using SessionStorage provider for %s', namespace);
            // For session storage, we'll use a custom implementation
            return new SessionStorageProvider(options);
        }

        storageLogger('Creating localforage instance with config: %o', config);
        // Create the instance
        const instance = localforage.createInstance(config);

        // Create and return the provider
        const provider = new LocalForageProvider(instance);

        // Initialize defaults if provided
        if (defaults) {
            storageLogger('Initializing defaults for %s', namespace);
            this.initDefaults(provider, defaults);
        }

        return provider;
    }

    /**
     * Initialize default values for a provider
     */
    private async initDefaults<T>(provider: StorageProvider, defaults: Record<string, T>): Promise<void> {
        // Check if defaults were already initialized
        const initialized = await provider.get<boolean>('__defaults_initialized');
        if (initialized) {
            storageLogger('Defaults already initialized');
            return;
        }

        // Set defaults for any keys that don't exist
        const entries = Object.entries(defaults);
        storageLogger('Setting %d default entries', entries.length);

        for (const [key, value] of entries) {
            if (!(await provider.has(key))) {
                storageLogger('Setting default value for key: %s', key);
                await provider.set(key, value);
            } else {
                storageLogger('Key already exists, skipping default: %s', key);
            }
        }

        // Mark as initialized
        await provider.set('__defaults_initialized', true);
        storageLogger('Defaults initialization complete');
    }
}

export default StorageApi.getInstance();