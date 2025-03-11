import React from 'react';
import { TabItem } from './types';

interface TabViewProps {
    tabs: TabItem[];
    activeTabId: string;
    onTabSelect: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onNewTab?: () => void;
}

export const TabView: React.FC<TabViewProps> = ({
    tabs,
    activeTabId,
    onTabSelect,
    onTabClose,
    onNewTab
}) => {
    return (
        <div className='w-[55%] flex flex-col items-start justify-center'>
            {/* Tab selection */}
            <div className='w-full h-[10%] border-b'>
                <div className="flex overflow-x-auto h-full">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`flex items-center h-full px-4 border-r whitespace-nowrap cursor-pointer ${activeTabId === tab.id ? 'bg-white border-b-2 border-b-blue-500' : 'bg-gray-50'
                                }`}
                            onClick={() => onTabSelect(tab.id)}
                        >
                            <span className="mr-2">{tab.name}</span>
                            <button
                                className="p-1 rounded-full hover:bg-gray-200"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabClose(tab.id);
                                }}
                                aria-label={`Close ${tab.name} tab`}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {/* Add new tab button */}
                    {tabs.length > 0 && onNewTab && (
                        <button
                            className="px-3 h-full border-r bg-gray-50 hover:bg-gray-100"
                            onClick={onNewTab}
                            aria-label="Add new tab"
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Tab content view */}
            <div className='w-full h-[90%] overflow-auto'>
                {tabs.length > 0 && activeTabId ? (
                    <iframe
                        className="w-full h-full border-0"
                        title={`Tab Content: ${tabs.find(tab => tab.id === activeTabId)?.name}`}
                    // In a real implementation, you would integrate with the plugin system
                    // to render the component within this iframe based on the activeTabId
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-gray-300">
                            <path d="M3 8H21M10 12H21M3 16H21M3 20H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 3V5M16 3V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p>No tabs open</p>
                        <p className="text-sm mt-2">Open a plugin from the left sidebar to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabView;