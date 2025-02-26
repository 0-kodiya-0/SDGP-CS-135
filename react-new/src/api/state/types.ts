import { StateCreator } from 'zustand';
import { StoreApi, UseBoundStore } from 'zustand';

export type StateSelector<T, U> = (state: T) => U;

export interface StateStoreOptions<T> {
    /** Unique identifier for this store */
    name: string;
    /** Initial state of the store */
    initialState: T;
    /** Debug mode flag */
    debug?: boolean;
    /** Persistence options */
    persist?: {
        /** If true, will persist state to localStorage */
        enabled: boolean;
        /** Storage key to use for persistence */
        key?: string;
    };
}

export type StateStore<T> = UseBoundStore<StoreApi<T>>;

export type StoreCreatorFunction<T> = (
    initializer: StateCreator<T, [], []>
) => UseBoundStore<StoreApi<T>>;

export interface StateSubscription<T> {
    /** Unsubscribe from store updates */
    unsubscribe: () => void;
    /** Get the current state value */
    getState: () => T;
    /** Check if subscription is still active */
    isActive: () => boolean;
}

export interface StateApi {
    /**
     * Create a new state store with the given options
     * @param options Configuration options for the store
     */
    createStore<T extends object>(options: StateStoreOptions<T>): StateStore<T>;

    /**
     * Get an existing store by name, or create it if it doesn't exist
     * @param options Configuration options for the store
     */
    getStore<T extends object>(options: StateStoreOptions<T>): StateStore<T>;

    /**
     * Subscribe to a store's state changes
     * @param store The store to subscribe to
     * @param selector Optional selector to only listen to specific state changes
     * @param callback Function to call when state changes
     */
    subscribe<T extends object, U = T>(
        store: StateStore<T>,
        selector: StateSelector<T, U> | null,
        callback: (state: U) => void
    ): StateSubscription<U>;

    /**
     * Reset a store to its initial state
     * @param name The name of the store to reset
     */
    resetStore(name: string): void;

    /**
     * Reset all stores to their initial states
     */
    resetAllStores(): void;

    /**
     * Get a list of all registered store names
     */
    getStoreNames(): string[];
}