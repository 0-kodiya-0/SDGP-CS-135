import { StorageProvider, StorageOptions } from "../types";
import { storageLogger } from '../../logger';

// Get the session storage logger
const sessionLogger = storageLogger.extend('session');

/**
 * Session storage provider implementation
 */
export class SessionStorageProvider implements StorageProvider {
    private namespace: string;
    private prefix: string;

    constructor(options: StorageOptions) {
        this.namespace = options.namespace;
        this.prefix = `${this.namespace}:`;
        sessionLogger('SessionStorageProvider initialized with namespace: %s', this.namespace);
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        const prefixedKey = this.getKey(key);
        sessionLogger('Getting key: %s (prefixed: %s)', key, prefixedKey);
        
        try {
            const item = sessionStorage.getItem(prefixedKey);
            if (item === null) {
                sessionLogger('Key not found, using default: %s', key);
                return defaultValue;
            }
            
            sessionLogger('Key found: %s', key);
            return JSON.parse(item) as T;
        } catch (error) {
            sessionLogger('Error getting item %s: %o', key, error);
            return defaultValue;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        const prefixedKey = this.getKey(key);
        sessionLogger('Setting key: %s (prefixed: %s)', key, prefixedKey);
        
        try {
            sessionStorage.setItem(prefixedKey, JSON.stringify(value));
            sessionLogger('Successfully set key: %s', key);
        } catch (error) {
            sessionLogger('Error setting item %s: %o', key, error);
            throw error;
        }
    }

    async has(key: string): Promise<boolean> {
        const prefixedKey = this.getKey(key);
        sessionLogger('Checking if key exists: %s (prefixed: %s)', key, prefixedKey);
        
        const exists = sessionStorage.getItem(prefixedKey) !== null;
        sessionLogger('Key %s exists: %s', key, exists);
        return exists;
    }

    async delete(key: string): Promise<void> {
        const prefixedKey = this.getKey(key);
        sessionLogger('Deleting key: %s (prefixed: %s)', key, prefixedKey);
        
        sessionStorage.removeItem(prefixedKey);
        sessionLogger('Successfully deleted key: %s', key);
    }

    async clear(): Promise<void> {
        sessionLogger('Clearing all keys in namespace: %s', this.namespace);
        // Only clear items in this namespace
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        
        sessionLogger('Found %d keys to remove', keysToRemove.length);
        for (const key of keysToRemove) {
            sessionLogger('Removing key: %s', key);
            sessionStorage.removeItem(key);
        }
        
        sessionLogger('Successfully cleared namespace: %s', this.namespace);
    }

    async keys(): Promise<string[]> {
        sessionLogger('Getting all keys in namespace: %s', this.namespace);
        const keys: string[] = [];
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                // Remove prefix and filter out internal keys
                const unprefixed = key.substring(this.prefix.length);
                if (!unprefixed.startsWith('__')) {
                    keys.push(unprefixed);
                }
            }
        }
        
        sessionLogger('Found %d keys in namespace %s', keys.length, this.namespace);
        return keys;
    }

    async values<T>(): Promise<T[]> {
        sessionLogger('Getting all values in namespace: %s', this.namespace);
        const keys = await this.keys();
        sessionLogger('Retrieving values for %d keys', keys.length);
        
        const values: T[] = [];
        for (const key of keys) {
            const value = await this.get<T>(key);
            if (value !== undefined) {
                values.push(value);
            }
        }
        
        sessionLogger('Retrieved %d values', values.length);
        return values;
    }

    async entries<T>(): Promise<Array<[string, T]>> {
        sessionLogger('Getting all entries in namespace: %s', this.namespace);
        const keys = await this.keys();
        sessionLogger('Retrieving entries for %d keys', keys.length);
        
        const entries: Array<[string, T]> = [];
        for (const key of keys) {
            const value = await this.get<T>(key);
            if (value !== undefined) {
                entries.push([key, value]);
            }
        }
        
        sessionLogger('Retrieved %d entries', entries.length);
        return entries;
    }
}