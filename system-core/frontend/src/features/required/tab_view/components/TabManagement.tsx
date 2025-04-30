import React from 'react';
import { X } from 'lucide-react';
import { ScrollingText } from '../../../shared/scrolling_text';
import { useTabStore } from '../store/useTabStore';

interface TabManagementProps {
  className?: string;
}

export const TabManagement: React.FC<TabManagementProps> = ({ className = '' }) => {
  // The useTabStore hook now automatically uses the current account
  const { tabs, activeTabId, closeTab, setActiveTab } = useTabStore();

  // Handle tab close
  const handleCloseTab = (tabId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  // Handle tab selection
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

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
                onClick={(e) => handleCloseTab(tab.id, e)}
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