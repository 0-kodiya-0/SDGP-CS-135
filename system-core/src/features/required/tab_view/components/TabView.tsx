import React, { useEffect } from 'react';
import { useTabStore } from '../store';
import { useTabViews, useCreateTabView, useTabs } from '../hooks/useTabQueries.ts';
import TabContent from './TabContent.tsx';
import { TabManagement } from './TabManagement.tsx';
import { useWorkspaceStore } from '../../../default/workspace';
import { Environment } from '../../../default/environment/types/data.ts';

interface TabViewProps {
    environment: Environment
    className?: string;
}

export const TabView: React.FC<TabViewProps> = ({ environment, className }) => {
    const selectedWorkspaceId = useWorkspaceStore(state => state.selectedWorkspaceIds[environment.id]);

    const {
        activeTabViewId,
        setActiveTabView,
        activeTabId,
        resetActiveTab
    } = useTabStore();

    const {
        data: tabViews,
        isLoading: isLoadingTabViews,
        error: tabViewsError
    } = useTabViews(environment.id);

    const createTabViewMutation = useCreateTabView(environment.id);
    const { data: tabs = [] } = useTabs(activeTabViewId ? activeTabViewId.id : null);

    // Handle automatic TabView creation and selection
    useEffect(() => {
        if (!environment.id || isLoadingTabViews) return;

        const existingTabView = tabViews?.find(tv => tv.environmentId === environment.id);

        if (existingTabView) {
            setActiveTabView(existingTabView);
        } else if (!createTabViewMutation.isPending && selectedWorkspaceId) {
            createTabViewMutation.mutate({
                environmentId: environment.id,
                workspaceId: selectedWorkspaceId
            });
        }
    }, [environment.id, tabViews, isLoadingTabViews]);

    // Rest of the component remains the same...
    // Reset active tab when environment changes
    useEffect(() => {
        resetActiveTab();
    }, [environment.id]);

    if (!environment.id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Please select an environment</div>
            </div>
        );
    }

    if (isLoadingTabViews || createTabViewMutation.isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (tabViewsError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-red-500">Failed to load tab views</div>
            </div>
        );
    }

    if (!activeTabViewId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Initializing tab view...</div>
            </div>
        );
    }

    const activeTab = tabs.find(tab => tab.id === activeTabId?.id);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <TabManagement
                tabView={activeTabViewId}
                className="flex-shrink-0"
            />
            <div className="flex-grow overflow-hidden">
                {activeTab ? (
                    <TabContent tab={activeTab} />
                ) : (
                    <div className="p-4 text-gray-500">
                        {tabs.length === 0
                            ? "No tabs available. Create a new tab to get started."
                            : "Select a tab to view content"
                        }
                    </div>
                )}
            </div>
        </div>
    );
};