import React, { useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { ScrollingText } from '../../../shared/scrolling_text';
import { useTabStore } from '../store/useTabStore';
import { ItemTypes, DraggedTabItem, DropResult } from '../types/dnd.types';
import { useDrag } from "react-dnd";
import { SerializedTab } from '../types/types.data';

interface TabManagementProps {
  className?: string;
  accountId: string;
  tabViewId: string;
  removeGroup: () => void;
}

interface DraggableTabProps {
  tab: SerializedTab;
  isActive: boolean;
  accountId: string;
  tabViewId: string;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}

const DraggableTab: React.FC<DraggableTabProps> = ({
  tab,
  isActive,
  accountId,
  tabViewId,
  onSelect,
  onClose
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TAB,
    item: (): DraggedTabItem => ({
      type: ItemTypes.TAB,
      id: tab.id,
      title: tab.title,
      componentType: tab.componentType,
      props: tab.props,
      sourceTabViewId: tabViewId,
      accountId
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (!dropResult) return;
      console.log('Tab dropped:', { item, dropResult });
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
  }));

  // Connect the drag ref to our element ref
  drag(ref);

  // Handle tab click - but not when clicking the close button
  const handleTabClick = (e: React.MouseEvent) => {
    // Check if the click was on the close button or its children
    const target = e.target as HTMLElement;
    const closeButton = target.closest('button');
    
    // If we clicked on a button (the close button), don't select the tab
    if (closeButton) {
      return;
    }
    
    onSelect();
  };

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the tab click handler from firing
    onClose(e);
  };

  return (
    <div
      key={tab.id}
      ref={ref}
      className={`
        group relative flex items-center min-w-[100px] max-w-[200px] px-3 py-2 
        border-r border-gray-200 cursor-pointer transition-opacity
        ${isActive ? 'bg-white border-b-2 border-b-blue-500' : 'bg-gray-50'}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      onClick={handleTabClick} // Use our custom handler
    >
      <ScrollingText
        text={tab.title}
        className="text-sm py-2"
      />
      <button
        className="opacity-0 group-hover:opacity-100 ml-2"
        onClick={handleCloseClick} // Use our custom handler
      >
        <X className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  );
};

export const TabManagement: React.FC<TabManagementProps> = ({
  className = '',
  accountId,
  tabViewId,
  removeGroup
}) => {
  const {
    removeTabView,
    getTabsForTabView,
    closeTabInTabView,
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
    closeTabInTabView(accountId, tabViewId, tabId);

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
  }, [accountId, closeTabInTabView, getAllTabViewsForAccount, getTabsForTabView, removeGroup, removeTabView, tabViewId]);

  // Handle tab selection
  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(accountId, tabViewId, tabId);
  }, [accountId, setActiveTab, tabViewId]);

  // Ensure tabViewId is valid before making calls
  if (!tabViewId) {
    return <div key={`tabmgmt-loading-${tabViewId}`} className={`${className} p-2 text-sm text-gray-500`}>Loading tabs...</div>;
  }

  const tabs = getTabsForTabView(accountId, tabViewId);
  const activeTabId = getActiveTabIdForTabView(accountId, tabViewId);

  return (
    <div key={`tabmgmt-${tabViewId}`} className={`flex border-b border-gray-200 ${className}`}>
      {tabs.length === 0 ? (
        <div key={`notabs-${tabViewId}`} className="p-2 text-sm text-gray-500">
          No tabs open
        </div>
      ) : (
        tabs.map((tab) => (
          <DraggableTab
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            accountId={accountId}
            tabViewId={tabViewId}
            onSelect={() => handleTabClick(tab.id)}
            onClose={() => handleCloseTab(tab.id)}
          />
        ))
      )}
    </div>
  );
};

export default TabManagement;