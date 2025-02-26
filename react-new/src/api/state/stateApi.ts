/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
    StateApi,
    StateSelector,
    StateStore,
    StateStoreOptions,
    StateSubscription,
    StoreCreatorFunction
} from './types';

class StateManagementApi implements StateApi {
    private stores: Map<string, {
        store: StateStore<any>,
        initialState: any,
        options: StateStoreOptions<any>
    }> = new Map();

    /**
     * Create a new state store with the given options
     * @param options Configuration options for the store
     */
    createStore<T extends object>(options: StateStoreOptions<T>): StateStore<T> {
        const { name, initialState, debug = false, persist: persistOptions } = options;

        if (this.stores.has(name)) {
            console.warn(`Store with name "${name}" already exists. Use getStore instead.`);
            return this.stores.get(name)!.store as StateStore<T>;
        }

        // Create store creator function based on options
        let createStoreFn: StoreCreatorFunction<T>;

        if (debug && persistOptions?.enabled) {
            // Both debug and persist
            createStoreFn = (fn) => create<T>()(
                devtools(
                    persist(fn, { name: persistOptions.key || `state-${name}` }),
                    { name }
                )
            );
        } else if (debug) {
            // Just debug
            createStoreFn = (fn) => create<T>()(devtools(fn, { name }));
        } else if (persistOptions?.enabled) {
            // Just persist
            createStoreFn = (fn) => create<T>()(
                persist(fn, { name: persistOptions.key || `state-${name}` })
            );
        } else {
            // No middleware
            createStoreFn = (fn) => create<T>(fn);
        }

        // Create the store
        const store = createStoreFn((set, get) => ({
            ...initialState,
            setState: (newState: Partial<T>) => set((state) => ({ ...state, ...newState })),
            getState: () => get(),
            resetState: () => set(initialState),
        }));

        // Register the store
        this.stores.set(name, { store, initialState, options });

        return store;
    }

    /**
     * Get an existing store by name, or create it if it doesn't exist
     * @param options Configuration options for the store
     */
    getStore<T extends object>(options: StateStoreOptions<T>): StateStore<T> {
        const { name } = options;

        if (this.stores.has(name)) {
            return this.stores.get(name)!.store as StateStore<T>;
        }

        return this.createStore(options);
    }

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
    ): StateSubscription<U> {
        const selectState = selector || ((state: T) => state as unknown as U);

        let active = true;
        const unsubscribe = store.subscribe((state) => {
            if (!active) return;

            const currentSelectedState = selectState(state);

            // You can implement your own comparison logic here
            // if needed, or just always call the callback
            callback(currentSelectedState);
        });

        return {
            unsubscribe: () => {
                active = false;
                unsubscribe();
            },
            getState: () => selectState(store.getState()),
            isActive: () => active,
        };
    }

    /**
     * Reset a store to its initial state
     * @param name The name of the store to reset
     */
    resetStore(name: string): void {
        if (!this.stores.has(name)) {
            console.warn(`Store with name "${name}" does not exist.`);
            return;
        }

        const { store } = this.stores.get(name)!;
        store.getState().resetState();
    }

    /**
     * Reset all stores to their initial states
     */
    resetAllStores(): void {
        this.stores.forEach(({ store }) => {
            store.getState().resetState();
        });
    }

    /**
     * Get a list of all registered store names
     */
    getStoreNames(): string[] {
        return Array.from(this.stores.keys());
    }
}

// Create singleton instance
const stateApi = new StateManagementApi();
export default stateApi;