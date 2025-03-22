import React, { createContext, useContext, useState, useCallback } from 'react';
import { Tab, TabContextType } from '../types/types.data';

// Create Context
const TabContext = createContext<TabContextType | undefined>(undefined);

// Generate unique ID
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// TabProvider Component
export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    // Add new tab
    const addTab = useCallback((title: string, content: React.ReactNode): string => {
        const newTabId = generateId();

        // Check if a tab with this title already exists
        const existingTab = tabs.find(tab => tab.title === title);
        if (existingTab) {
            setActiveTabId(existingTab.id);
            return existingTab.id;
        }

        const newTab: Tab = {
            id: newTabId,
            title,
            content
        };

        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTabId);
        return newTabId;
    }, [tabs]);

    // Close tab
    const closeTab = useCallback((tabId: string): void => {
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;

        // If closing active tab, select next or previous tab
        if (activeTabId === tabId) {
            const nextTab = tabs[tabIndex + 1] || tabs[tabIndex - 1];
            setActiveTabId(nextTab?.id || null);
        }

        setTabs(prev => prev.filter(tab => tab.id !== tabId));
    }, [tabs, activeTabId]);

    // Update existing tab
    const updateTab = useCallback((tabId: string, updates: Partial<Omit<Tab, 'id'>>): void => {
        setTabs(prev => prev.map(tab =>
            tab.id === tabId
                ? { ...tab, ...updates }
                : tab
        ));
    }, []);

    const value = {
        tabs,
        activeTabId,
        addTab,
        updateTab,
        closeTab,
        setActiveTab: setActiveTabId
    };

    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
};

// Custom hook to use tab context
export const useTabs = (): TabContextType => {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
};