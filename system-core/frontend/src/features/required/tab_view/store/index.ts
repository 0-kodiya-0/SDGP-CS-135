import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PluginConfig } from '../../../../plugin/core/types';
import { TabState, PluginTab } from '../types/types.store';
import { stateLogger } from '../../../../../lib/logger';

// Create dedicated logger for tab store
const tabStoreLogger = stateLogger.extend('tab');

// Generate a unique ID
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Initialize tab store
export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabViews: {},
      activeTabViewId: null,
      activeTabId: null,

      // Create a new tab view for an environment
      createTabView: (environmentId: number): string => {
        tabStoreLogger('Creating new tab view for environment %d', environmentId);
        const tabViewId = generateId();

        set((state) => {
          // Add the new tab view to the store
          tabStoreLogger('Tab view %s created for environment %d', tabViewId, environmentId);
          return {
            ...state,
            tabViews: {
              ...state.tabViews,
              [environmentId]: {
                id: tabViewId,
                environmentId,
                tabs: [],
                createdAt: Date.now()
              }
            }
          };
        });

        return tabViewId;
      },

      // Add a new tab
      addTab: (environmentId: number, plugin: PluginConfig, state: Record<string, unknown> = {}): string => {
        tabStoreLogger('Adding tab for plugin %s in environment %d', plugin.id, environmentId);
        const { tabViews } = get();
        let tabView = tabViews[environmentId];

        // Create tab view if it doesn't exist
        if (!tabView) {
          tabStoreLogger('Tab view for environment %d does not exist, creating new one', environmentId);
          const tabViewId = get().createTabView(environmentId);
          tabView = {
            id: tabViewId,
            environmentId,
            tabs: [],
            createdAt: Date.now()
          };
        }

        // Check for existing tab with the same plugin and state
        const existingTab = tabView.tabs.find(
          tab => tab.pluginId === plugin.id &&
            JSON.stringify(tab.state) === JSON.stringify(state)
        );

        if (existingTab) {
          tabStoreLogger('Existing tab found for plugin %s, activating tab %s',
            plugin.id, existingTab.id);
          // Activate the existing tab
          get().setActiveTab(tabView.id, existingTab.id);
          return existingTab.id;
        }

        // Create a new tab
        const tabId = generateId();
        const newTab: PluginTab = {
          id: tabId,
          pluginId: plugin.id,
          title: plugin.name,
          config: plugin,
          state,
          createdAt: Date.now()
        };

        tabStoreLogger('Creating new tab %s for plugin %s (%s)', tabId, plugin.id, plugin.name);

        set((state) => {
          const updatedTabs = [...(state.tabViews[environmentId]?.tabs || []), newTab];

          tabStoreLogger('Tab %s added to environment %d, total tabs: %d',
            tabId, environmentId, updatedTabs.length);

          return {
            ...state,
            tabViews: {
              ...state.tabViews,
              [environmentId]: {
                ...(state.tabViews[environmentId] || { id: tabView.id, environmentId, createdAt: Date.now() }),
                tabs: updatedTabs
              }
            },
            activeTabViewId: tabView.id,
            activeTabId: tabId
          };
        });

        return tabId;
      },

      // Close a tab
      closeTab: (environmentId: number, tabId: string): void => {
        tabStoreLogger('Closing tab %s in environment %d', tabId, environmentId);
        const { tabViews, activeTabId } = get();
        const tabView = tabViews[environmentId];

        if (!tabView) {
          tabStoreLogger('Tab view for environment %d not found, cannot close tab', environmentId);
          return;
        }

        // Find the tab index
        const tabIndex = tabView.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) {
          tabStoreLogger('Tab %s not found in environment %d', tabId, environmentId);
          return;
        }

        // Prepare to select another tab if the closed one is active
        let newActiveTabId: string | null = activeTabId;
        if (activeTabId === tabId) {
          // Try to select the next tab, or the previous if there's no next
          const nextTab = tabView.tabs[tabIndex + 1] || tabView.tabs[tabIndex - 1];
          newActiveTabId = nextTab?.id || null;

          tabStoreLogger('Closed tab %s was active, selecting new active tab: %s',
            tabId, newActiveTabId || 'none');
        }

        // Update state
        set((state) => {
          const updatedTabs = [...tabView.tabs];
          updatedTabs.splice(tabIndex, 1);

          tabStoreLogger('Tab %s removed from environment %d, %d tabs remaining',
            tabId, environmentId, updatedTabs.length);

          return {
            ...state,
            tabViews: {
              ...state.tabViews,
              [environmentId]: {
                ...tabView,
                tabs: updatedTabs
              }
            },
            activeTabId: newActiveTabId
          };
        });
      },

      // Set the active tab
      setActiveTab: (tabViewId: string, tabId: string): void => {
        tabStoreLogger('Setting active tab: view=%s, tab=%s', tabViewId, tabId);
        set({
          activeTabViewId: tabViewId,
          activeTabId: tabId
        });
      },

      // Update tab state
      updateTabState: (environmentId: number, tabId: string, state: Record<string, unknown>): void => {
        tabStoreLogger('Updating state for tab %s in environment %d', tabId, environmentId);
        const { tabViews } = get();
        const tabView = tabViews[environmentId];

        if (!tabView) {
          tabStoreLogger('Tab view for environment %d not found, cannot update tab state', environmentId);
          return;
        }

        // Find the tab
        const tabIndex = tabView.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) {
          tabStoreLogger('Tab %s not found in environment %d', tabId, environmentId);
          return;
        }

        // Update state
        set((currentState) => {
          const updatedTabs = [...tabView.tabs];
          updatedTabs[tabIndex] = {
            ...updatedTabs[tabIndex],
            state: {
              ...updatedTabs[tabIndex].state,
              ...state
            }
          };

          tabStoreLogger('State updated for tab %s in environment %d', tabId, environmentId);

          return {
            ...currentState,
            tabViews: {
              ...currentState.tabViews,
              [environmentId]: {
                ...tabView,
                tabs: updatedTabs
              }
            }
          };
        });
      },

      // Handle environment change
      setActiveEnvironment: (environmentId: number): void => {
        tabStoreLogger('Setting active environment: %d', environmentId);
        const { tabViews } = get();
        const tabView = tabViews[environmentId];

        if (tabView) {
          // Activate the first tab if it exists
          const firstTab = tabView.tabs[0];
          if (firstTab) {
            tabStoreLogger('Activating first tab %s in environment %d', firstTab.id, environmentId);
          } else {
            tabStoreLogger('No tabs found in environment %d', environmentId);
          }

          set({
            activeTabViewId: tabView.id,
            activeTabId: firstTab?.id || null
          });
        } else {
          // Create a new tab view for this environment
          tabStoreLogger('No tab view found for environment %d, creating new one', environmentId);
          const tabViewId = get().createTabView(environmentId);
          set({
            activeTabViewId: tabViewId,
            activeTabId: null
          });
        }
      },

      // Clear active tab
      clearActiveTab: (): void => {
        tabStoreLogger('Clearing active tab');
        set({
          activeTabId: null
        });
      }
    }),
    {
      name: 'plugin-tab-storage',
      version: 1
    }
  )
);

// Selector to get active tab
export const getActiveTab = (state: TabState, environmentId: number): PluginTab | null => {
  const { activeTabId, tabViews } = state;
  if (!activeTabId || !environmentId) return null;

  const tabView = tabViews[environmentId];
  if (!tabView) return null;

  return tabView.tabs.find(tab => tab.id === activeTabId) || null;
};

// Selector to get tabs for environment
export const getEnvironmentTabs = (state: TabState, environmentId: number): PluginTab[] => {
  const tabView = state.tabViews[environmentId];
  return tabView?.tabs || [];
};