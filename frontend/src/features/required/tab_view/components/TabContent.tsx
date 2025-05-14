import React, { useCallback } from 'react';
import { ComponentLoader } from '../utils/componentRegistry';
import { useTabStore } from '../store/useTabStore';
import { SerializedTab } from '../types/types.data';

interface TabContentProps {
    className?: string;
    accountId: string;
    tabViewId: string;
}

export const TabContent: React.FC<TabContentProps> = ({
    className = '',
    accountId,
    tabViewId
}) => {
    const {
        getTabsForTabView,
        getActiveTabIdForTabView
    } = useTabStore();

    // Render the appropriate content
    const renderContent = useCallback((activeTab: SerializedTab | undefined) => {
        if (!activeTab) return null;

        // If we have componentType, use the ComponentLoader
        if (activeTab.componentType) {
            return (
                <ComponentLoader
                    key={`component-${activeTab.id}`}
                    componentType={activeTab.componentType}
                    props={{ ...activeTab.props, accountId, tabViewId, tabId: activeTab }}
                />
            );
        }

        return <div key={`error-${activeTab.id}`}>Unable to restore tab content</div>;
    }, [accountId, tabViewId]);

    // Ensure tabViewId is valid before making calls
    if (!tabViewId) {
        return (
            <div key={`loading-${tabViewId}`} className={`flex-grow overflow-hidden ${className}`}>
                <div className="p-4 text-gray-500 flex items-center justify-center h-full">
                    Loading content...
                </div>
            </div>
        );
    }

    const tabs = getTabsForTabView(accountId, tabViewId);
    const activeTabId = getActiveTabIdForTabView(accountId, tabViewId);

    const activeTab = tabs.find(tab => tab.id === activeTabId);

    return (
        <div key={`tabcontent-${tabViewId}`} className={`flex-grow overflow-hidden ${className}`}>
            {!activeTab ? (
                <div key={`empty-${tabViewId}`} className="p-4 text-gray-500 flex items-center justify-center h-full">
                    {tabs.length === 0
                        ? "No tabs open. Use addTab function to open a new tab."
                        : "Select a tab to view content"
                    }
                </div>
            ) : (
                <div key={`content-${activeTab.id}`} className="h-full">{renderContent(activeTab)}</div>
            )}
        </div>
    );
};

export default TabContent;