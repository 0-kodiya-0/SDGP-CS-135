import { StorageOptions, StorageProvider } from '../types';

export class SessionStorageProvider implements StorageProvider {
    private namespace: string;
    private prefix: string;

    constructor(options: StorageOptions) {
        this.namespace = options.namespace;
        this.prefix = `${this.namespace}:`;

        // Initialize defaults if provided
        if (options.defaults) {
            this.initDefaults(options.defaults);
        }
    }

    private async initDefaults<T>(defaults: Record<string, T>): Promise<void> {
        const entries = Object.entries(defaults);
        for (const [key, value] of entries) {
            if (!(await this.has(key))) {
                await this.set<T>(key, value as T);
            }
        }
    }

    private getKeyWithPrefix(key: string): string {
        return `${this.prefix}${key}`;
    }

    async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        try {
            const prefixedKey = this.getKeyWithPrefix(key);
            const item = sessionStorage.getItem(prefixedKey);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item) as T;
        } catch (error) {
            console.error('Error in SessionStorageProvider.get:', error);
            return defaultValue;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        try {
            const prefixedKey = this.getKeyWithPrefix(key);
            const serialized = JSON.stringify(value);
            sessionStorage.setItem(prefixedKey, serialized);
        } catch (error) {
            console.error('Error in SessionStorageProvider.set:', error);
            throw error;
        }
    }

    async has(key: string): Promise<boolean> {
        const prefixedKey = this.getKeyWithPrefix(key);
        return sessionStorage.getItem(prefixedKey) !== null;
    }

    async delete(key: string): Promise<void> {
        const prefixedKey = this.getKeyWithPrefix(key);
        sessionStorage.removeItem(prefixedKey);
    }

    async clear(): Promise<void> {
        // Only clear items in this namespace
        const keysToRemove: string[] = [];

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }

        for (const key of keysToRemove) {
            sessionStorage.removeItem(key);
        }
    }

    async keys(): Promise<string[]> {
        const keys: string[] = [];

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }

        return keys;
    }

    async values<T>(): Promise<T[]> {
        const values: T[] = [];
        const keys = await this.keys();

        for (const key of keys) {
            const value = await this.get<T>(key);
            if (value !== undefined) {
                values.push(value);
            }
        }

        return values;
    }

    async entries<T>(): Promise<Array<[string, T]>> {
        const entries: Array<[string, T]> = [];
        const keys = await this.keys();

        for (const key of keys) {
            const value = await this.get<T>(key);
            if (value !== undefined) {
                entries.push([key, value]);
            }
        }

        return entries;
    }
}