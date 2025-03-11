import { StorageProvider } from "../../../../storage/types";
import { PluginPermissionError } from "../../types.error";

/**
 * A wrapped storage provider with permission controls
 */
export class WrappedStorageProvider implements Partial<StorageProvider> {
    private readonly storageProvider: StorageProvider;
    private readonly hasReadPermission: boolean;
    private readonly hasWritePermission: boolean;

    /**
     * Creates a new WrappedStorageProvider
     * 
     * @param storageProvider The underlying storage provider
     * @param hasReadPermission Whether the plugin has read permission
     * @param hasWritePermission Whether the plugin has write permission
     */
    constructor(
        storageProvider: StorageProvider,
        hasReadPermission: boolean,
        hasWritePermission: boolean
    ) {
        this.storageProvider = storageProvider;
        this.hasReadPermission = hasReadPermission;
        this.hasWritePermission = hasWritePermission;
    }

    /**
     * Check if read permission is granted
     * @throws PermissionError if read permission is not granted
     */
    private validateReadPermission(): void {
        if (!this.hasReadPermission) {
            throw new PluginPermissionError('read');
        }
    }

    /**
     * Check if write permission is granted
     * @throws PermissionError if write permission is not granted
     */
    private validateWritePermission(): void {
        if (!this.hasWritePermission) {
            throw new PluginPermissionError('write');
        }
    }

    /**
     * Get a value from storage (requires read permission)
     * @param key The key to retrieve
     * @param defaultValue Optional default value if key doesn't exist
     * @throws PermissionError if read permission is not granted
     */
    async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        this.validateReadPermission();
        return this.storageProvider.get<T>(key, defaultValue);
    }

    /**
     * Set a value in storage (requires write permission)
     * @param key The key to set
     * @param value The value to store
     * @throws PermissionError if write permission is not granted
     */
    async set<T>(key: string, value: T): Promise<void> {
        this.validateWritePermission();
        return this.storageProvider.set(key, value);
    }

    /**
     * Check if a key exists in storage (requires read permission)
     * @param key The key to check
     * @throws PermissionError if read permission is not granted
     */
    async has(key: string): Promise<boolean> {
        this.validateReadPermission();
        return this.storageProvider.has(key);
    }

    /**
     * Delete a key from storage (requires write permission)
     * @param key The key to delete
     * @throws PermissionError if write permission is not granted
     */
    async delete(key: string): Promise<void> {
        this.validateWritePermission();
        return this.storageProvider.delete(key);
    }

    /**
     * Clear all values in this namespace (requires write permission)
     * @throws PermissionError if write permission is not granted
     */
    async clear(): Promise<void> {
        this.validateWritePermission();
        return this.storageProvider.clear();
    }

    /**
     * Get all keys in this namespace (requires read permission)
     * @throws PermissionError if read permission is not granted
     */
    async keys(): Promise<string[]> {
        this.validateReadPermission();
        return this.storageProvider.keys();
    }

    /**
     * Get all values in this namespace (requires read permission)
     * @throws PermissionError if read permission is not granted
     */
    async values<T>(): Promise<T[]> {
        this.validateReadPermission();
        return this.storageProvider.values<T>();
    }

    /**
     * Get all entries in this namespace (requires read permission)
     * @throws PermissionError if read permission is not granted
     */
    async entries<T>(): Promise<Array<[string, T]>> {
        this.validateReadPermission();
        return this.storageProvider.entries<T>();
    }
}