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
    createTabView
  } = useTabStore();

  // Create tab view on mount if not provided
  useEffect(() => {
    if (tabViewIdRef.current) {
      // Create a new TabView and get its ID
      const newTabViewId = createTabView(accountId, tabViewIdRef.current);
      tabViewIdRef.current = newTabViewId;
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