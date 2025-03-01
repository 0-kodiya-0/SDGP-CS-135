import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Load initial value
        const loadValue = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const storedValue = await storage.get<T>(key, defaultValue);
                setValue(storedValue !== undefined ? storedValue : defaultValue);
            } catch (err) {
                console.error(`Error loading value for key "${key}":`, err);
                setError(err instanceof Error ? err : new Error(String(err)));
                setValue(defaultValue);
            } finally {
                setIsLoading(false);
            }
        };

        loadValue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, storage]);

    const setStoredValue = async (newValue: T) => {
        try {
            setError(null);
            setValue(newValue);
            await storage.set(key, newValue);
        } catch (err) {
            console.error(`Error setting value for key "${key}":`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    const removeValue = async () => {
        try {
            setError(null);
            await storage.delete(key);
            setValue(defaultValue);
        } catch (err) {
            console.error(`Error removing key "${key}":`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    return {
        value,
        setValue: setStoredValue,
        isLoading,
        error,
        remove: removeValue,
        reset: () => setValue(defaultValue),
    };
}