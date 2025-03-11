import React, { useCallback } from 'react';
import { useTabStore } from '../store';
import { useTabs, useDeleteTab } from '../hooks/useTabQueries.ts';
import { ScrollingText } from '../../../shared/scrolling_text';
import { X } from 'lucide-react';
import { TabView } from '../types/data.ts';

interface TabManagementProps {
    tabView: TabView;
    className?: string;
}

export const TabManagement: React.FC<TabManagementProps> = ({
    tabView,
    className
}) => {
    const { activeTabId, setActiveTab } = useTabStore();

    const {
        data: tabs = [],
        isLoading: isLoadingTabs,
        error: tabsError
    } = useTabs(tabView.id);

    const deleteTabMutation = useDeleteTab(tabView.id);

    // In the close handler
    const handleCloseTab = useCallback((tabId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        if (deleteTabMutation.isPending) {
            return;
        }

        deleteTabMutation.mutate(tabId);
    }, [tabs, deleteTabMutation.isPending]);

    if (isLoadingTabs || deleteTabMutation.isPending) {
        return (
            <div className="flex items-center justify-center h-8">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (tabsError) {
        return (
            <div className="h-8 flex items-center justify-center text-red-500">
                Failed to load tabs
            </div>
        );
    }

    return (
        <div className={`flex border-b border-gray-200 ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTabId?.id === tab.id && activeTabId?.tabViewId === tabView.id;
                return (
                    <div
                        key={tab.id}
                        className={`
                            group relative flex items-center min-w-[100px] max-w-[200px] px-3 py-2 
                            border-r border-gray-200 cursor-pointer
                            ${isActive ? 'bg-white border-b-2 border-b-blue-500' : 'bg-gray-50'}
                        `}
                        onClick={() => setActiveTab(tab)}
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
                )
            })}
        </div>
    );
};