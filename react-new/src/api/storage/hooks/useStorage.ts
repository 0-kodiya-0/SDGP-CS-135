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

    useEffect(() => {
        // Load initial value
        const loadValue = async () => {
            setIsLoading(true);
            const storedValue = await storage.get<T>(key, defaultValue);
            setValue(storedValue !== undefined ? storedValue : defaultValue);
            setIsLoading(false);
        };

        loadValue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, storage]);

    const setStoredValue = async (newValue: T) => {
        setValue(newValue);
        await storage.set(key, newValue);
    };

    return {
        value,
        setValue: setStoredValue,
        isLoading,
        remove: () => storage.delete(key),
    };
}