import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

const storage = {
    setItem: (key: string, value: string) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
    },
    getItem: (key: string) => {
        const value = window.localStorage.getItem(key);
        return Promise.resolve(value);
    },
    removeItem: (key: string) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
    }
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            networkMode: 'offlineFirst',
            gcTime: Infinity,
            staleTime: Infinity,
            retry: false,
        },
    },
});

const persister = createAsyncStoragePersister({
    storage,
    key: 'REACT_QUERY_OFFLINE_CACHE',
});

persistQueryClient({
    queryClient,
    persister,
    maxAge: Infinity,
});

export { queryClient };