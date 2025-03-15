import { StorageProvider } from "../types";
import { storageLogger} from '../../logger/index';

const localforageLogger = storageLogger.extend('localforage');

/**
 * LocalForage provider implementation
 */
export class LocalForageProvider implements StorageProvider {
    private storage: LocalForage;
    
    constructor(storage: LocalForage) {
        this.storage = storage;
        localforageLogger('LocalForageProvider initialized with storage name: %s', 
                        this.storage.config().name);
    }

    async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        localforageLogger('Getting key: %s', key);
        try {
            const value = await this.storage.getItem<T>(key);
            if (value !== null) {
                localforageLogger('Key found: %s', key);
                return value;
            } else {
                localforageLogger('Key not found, using default: %s', key);
                return defaultValue;
            }
        } catch (error) {
            localforageLogger('Error getting item %s: %o', key, error);
            return defaultValue;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        localforageLogger('Setting key: %s', key);
        try {
            await this.storage.setItem(key, value);
            localforageLogger('Successfully set key: %s', key);
        } catch (error) {
            localforageLogger('Error setting item %s: %o', key, error);
            throw error;
        }
    }

    async has(key: string): Promise<boolean> {
        localforageLogger('Checking if key exists: %s', key);
        try {
            const value = await this.storage.getItem(key);
            const exists = value !== null;
            localforageLogger('Key %s exists: %s', key, exists);
            return exists;
        } catch (error) {
            localforageLogger('Error checking key %s: %o', key, error);
            return false;
        }
    }

    async delete(key: string): Promise<void> {
        localforageLogger('Deleting key: %s', key);
        try {
            await this.storage.removeItem(key);
            localforageLogger('Successfully deleted key: %s', key);
        } catch (error) {
            localforageLogger('Error deleting key %s: %o', key, error);
            throw error;
        }
    }

    async clear(): Promise<void> {
        localforageLogger('Clearing all storage');
        try {
            await this.storage.clear();
            localforageLogger('Successfully cleared storage');
        } catch (error) {
            localforageLogger('Error clearing storage: %o', error);
            throw error;
        }
    }

    async keys(): Promise<string[]> {
        localforageLogger('Getting all keys');
        try {
            const allKeys = await this.storage.keys();
            // Filter out internal keys
            const filteredKeys = allKeys.filter(key => !key.startsWith('__'));
            localforageLogger('Found %d keys (%d after filtering)', allKeys.length, filteredKeys.length);
            return filteredKeys;
        } catch (error) {
            localforageLogger('Error getting keys: %o', error);
            return [];
        }
    }

    async values<T>(): Promise<T[]> {
        localforageLogger('Getting all values');
        try {
            const keys = await this.keys();
            localforageLogger('Retrieving values for %d keys', keys.length);
            const values: T[] = [];
            
            for (const key of keys) {
                localforageLogger('Getting value for key: %s', key);
                const value = await this.storage.getItem<T>(key);
                if (value !== null) {
                    values.push(value);
                }
            }
            
            localforageLogger('Retrieved %d values', values.length);
            return values;
        } catch (error) {
            localforageLogger('Error getting values: %o', error);
            return [];
        }
    }

    async entries<T>(): Promise<Array<[string, T]>> {
        localforageLogger('Getting all entries');
        try {
            const keys = await this.keys();
            localforageLogger('Retrieving entries for %d keys', keys.length);
            const entries: Array<[string, T]> = [];
            
            for (const key of keys) {
                localforageLogger('Getting entry for key: %s', key);
                const value = await this.storage.getItem<T>(key);
                if (value !== null) {
                    entries.push([key, value]);
                }
            }
            
            localforageLogger('Retrieved %d entries', entries.length);
            return entries;
        } catch (error) {
            localforageLogger('Error getting entries: %o', error);
            return [];
        }
    }
}