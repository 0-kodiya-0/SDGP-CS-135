/* eslint-disable @typescript-eslint/no-explicit-any */
import localforage from 'localforage';
import { StorageOptions, StorageProvider } from '../types';

export class WebStorageProvider implements StorageProvider {
    private storage: LocalForage;
    private namespace: string;

    constructor(options: StorageOptions) {
        this.namespace = options.namespace;
        this.storage = localforage.createInstance({
            name: this.namespace,
        });

        // Initialize defaults if provided
        if (options.defaults) {
            this.initDefaults(options.defaults);
        }
    }

    private async initDefaults(defaults: Record<string, any>): Promise<void> {
        const entries = Object.entries(defaults);
        for (const [key, value] of entries) {
            if (!(await this.has(key))) {
                await this.set(key, value);
            }
        }
    }

    async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        const value = await this.storage.getItem<T>(key);
        return value !== null ? value : defaultValue;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await this.storage.setItem(key, value);
    }

    async has(key: string): Promise<boolean> {
        const value = await this.storage.getItem(key);
        return value !== null;
    }

    async delete(key: string): Promise<void> {
        await this.storage.removeItem(key);
    }

    async clear(): Promise<void> {
        await this.storage.clear();
    }

    async keys(): Promise<string[]> {
        return this.storage.keys();
    }

    async values<T = any>(): Promise<T[]> {
        const keys = await this.keys();
        const values: T[] = [];

        for (const key of keys) {
            const value = await this.storage.getItem<T>(key);
            if (value !== null) {
                values.push(value);
            }
        }

        return values;
    }

    async entries<T = any>(): Promise<Array<[string, T]>> {
        const keys = await this.keys();
        const entries: Array<[string, T]> = [];

        for (const key of keys) {
            const value = await this.storage.getItem<T>(key);
            if (value !== null) {
                entries.push([key, value]);
            }
        }

        return entries;
    }
}