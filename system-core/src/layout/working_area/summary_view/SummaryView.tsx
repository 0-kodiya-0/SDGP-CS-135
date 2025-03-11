import React, { useState } from 'react';
import { Plugin } from '../layout-context';

interface SummaryViewProps {
    selectedPlugin?: Plugin;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ selectedPlugin }) => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const toggleViewMode = () => {
        setViewMode(current => current === 'list' ? 'grid' : 'list');
    };

    return (
        <div className='w-[30%] flex flex-col items-start justify-center border-r'>
            {/* Options and filters */}
            <div className='w-full h-[10%] p-4 border-b'>
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">{selectedPlugin?.name || 'Select a plugin'}</h2>
                    <div className="flex space-x-2">
                        <button
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.5 3H2.5C2.22386 3 2 3.22386 2 3.5V7.5C2 7.77614 2.22386 8 2.5 8H6.5C6.77614 8 7 7.77614 7 7.5V3.5C7 3.22386 6.77614 3 6.5 3Z" fill="currentColor" />
                                <path d="M13.5 3H9.5C9.22386 3 9 3.22386 9 3.5V7.5C9 7.77614 9.22386 8 9.5 8H13.5C13.7761 8 14 7.77614 14 7.5V3.5C14 3.22386 13.7761 3 13.5 3Z" fill="currentColor" />
                                <path d="M6.5 10H2.5C2.22386 10 2 10.2239 2 10.5V14.5C2 14.7761 2.22386 15 2.5 15H6.5C6.77614 15 7 14.7761 7 14.5V10.5C7 10.2239 6.77614 10 6.5 10Z" fill="currentColor" />
                                <path d="M13.5 10H9.5C9.22386 10 9 10.2239 9 10.5V14.5C9 14.7761 9.22386 15 9.5 15H13.5C13.7761 15 14 14.7761 14 14.5V10.5C14 10.2239 13.7761 10 13.5 10Z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* View */}
            <div className='w-full h-[90%] overflow-auto'>
                {selectedPlugin?.summaryComponent ? (
                    <iframe
                        className="w-full h-full border-0"
                        title={`${selectedPlugin.name} Summary View`}
                    // In a real implementation, you would integrate with the plugin system
                    // to render the component within this iframe
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-gray-300">
                            <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p>Select a plugin to view summary</p>
                        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                            Browse plugins
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SummaryView;