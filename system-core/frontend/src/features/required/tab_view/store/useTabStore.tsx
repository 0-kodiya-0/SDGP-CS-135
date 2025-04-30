import React, { useCallback } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tab, SerializedTab } from '../types/types.data';
import { ComponentLoader } from '../utils/componentRegistry';
import { useAccount } from '../../../default/user_account';

// Define user-tab map to track tabs by accountId
type AccountTabMap = {
  [accountId: string]: {
    tabs: SerializedTab[];
    activeTabId: string | null;
  };
};

interface TabStateBase {
  // Map of account IDs to their tabs and active tab
  accountTabs: AccountTabMap;
  
  // Methods to manipulate tabs for a specific account
  addTabForAccount: (
    accountId: string, 
    title: string, 
    content: React.ReactNode, 
    componentType?: string, 
    props?: Record<string, any>
  ) => string;
  
  closeTabForAccount: (accountId: string, tabId: string) => void;
  updateTabForAccount: (accountId: string, tabId: string, updates: Partial<Omit<Tab, 'id'>>) => void;
  setActiveTabForAccount: (accountId: string, tabId: string) => void;
  
  // Get tabs and active tab for a specific account
  getTabsForAccount: (accountId: string) => SerializedTab[];
  getActiveTabIdForAccount: (accountId: string) => string | null;
}

// Generate unique ID
const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Create the base Zustand store
export const useTabStoreBase = create<TabStateBase>()(
  persist(
    (set, get) => ({
      accountTabs: {},
      
      getTabsForAccount: (accountId) => {
        const { accountTabs } = get();
        return accountTabs[accountId]?.tabs || [];
      },
      
      getActiveTabIdForAccount: (accountId) => {
        const { accountTabs } = get();
        return accountTabs[accountId]?.activeTabId || null;
      },
      
      addTabForAccount: (accountId, title, _content, componentType, props = {}) => {
        console.log(`[TabStore] Adding tab for account: ${accountId}, title: ${title}, componentType: ${componentType}`);
        
        const tabs = get().getTabsForAccount(accountId);
        
        // Check if a tab with this title already exists for this account
        const existingTab = tabs.find(tab => tab.title === title);
        if (existingTab) {
          set(state => ({
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...state.accountTabs[accountId],
                activeTabId: existingTab.id
              }
            }
          }));
          return existingTab.id;
        }
        
        const newTabId = generateId();
        const newTab: SerializedTab = {
          id: newTabId,
          title,
          componentType,
          props
        };
        
        set(state => ({
          accountTabs: {
            ...state.accountTabs,
            [accountId]: {
              tabs: [...(state.accountTabs[accountId]?.tabs || []), newTab],
              activeTabId: newTabId
            }
          }
        }));
        
        return newTabId;
      },
      
      closeTabForAccount: (accountId, tabId) => {
        const { accountTabs } = get();
        const accountData = accountTabs[accountId];
        
        if (!accountData) return;
        
        const tabs = accountData.tabs;
        const activeTabId = accountData.activeTabId;
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        
        if (tabIndex === -1) return;
        
        // Calculate new active tab ID if closing the active tab
        let newActiveTabId = activeTabId;
        if (activeTabId === tabId) {
          const nextTab = tabs[tabIndex + 1] || tabs[tabIndex - 1];
          newActiveTabId = nextTab?.id || null;
        }
        
        // Update the store
        set(state => ({
          accountTabs: {
            ...state.accountTabs,
            [accountId]: {
              tabs: tabs.filter(tab => tab.id !== tabId),
              activeTabId: newActiveTabId
            }
          }
        }));
      },
      
      updateTabForAccount: (accountId, tabId, updates) => {
        set(state => {
          const accountData = state.accountTabs[accountId];
          if (!accountData) return state;
          
          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                tabs: accountData.tabs.map(tab =>
                  tab.id === tabId ? { ...tab, ...updates } : tab
                )
              }
            }
          };
        });
      },
      
      setActiveTabForAccount: (accountId, tabId) => {
        set(state => {
          const accountData = state.accountTabs[accountId];
          if (!accountData) return state;
          
          return {
            accountTabs: {
              ...state.accountTabs,
              [accountId]: {
                ...accountData,
                activeTabId: tabId
              }
            }
          };
        });
      }
    }),
    {
      name: 'account-tab-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accountTabs: state.accountTabs })
    }
  )
);

/**
 * Hook that combines AccountContext with the tab store
 * to provide account-specific tab management
 */
export const useTabStore = () => {
  // Get the current account from your existing AccountContext
  const { currentAccount } = useAccount();
  
  // Get the account ID
  const accountId = currentAccount?.id || 'default';
  
  // Get the base store methods
  const {
    getTabsForAccount,
    getActiveTabIdForAccount,
    addTabForAccount,
    closeTabForAccount,
    updateTabForAccount,
    setActiveTabForAccount
  } = useTabStoreBase();
  
  // Get the tabs and active tab ID for the current account
  const tabs = getTabsForAccount(accountId);
  const activeTabId = getActiveTabIdForAccount(accountId);
  
  // Provide simplified API that automatically uses the current account
  const addTab = useCallback(
    (title: string, content: React.ReactNode, componentType?: string, props?: Record<string, any>) => {
      return addTabForAccount(accountId, title, content, componentType, props);
    },
    [accountId, addTabForAccount]
  );
  
  const closeTab = useCallback(
    (tabId: string) => {
      closeTabForAccount(accountId, tabId);
    },
    [accountId, closeTabForAccount]
  );
  
  const updateTab = useCallback(
    (tabId: string, updates: Partial<Omit<Tab, 'id'>>) => {
      updateTabForAccount(accountId, tabId, updates);
    },
    [accountId, updateTabForAccount]
  );
  
  const setActiveTab = useCallback(
    (tabId: string) => {
      setActiveTabForAccount(accountId, tabId);
    },
    [accountId, setActiveTabForAccount]
  );
  
  // Function to restore content from a serialized tab
  const restoreContent = useCallback(
    (tab: SerializedTab) => {
      if (!tab.componentType) return null;
      
      // Use the ComponentLoader to dynamically load the component
      return (
        <ComponentLoader 
          componentType={tab.componentType} 
          props={tab.props || {}} 
        />
      );
    },
    []
  );
  
  return {
    // Current account's tabs and active tab
    tabs,
    activeTabId,
    
    // Methods that automatically use the current account
    addTab,
    closeTab,
    updateTab,
    setActiveTab,
    restoreContent,
    
    // Additional context
    accountId
  };
};