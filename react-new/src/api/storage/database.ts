import storageApi from './storageApi';
import { StorageProvider } from './types';

/**
 * A higher-level database wrapper around the storage API
 * for domain-specific data management
 */
export class Database<T extends { id: string }> {
    private storage: StorageProvider;
    private collectionKey: string;

    /**
     * Creates a new Database instance for a specific collection
     * @param namespace Storage namespace
     * @param collection Collection name within the namespace
     */
    constructor(namespace: string, collection: string) {
        this.storage = storageApi.getStorage({ namespace });
        this.collectionKey = collection;
    }

    /**
     * Initialize the collection if it doesn't exist
     */
    private async ensureCollection(): Promise<T[]> {
        const exists = await this.storage.has(this.collectionKey);
        if (!exists) {
            await this.storage.set(this.collectionKey, []);
        }
        return this.storage.get<T[]>(this.collectionKey, []) as Promise<T[]>;
    }

    /**
     * Get all items in the collection
     */
    async getAll(): Promise<T[]> {
        return this.ensureCollection();
    }

    /**
     * Get a specific item by ID
     * @param id Item ID
     */
    async getById(id: string): Promise<T | undefined> {
        const items = await this.ensureCollection();
        return items.find(item => item.id === id);
    }

    /**
     * Add a new item to the collection
     * @param item Item to add
     */
    async add(item: T): Promise<T> {
        const items = await this.ensureCollection();
        items.push(item);
        await this.storage.set(this.collectionKey, items);
        return item;
    }

    /**
     * Update an existing item
     * @param id Item ID
     * @param updateData Updated item data
     */
    async update(id: string, updateData: Partial<T>): Promise<T | undefined> {
        const items = await this.ensureCollection();
        const index = items.findIndex(item => item.id === id);

        if (index === -1) return undefined;

        const updated = { ...items[index], ...updateData } as T;
        items[index] = updated;
        await this.storage.set(this.collectionKey, items);
        return updated;
    }

    /**
     * Remove an item from the collection
     * @param id Item ID
     */
    async remove(id: string): Promise<boolean> {
        const items = await this.ensureCollection();
        const filteredItems = items.filter(item => item.id !== id);

        if (filteredItems.length === items.length) {
            return false;
        }

        await this.storage.set(this.collectionKey, filteredItems);
        return true;
    }

    /**
     * Query items by a predicate function
     * @param predicate Function to test each item
     */
    async query(predicate: (item: T) => boolean): Promise<T[]> {
        const items = await this.ensureCollection();
        return items.filter(predicate);
    }
}