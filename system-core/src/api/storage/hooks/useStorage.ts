import { useState, useEffect, useCallback } from 'react';
import storageApi from '../storageApi';
import { StorageOptions } from '../types';

/**
 * React hook for using storage within components
 * @param key The storage key to access
 * @param defaultValue The default value if key doesn't exist
 * @param options Storage configuration options
 */
export default function useStorage<T>(
    key: string,
    defaultValue: T,
    options: StorageOptions
) {
    const storage = storageApi.getStorage(options);
    const [value, setValue] = useState<T>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Load the value from storage
    useEffect(() => {
        let isMounted = true;
        
        const loadValue = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const storedValue = await storage.get<T>(key, defaultValue);
                if (isMounted) {
                    setValue(storedValue !== undefined ? storedValue : defaultValue);
                }
            } catch (err) {
                console.error(`Error loading value for key "${key}":`, err);
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setValue(defaultValue);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadValue();
        
        // Cleanup function to prevent state updates after unmount
        return () => {
            isMounted = false;
        };
    }, [key, defaultValue, storage]);

    // Update the value in storage
    const setStoredValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
        try {
            setError(null);
            
            // Handle functional updates
            const valueToStore = 
                newValue instanceof Function ? newValue(value) : newValue;
            
            setValue(valueToStore);
            await storage.set(key, valueToStore);
        } catch (err) {
            console.error(`Error setting value for key "${key}":`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    }, [key, storage, value]);

    // Remove the value from storage
    const removeValue = useCallback(async () => {
        try {
            setError(null);
            await storage.delete(key);
            setValue(defaultValue);
        } catch (err) {
            console.error(`Error removing key "${key}":`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    }, [key, defaultValue, storage]);

    return {
        value,
        setValue: setStoredValue,
        isLoading,
        error,
        remove: removeValue,
        reset: () => setValue(defaultValue)
    };
}