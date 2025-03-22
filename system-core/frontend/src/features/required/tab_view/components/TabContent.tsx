import React from 'react';
import { useTabs } from '../context/TabContext';

interface TabContentProps {
    className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({ className = '' }) => {
    const { tabs, activeTabId } = useTabs();

    const activeTab = tabs.find(tab => tab.id === activeTabId);

    return (
        <div className={`flex-grow overflow-hidden ${className}`}>
            {!activeTab ? (
                <div className="p-4 text-gray-500 flex items-center justify-center h-full">
                    {tabs.length === 0
                        ? "No tabs open. Use addTab function to open a new tab."
                        : "Select a tab to view content"
                    }
                </div>
            ) : (
                <div className="h-full">{activeTab.content}</div>
            )}
        </div>
    );
};

export default TabContent;