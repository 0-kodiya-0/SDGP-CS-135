import { isEqual } from 'lodash';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createTabView,
    getTabViewsByEnvironment,
    deleteTabView,
    createTab,
    getTabsByTabView,
    deleteTab
} from '../api';
import { Tab, TabCreateDTO, TabViewCreateDTO } from '../types/data.ts';
import { useTabStore } from '../store';
import { queryClient } from '../../../../api/persistConfig.ts';

export const useTabViews = (environmentId: number) => {
    return useQuery({
        queryKey: ['tabViews', environmentId],
        queryFn: () => getTabViewsByEnvironment(environmentId),
        enabled: !!environmentId,
    });
};

export const useCreateTabView = (environmentId: number) => {
    const queryClient = useQueryClient();
    const { setActiveTabView } = useTabStore();

    return useMutation({
        mutationFn: (data: TabViewCreateDTO) => createTabView(data),
        onSuccess: (newTabView) => {
            queryClient.invalidateQueries({ queryKey: ['tabViews', environmentId] });
            setActiveTabView(newTabView);
        },
    });
};

export const useDeleteTabView = (environmentId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteTabView(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tabViews', environmentId] });
        },
    });
};

export const useTabs = (tabViewId: number | null) => {
    return useQuery({
        queryKey: ['tabs', tabViewId],
        queryFn: () => getTabsByTabView(tabViewId!),
        enabled: !!tabViewId,
    });
};

export const useCreateTab = () => {
    const queryClient = useQueryClient();
    const { setActiveTab } = useTabStore();

    return useMutation({
        mutationFn: (data: TabCreateDTO) => {
            const currentTabs = queryClient.getQueryData<Tab[]>(['tabs', data.tabViewId]) || [];

            // Check for existing tab with same content path and state
            const existingTab = currentTabs.find(tab =>
                tab.contentPath === data.contentPath &&
                isEqual(tab.contentState, data.contentState)
            );

            if (existingTab) {
                // If tab exists, just activate it and return it
                setActiveTab(existingTab);
                return Promise.resolve(existingTab);
            }

            data.order = (currentTabs.length ?? 0) + 1

            if (!data.tabViewId) {
                return Promise.reject(new Error('No active tab view'));
            }

            return createTab(data)
        },
        onSuccess: (newTab) => {
            queryClient.invalidateQueries({ queryKey: ['tabs', newTab.tabViewId] });
            setActiveTab(newTab);
        },
    });
};

export const useDeleteTab = (tabViewId: number | null) => {
    const queryClient = useQueryClient();
    const { activeTabId, setActiveTab, resetActiveTab } = useTabStore();

    return useMutation({
        mutationFn: (id: number) => deleteTab(id),
        onMutate: async (deletedTabId) => {
            // If we're not deleting the active tab, no need to change selection
            if (deletedTabId !== activeTabId?.id) {
                return;
            }

            // Get current tabs
            const currentTabs = queryClient.getQueryData<Tab[]>(['tabs', tabViewId]) || [];

            // Find the index of the tab being deleted
            const deletedIndex = currentTabs.findIndex(tab => tab.id === deletedTabId);

            // Find the nearest tab to set as active
            if (deletedIndex > -1) {
                // Try to select the next tab
                const nextTab = currentTabs[deletedIndex + 1];
                // If there's no next tab, try the previous one
                const previousTab = currentTabs[deletedIndex - 1];

                if (nextTab) {
                    setActiveTab(nextTab);
                } else if (previousTab) {
                    setActiveTab(previousTab);
                } else {
                    // No tabs left, reset active tab
                    resetActiveTab();
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tabs', tabViewId] });
        },
    });
};

// Optional: Add a utility to clear the cache if needed
export const clearPersistedCache = () => {
    queryClient.clear();
    window.localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
};