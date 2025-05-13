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
  // Generate a unique ID if not provided
  const tabViewIdRef = useRef<string | null>(propTabViewId || null);

  const {
    createTabView,
    getTabsForTabView,
    getActiveTabIdForTabView
  } = useTabStore();

  // Create tab view on mount if not provided
  useEffect(() => {
    if (tabViewIdRef.current) {
      const tabViewId = tabViewIdRef.current;

      // Check if TabView already exists
      const existingTabs = getTabsForTabView(accountId, tabViewId);
      const hasActiveTab = getActiveTabIdForTabView(accountId, tabViewId);

      // Only create if both tabs array is empty and there's no active tab
      // This indicates the TabView doesn't exist in the store yet
      if (existingTabs.length === 0 && !hasActiveTab) {
        createTabView(accountId, tabViewId);
      }
    }
  }, [accountId]);

  // Get the current tabViewId, ensuring it's never null
  const tabViewId = tabViewIdRef.current;

  // If tabViewId is still null (shouldn't happen), don't render
  if (!tabViewId) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Bar */}
      <TabManagement
        className="flex-shrink-0"
        accountId={accountId}
        tabViewId={tabViewId}
        removeGroup={removeGroup}
      />

      {/* Tab Content */}
      <TabContent
        accountId={accountId}
        tabViewId={tabViewId}
      />
    </div>
  );
};

export default TabView;