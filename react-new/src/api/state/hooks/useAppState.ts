import stateApi from '../stateApi';
import { StateSelector, StateStoreOptions } from '../types';

/**
 * Hook to use a specific app state store
 * @param options Store options (will be created if it doesn't exist)
 * @param selector Optional selector function to get part of the state
 */
export default function useAppState<T extends object, U = T>(
    options: StateStoreOptions<T>,
    selector?: StateSelector<T, U>
): U {
    const store = stateApi.getStore(options);

    // Use the store with optional selector
    return selector
        ? store(selector)
        : store() as unknown as U;
}