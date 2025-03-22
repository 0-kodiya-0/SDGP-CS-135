import React from 'react';
import { X } from 'lucide-react';
import { useTabs } from '../../../required/tab_view';

const TabView: React.FC = () => {
  const { tabs, activeTabId, closeTab, setActiveTab } = useTabs();

  if (tabs.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Open Tabs</h3>
          <p className="text-gray-500 max-w-md">
            Select a contact from the list to view details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Header */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-4 py-2 border-r border-gray-200 cursor-pointer min-w-fit max-w-xs ${
              activeTabId === tab.id
                ? 'bg-white border-b-2 border-b-blue-500 -mb-px'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-sm font-medium truncate">{tab.title}</span>
            <button
              className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-full ${activeTabId === tab.id ? 'block' : 'hidden'}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabView;