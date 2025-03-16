import { useTabStore } from '../store';
import { PluginConfig } from '../../../../plugin/core/types';
import { useCallback } from 'react';
import { PluginTab } from '../types/types.store';

interface UsePluginTabProps {
    environmentId: number;
}

interface UsePluginTabReturn {
    // Open a plugin in a tab
    openPluginTab: (plugin: PluginConfig, state?: Record<string, unknown>) => void;

    // Close a tab
    closeTab: (tabId: string) => void;

    // Get all tabs for current environment
    tabs: PluginTab[];

    // Get active tab
    activeTab: PluginTab | null;

    // Set active tab
    setActiveTab: (tabId: string) => void;

    // Update tab state
    updateTabState: (tabId: string, state: Record<string, unknown>) => void;
}

/**
 * Hook for managing plugin tabs
 * @param environmentId Current environment ID
 */
export const usePluginTab = ({ environmentId }: UsePluginTabProps): UsePluginTabReturn => {
    const {
        addTab,
        closeTab: closeTabAction,
        tabViews,
        activeTabId,
        setActiveTab: setActiveTabAction,
        updateTabState: updateTabStateAction,
    } = useTabStore();

    // Get tabs for current environment
    const tabView = environmentId ? tabViews[environmentId] : null;
    const tabs = tabView?.tabs || [];

    // Find active tab
    const activeTab = activeTabId ? tabs.find(tab => tab.id === activeTabId) || null : null;

    // Function to open a plugin in a tab
    const openPluginTab = useCallback((plugin: PluginConfig, state?: Record<string, unknown>) => {
        if (!environmentId) return;
        addTab(environmentId, plugin, state);
    }, [environmentId, addTab]);

    // Function to close a tab
    const closeTab = useCallback((tabId: string) => {
        if (!environmentId) return;
        closeTabAction(environmentId, tabId);
    }, [environmentId, closeTabAction]);

    // Function to set active tab
    const setActiveTab = useCallback((tabId: string) => {
        if (!tabView) return;
        setActiveTabAction(tabView.id, tabId);
    }, [tabView, setActiveTabAction]);

    // Function to update tab state
    const updateTabState = useCallback((tabId: string, state: Record<string, unknown>) => {
        if (!environmentId) return;
        updateTabStateAction(environmentId, tabId, state);
    }, [environmentId, updateTabStateAction]);

    return {
        openPluginTab,
        closeTab,
        tabs,
        activeTab,
        setActiveTab,
        updateTabState
    };
};

export default usePluginTab;