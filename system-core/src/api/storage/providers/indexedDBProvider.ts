import { StorageOptions, StorageProvider } from '../types';

/**
 * Type for event target with error property
 */
interface ErrorEventTarget extends EventTarget {
    error: Error | DOMException;
}

export class IndexedDBProvider implements StorageProvider {
    private namespace: string;
    private dbName: string;
    private storeName: string;
    private dbPromise: Promise<IDBDatabase>;
    private defaults?: Record<string, unknown>;

    constructor(options: StorageOptions) {
        this.namespace = options.namespace;
        this.defaults = options.defaults;

        // In case the namespace contains characters not valid for IndexedDB names
        this.dbName = `storage-${this.namespace.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        this.storeName = 'keyValueStore';

        // Initialize the database
        this.dbPromise = this.initDB();
    }

    private async initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = (event) => {
                const target = event.target as ErrorEventTarget;
                reject(new Error(`Failed to open IndexedDB: ${target.error.message}`));
            };

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                resolve(db);

                // Initialize defaults after DB is ready
                if (this.defaults) {
                    this.initDefaults(this.defaults).catch((error: Error) =>
                        console.error('Error initializing defaults:', error)
                    );
                }
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create the object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    private async initDefaults<T>(defaults: Record<string, T>): Promise<void> {
        const entries = Object.entries(defaults);
        for (const [key, value] of entries) {
            if (!(await this.has(key))) {
                await this.set<T>(key, value as T);
            }
        }
    }

    private async getObjectStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        const db = await this.dbPromise;
        const transaction = db.transaction(this.storeName, mode);
        return transaction.objectStore(this.storeName);
    }

    async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        try {
            const store = await this.getObjectStore();
            return new Promise<T | undefined>((resolve, reject) => {
                const request = store.get(key);

                request.onsuccess = () => {
                    const value = request.result;
                    resolve(value !== undefined ? value : defaultValue);
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB get error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.get:', error);
            return defaultValue;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        try {
            const store = await this.getObjectStore('readwrite');
            return new Promise<void>((resolve, reject) => {
                const request = store.put(value, key);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB set error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.set:', error);
            throw error;
        }
    }

    async has(key: string): Promise<boolean> {
        try {
            const store = await this.getObjectStore();
            return new Promise<boolean>((resolve, reject) => {
                const request = store.count(key);

                request.onsuccess = () => {
                    resolve(request.result > 0);
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB has error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.has:', error);
            return false;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const store = await this.getObjectStore('readwrite');
            return new Promise<void>((resolve, reject) => {
                const request = store.delete(key);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB delete error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.delete:', error);
            throw error;
        }
    }

    async clear(): Promise<void> {
        try {
            const store = await this.getObjectStore('readwrite');
            return new Promise<void>((resolve, reject) => {
                const request = store.clear();

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB clear error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.clear:', error);
            throw error;
        }
    }

    async keys(): Promise<string[]> {
        try {
            const store = await this.getObjectStore();
            return new Promise<string[]>((resolve, reject) => {
                const keys: string[] = [];
                const request = store.openCursor();

                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                    if (cursor) {
                        keys.push(cursor.key as string);
                        cursor.continue();
                    } else {
                        resolve(keys);
                    }
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB keys error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.keys:', error);
            return [];
        }
    }

    async values<T>(): Promise<T[]> {
        try {
            const store = await this.getObjectStore();
            return new Promise<T[]>((resolve, reject) => {
                const values: T[] = [];
                const request = store.openCursor();

                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                    if (cursor) {
                        values.push(cursor.value as T);
                        cursor.continue();
                    } else {
                        resolve(values);
                    }
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB values error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.values:', error);
            return [];
        }
    }

    async entries<T>(): Promise<Array<[string, T]>> {
        try {
            const store = await this.getObjectStore();
            return new Promise<Array<[string, T]>>((resolve, reject) => {
                const entries: Array<[string, T]> = [];
                const request = store.openCursor();

                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                    if (cursor) {
                        entries.push([cursor.key as string, cursor.value as T]);
                        cursor.continue();
                    } else {
                        resolve(entries);
                    }
                };

                request.onerror = (event) => {
                    const target = event.target as ErrorEventTarget;
                    reject(new Error(`IndexedDB entries error: ${target.error.message}`));
                };
            });
        } catch (error) {
            console.error('Error in IndexedDBProvider.entries:', error);
            return [];
        }
    }
}