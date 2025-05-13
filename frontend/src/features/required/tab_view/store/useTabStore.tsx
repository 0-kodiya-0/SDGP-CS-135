import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tab, SerializedTab } from '../types/types.data';

// Define user-tab map to track tabs by accountId and tabViewId
type AccountTabMap = {
  [accountId: string]: {
    tabViews: {
      [tabViewId: string]: {
        tabs: SerializedTab[];
        activeTabId: string | null;
      };
    };
  };
};

interface TabState {
  // Map of account IDs to their tab views
  accountTabs: AccountTabMap;

  // Tab view operations
  createTabView: (accountId: string, tabViewId: string) => string; // Now generates and returns tabViewId
  removeTabView: (accountId: string, tabViewId: string) => void;

  // Tab operations
  addTab: (accountId: string, title: string, componentType?: string, props?: Record<string, any>) => string;
  closeTab: (accountId: string, tabId: string) => void; // Close tab by tabId only
  closeTabInTabView: (accountId: string, tabViewId: string, tabId: string) => void; // Close specific tab in specific TabView
  closeActiveTab: (accountId: string, tabViewId: string) => void; // Close active tab in TabView
  updateTab: (accountId: string, tabId: string, updates: Partial<Omit<Tab, 'id'>>) => void;
  setActiveTab: (accountId: string, tabViewId: string, tabId: string) => void;
  setActiveTabById: (accountId: string, tabId: string) => void; // Set active tab by tabId only

  moveTab: (accountId: string, tabId: string, targetTabViewId: string) => void;

  // Getters
  getTabsForTabView: (accountId: string, tabViewId: string) => SerializedTab[];
  getActiveTabIdForTabView: (accountId: string, tabViewId: string) => string | null;
  getAllTabViewsForAccount: (accountId: string) => string[];
  getActiveTabView: (accountId: string) => string | null;

  // Tab view management
  getTabViewForTab: (accountId: string, tabId: string) => string | null;
  getTabInfo: (accountId: string, tabId: string) => { tab: SerializedTab; tabViewId: string } | null; // Get tab info with tabViewId
}

// Generate unique ID
const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Create the Zustand store
export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      accountTabs: {},

      createTabView: (accountId, tabViewId) => {
        set((state) => ({
          accountTabs: {
            ...state.accountTabs,
            [accountId]: {
              ...state.accountTabs[accountId],
              tabViews: {
                ...(state.accountTabs[accountId]?.tabViews || {}),
                [tabViewId]: {
                  tabs: [],
                  activeTabId: null
                }
              }
            }
          }
        }));
        return tabViewId;
      },

      removeTabView: (accountId, tabViewId) => {
        set((state) => {
          const accountData = state.accountTabs[accountId];
          if (!accountData) return state;

          const { [tabViewId]: removed, ...remainingTabViews } = accountData.tabViews;

          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                tabViews: remainingTabViews
              }
            }
          };
        });
      },

      addTab: (accountId, title, componentType, props = {}) => {
        const newTabId = generateId();
        let targetTabViewId: string | null = null;

        // Find the active TabView by looking for the one with a currently active tab
        const accountData = get().accountTabs[accountId];
        if (accountData) {
          // Try to find a TabView with an active tab
          for (const [tabViewId, tabViewData] of Object.entries(accountData.tabViews)) {
            if (tabViewData.activeTabId) {
              targetTabViewId = tabViewId;
              break;
            }
          }

          // If no TabView has an active tab, use the first available TabView
          if (!targetTabViewId && Object.keys(accountData.tabViews).length > 0) {
            targetTabViewId = Object.keys(accountData.tabViews)[0];
          }
        }

        // If no TabView exists, create a new one
        if (!targetTabViewId) {
          targetTabViewId = generateId();
        }

        const newTab: SerializedTab = {
          id: newTabId,
          title,
          componentType,
          props,
          tabViewId: targetTabViewId
        };

        set((state) => {
          const accountData = state.accountTabs[accountId];
          const tabViewData = accountData?.tabViews?.[targetTabViewId];

          if (!tabViewData) {
            // Create tab view if it doesn't exist
            return {
              accountTabs: {
                ...state.accountTabs,
                [accountId]: {
                  ...accountData,
                  tabViews: {
                    ...(accountData?.tabViews || {}),
                    [targetTabViewId]: {
                      tabs: [newTab],
                      activeTabId: newTabId
                    }
                  }
                }
              }
            };
          }

          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                tabViews: {
                  ...accountData.tabViews,
                  [targetTabViewId]: {
                    tabs: [...tabViewData.tabs, newTab],
                    activeTabId: newTabId
                  }
                }
              }
            }
          };
        });

        return newTabId;
      },

      closeTab: (accountId, tabId) => {
        const accountData = get().accountTabs[accountId];
        if (!accountData) return;

        // Find which tab view contains this tab
        let targetTabViewId: string | null = null;
        for (const [tabViewId, tabViewData] of Object.entries(accountData.tabViews)) {
          if (tabViewData.tabs.some(tab => tab.id === tabId)) {
            targetTabViewId = tabViewId;
            break;
          }
        }

        if (!targetTabViewId) return;

        // Use the closeTabInTabView function
        get().closeTabInTabView(accountId, targetTabViewId, tabId);
      },

      closeTabInTabView: (accountId, tabViewId, tabId) => {
        set((state) => {
          const accountData = state.accountTabs[accountId];
          if (!accountData) return state;

          const tabViewData = accountData.tabViews[tabViewId];
          if (!tabViewData) return state;

          const tabIndex = tabViewData.tabs.findIndex(tab => tab.id === tabId);
          if (tabIndex === -1) return state;

          // Calculate new active tab ID if closing the active tab
          let newActiveTabId = tabViewData.activeTabId;
          if (tabViewData.activeTabId === tabId) {
            const nextTab = tabViewData.tabs[tabIndex + 1] || tabViewData.tabs[tabIndex - 1];
            newActiveTabId = nextTab?.id || null;
          }

          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                tabViews: {
                  ...accountData.tabViews,
                  [tabViewId]: {
                    tabs: tabViewData.tabs.filter(tab => tab.id !== tabId),
                    activeTabId: newActiveTabId
                  }
                }
              }
            }
          };
        });
      },

      closeActiveTab: (accountId, tabViewId) => {
        const state = get();
        const accountData = state.accountTabs[accountId];
        if (!accountData) return;

        const tabViewData = accountData.tabViews[tabViewId];
        if (!tabViewData || !tabViewData.activeTabId) return;

        state.closeTabInTabView(accountId, tabViewId, tabViewData.activeTabId);
      },

      updateTab: (accountId, tabId, updates) => {
        set((state) => {
          const accountData = state.accountTabs[accountId];
          if (!accountData) return state;

          // Find which tab view contains this tab
          let targetTabViewId: string | null = null;
          for (const [tabViewId, tabViewData] of Object.entries(accountData.tabViews)) {
            if (tabViewData.tabs.some(tab => tab.id === tabId)) {
              targetTabViewId = tabViewId;
              break;
            }
          }

          if (!targetTabViewId) return state;

          const tabViewData = accountData.tabViews[targetTabViewId];

          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                tabViews: {
                  ...accountData.tabViews,
                  [targetTabViewId]: {
                    ...tabViewData,
                    tabs: tabViewData.tabs.map(tab =>
                      tab.id === tabId ? { ...tab, ...updates } : tab
                    )
                  }
                }
              }
            }
          };
        });
      },

      setActiveTab: (accountId, tabViewId, tabId) => {
        set((state) => {
          const accountData = state.accountTabs[accountId];
          const tabViewData = accountData?.tabViews?.[tabViewId];

          if (!tabViewData) return state;

          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                tabViews: {
                  ...accountData.tabViews,
                  [tabViewId]: {
                    ...tabViewData,
                    activeTabId: tabId
                  }
                }
              }
            }
          };
        });
      },

      setActiveTabById: (accountId, tabId) => {
        const accountData = get().accountTabs[accountId];
        if (!accountData) return;

        // Find which tab view contains this tab
        for (const [tabViewId, tabViewData] of Object.entries(accountData.tabViews)) {
          if (tabViewData.tabs.some(tab => tab.id === tabId)) {
            get().setActiveTab(accountId, tabViewId, tabId);
            return;
          }
        }
      },

      moveTab: (accountId, tabId, targetTabViewId) => {
        const tabInfo = get().getTabInfo(accountId, tabId);
        if (!tabInfo || tabInfo.tabViewId === targetTabViewId) return;

        // Get tab details before removing
        const tabToMove = { ...tabInfo.tab };

        // Remove from source
        get().closeTabInTabView(accountId, tabInfo.tabViewId, tabId);

        // Add to target with new tabViewId
        const updatedTab = { ...tabToMove, tabViewId: targetTabViewId };

        set((state) => {
          const accountData = state.accountTabs[accountId];
          const targetTabView = accountData?.tabViews?.[targetTabViewId];

          if (!targetTabView) return state;

          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                tabViews: {
                  ...accountData.tabViews,
                  [targetTabViewId]: {
                    tabs: [...targetTabView.tabs, updatedTab],
                    activeTabId: updatedTab.id
                  }
                }
              }
            }
          };
        });
      },

      getTabsForTabView: (accountId, tabViewId) => {
        const accountData = get().accountTabs[accountId];
        return accountData?.tabViews?.[tabViewId]?.tabs || [];
      },

      getActiveTabIdForTabView: (accountId, tabViewId) => {
        const accountData = get().accountTabs[accountId];
        return accountData?.tabViews?.[tabViewId]?.activeTabId || null;
      },

      getAllTabViewsForAccount: (accountId) => {
        const accountData = get().accountTabs[accountId];
        return Object.keys(accountData?.tabViews || {});
      },

      getActiveTabView: (accountId) => {
        const accountData = get().accountTabs[accountId];
        if (!accountData) return null;

        // Find the TabView with an active tab
        for (const [tabViewId, tabViewData] of Object.entries(accountData.tabViews)) {
          if (tabViewData.activeTabId) {
            return tabViewId;
          }
        }

        // If no TabView has an active tab, return the first TabView
        const tabViewIds = Object.keys(accountData.tabViews);
        return tabViewIds.length > 0 ? tabViewIds[0] : null;
      },

      getTabViewForTab: (accountId, tabId) => {
        const tabInfo = get().getTabInfo(accountId, tabId);
        return tabInfo ? tabInfo.tabViewId : null;
      },

      getTabInfo: (accountId, tabId) => {
        const accountData = get().accountTabs[accountId];
        if (!accountData) return null;

        // Find which tab view contains this tab and return both tab and tabViewId
        for (const [tabViewId, tabViewData] of Object.entries(accountData.tabViews)) {
          const tab = tabViewData.tabs.find(tab => tab.id === tabId);
          if (tab) {
            return { tab, tabViewId };
          }
        }

        return null;
      }
    }),
    {
      name: 'tab-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accountTabs: state.accountTabs })
    }
  )
);