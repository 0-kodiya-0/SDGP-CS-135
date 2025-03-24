import React from 'react';
import { useTabStore } from '../store/useTabStore';
import { ComponentLoader } from '../utils/componentRegistry';

interface TabContentProps {
    className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({ className = '' }) => {
    const tabs = useTabStore((state) => state.tabs);
    const activeTabId = useTabStore((state) => state.activeTabId);
    
    const activeTab = tabs.find(tab => tab.id === activeTabId);

    // Render the appropriate content
    const renderContent = () => {
        if (!activeTab) return null;
        
        // If the content is already a React Node (not restored from storage), use it directly
        if (activeTab.content) {
            return activeTab.content;
        }

        console.log(activeTab)
        
        // If we have componentType, use the ComponentLoader
        if (activeTab.componentType) {
            return (
                <ComponentLoader 
                    componentType={activeTab.componentType} 
                    props={activeTab.props || {}} 
                />
            );
        }
        
        return <div>Unable to restore tab content</div>;
    };

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
                <div className="h-full">{renderContent()}</div>
            )}
        </div>
    );
};

export default TabContent;