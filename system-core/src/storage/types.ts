/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Supported storage types
 */
export enum StorageType {
    LOCALFORAGE = 'localforage',
    INDEXEDDB = 'indexeddb',
    SESSION = 'session',
    AUTO = 'auto' // Default, will select the most appropriate provider
}

export interface StorageOptions {
    /** The namespace for this storage instance */
    namespace: string;
    /** Storage type to use */
    type?: StorageType;
    /** Default values to initialize with if not already present */
    defaults?: Record<string, any>;
    /** Schema validation (Electron only) */
    schema?: any;
    /** Connection options for specific providers */
    connectionOptions?: any;
}

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
    values<T = any>(): Promise<T[]>;

    /**
     * Get all entries in this namespace
     */
    entries<T = any>(): Promise<Array<[string, T]>>;
}