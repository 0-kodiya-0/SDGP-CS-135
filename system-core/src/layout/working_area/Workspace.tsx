import React, { useState, useEffect } from 'react';
import { useLayout } from '../layout-context';
import TabView from './expand_view/TabView';
import { TabItem } from './expand_view/types';
import ShortcutBar from './right_navbar/RightNavigationBar';
import SummaryView from './summary_view/SummaryView';
import LeftNavigationBar from './left_navbar/LeftNavigationBar';

export const Workspace: React.FC = () => {
    const {
        getSelectedPlugin,
        selectPlugin,
    } = useLayout();

    const selectedPlugin = getSelectedPlugin();
    const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>('');
    const [plugins, setPlugins] = useState<any[]>([]);

    // Mock plugins for demo purposes
    useEffect(() => {
        setPlugins([
            {
                id: 'plugin-1',
                name: 'Analytics',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTggMjBWMTBNMTIgMjBWNE02IDIwVjE0IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
            },
            {
                id: 'plugin-2',
                name: 'Messages',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjEgMTVhMiAyIDAgMDEtMiAySDdsMC00LTQtNFY1YTIgMiAwIDAxMi0yaDEyYTIgMiAwIDAxMiAyeiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==',
            },
            {
                id: 'plugin-3',
                name: 'Calendar',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCAxMkgxNk04IDE2SDE2TTggOEgxNiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==',
            },
        ]);
    }, []);

    // Handle plugin selection
    const handlePluginSelect = (pluginId: string) => {
        selectPlugin(pluginId);

        // Demo: automatically open a tab when selecting a plugin
        const plugin = plugins.find(p => p.id === pluginId);
        if (plugin) {
            handleOpenTab(`${pluginId}-main`, `${plugin.name} Main`, pluginId);
        }
    };

    // Handle opening a new tab
    const handleOpenTab = (tabId: string, tabName: string, pluginId: string) => {
        if (!openTabs.find(tab => tab.id === tabId)) {
            const newTab = { id: tabId, name: tabName, pluginId };
            setOpenTabs([...openTabs, newTab]);
        }
        setActiveTabId(tabId);
    };

    // Handle closing a tab
    const handleCloseTab = (tabId: string) => {
        setOpenTabs(openTabs.filter(tab => tab.id !== tabId));
        if (activeTabId === tabId && openTabs.length > 1) {
            // Select another tab if the active one is closed
            const tabIndex = openTabs.findIndex(tab => tab.id === tabId);
            const newActiveIndex = tabIndex === 0 ? 1 : tabIndex - 1;
            setActiveTabId(openTabs[newActiveIndex].id);
        } else if (openTabs.length <= 1) {
            // Clear active tab if we're closing the only tab
            setActiveTabId('');
        }
    };

    // Handle tab selection
    const handleTabSelect = (tabId: string) => {
        setActiveTabId(tabId);
    };

    // Handle creating a new tab
    const handleNewTab = () => {
        if (selectedPlugin) {
            const tabCount = openTabs.filter(tab => tab.pluginId === selectedPlugin.id).length;
            handleOpenTab(
                `${selectedPlugin.id}-tab-${tabCount + 1}`,
                `${selectedPlugin.name} Tab ${tabCount + 1}`,
                selectedPlugin.id
            );
        }
    };

    return (
        <div className='w-full flex flex-row'>
            <LeftNavigationBar
                plugins={plugins}
                selectedPluginId={selectedPlugin?.id}
                onPluginSelect={handlePluginSelect}
            />

            <SummaryView
                selectedPlugin={selectedPlugin}
            />

            <TabView
                tabs={openTabs}
                activeTabId={activeTabId}
                onTabSelect={handleTabSelect}
                onTabClose={handleCloseTab}
                onNewTab={selectedPlugin ? handleNewTab : undefined}
            />

            <ShortcutBar />
        </div>
    );
};

export default Workspace;