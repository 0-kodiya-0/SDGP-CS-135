import React, { useEffect, useRef } from 'react';
import TabManagement from './TabManagement';
import TabContent from './TabContent';
import { useTabStore } from '../store/useTabStore';

interface TabViewProps {
  className?: string;
  accountId: string;
  tabViewId?: string;
  removeGroup: () => void; // Callback for GroupPanel to remove itself
}

export const TabView: React.FC<TabViewProps> = ({
  className = '',
  accountId,
  tabViewId: propTabViewId,
  removeGroup
}) => {
  // Generate a stable ID if not provided
  const tabViewIdRef = useRef<string>(propTabViewId || crypto.randomUUID());
  const tabViewId = tabViewIdRef.current;

  const {
    createTabView,
    getTabsForTabView,
    getActiveTabIdForTabView
  } = useTabStore();

  // Create tab view on mount if it doesn't exist
  useEffect(() => {
    // Check if TabView already exists
    const existingTabs = getTabsForTabView(accountId, tabViewId);
    const hasActiveTab = getActiveTabIdForTabView(accountId, tabViewId);

    // Only create if both tabs array is empty and there's no active tab
    // This indicates the TabView doesn't exist in the store yet
    if (existingTabs.length === 0 && !hasActiveTab) {
      createTabView(accountId, tabViewId);
    }
  }, [accountId, tabViewId]);

  return (
    <div key={tabViewId} className={`flex flex-col h-full ${className}`}>
      {/* Tab Bar */}
      <TabManagement
        key={`management-${tabViewId}`}
        className="flex-shrink-0"
        accountId={accountId}
        tabViewId={tabViewId}
        removeGroup={removeGroup}
      />

      {/* Tab Content */}
      <TabContent
        key={`content-${tabViewId}`}
        accountId={accountId}
        tabViewId={tabViewId}
      />
    </div>
  );
};

export default TabView;