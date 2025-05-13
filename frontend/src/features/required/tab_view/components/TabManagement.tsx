import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { ScrollingText } from '../../../shared/scrolling_text';
import { useTabStore } from '../store/useTabStore';

interface TabManagementProps {
  className?: string;
  accountId: string;
  tabViewId: string;
  removeGroup: () => void;
}

export const TabManagement: React.FC<TabManagementProps> = ({
  className = '',
  accountId,
  tabViewId,
  removeGroup
}) => {
  const {
    removeTabView,
    getTabsForTabView,
    closeTab,
    setActiveTab,
    getActiveTabIdForTabView,
    getAllTabViewsForAccount
  } = useTabStore();

  // Check if this tab view should be removed
  const handleCloseTab = useCallback((tabId: string) => {
    if (!tabViewId) return;

    const tabs = getTabsForTabView(accountId, tabViewId);
    const allTabViews = getAllTabViewsForAccount(accountId);

    // Close the tab first
    closeTab(accountId, tabId);

    // Check conditions for removing the GroupPanel
    const remainingTabs = tabs.filter(tab => tab.id !== tabId);

    // Remove GroupPanel if:
    // 1. This was the last tab in this TabView
    // 2. There are other TabViews remaining (this is not the last TabView)
    if (remainingTabs.length === 0 && allTabViews.length > 1 && removeGroup) {
      // Remove this TabView from the store
      removeTabView(accountId, tabViewId);
      // Trigger GroupPanel removal
      removeGroup();
    }
  }, [accountId, closeTab, getAllTabViewsForAccount, getTabsForTabView, removeGroup, removeTabView, tabViewId]);

  // Handle tab selection
  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(accountId, tabViewId, tabId);
  }, [accountId, setActiveTab, tabViewId]);

  // Ensure tabViewId is valid before making calls
  if (!tabViewId) {
    return <div className={`${className} p-2 text-sm text-gray-500`}>Loading tabs...</div>;
  }

  const tabs = getTabsForTabView(accountId, tabViewId);
  const activeTabId = getActiveTabIdForTabView(accountId, tabViewId);

  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {tabs.length === 0 ? (
        <div className="p-2 text-sm text-gray-500">
          No tabs open
        </div>
      ) : (
        tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <div
              key={tab.id}
              className={`
                group relative flex items-center min-w-[100px] max-w-[200px] px-3 py-2 
                border-r border-gray-200 cursor-pointer
                ${isActive ? 'bg-white border-b-2 border-b-blue-500' : 'bg-gray-50'}
              `}
              onClick={() => handleTabClick(tab.id)}
            >
              <ScrollingText
                text={tab.title}
                className="text-sm py-2"
              />
              <button
                className="opacity-0 group-hover:opacity-100 ml-2"
                onClick={() => handleCloseTab(tab.id)}
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TabManagement;