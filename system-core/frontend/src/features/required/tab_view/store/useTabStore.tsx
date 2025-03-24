import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tab, SerializedTab } from '../types/types.data';
import { ComponentLoader } from '../utils/componentRegistry';

interface TabState {
    tabs: Tab[];
    activeTabId: string | null;
    addTab: (title: string, content: React.ReactNode, componentType?: string, props?: Record<string, any>) => string;
    updateTab: (tabId: string, updates: Partial<Omit<Tab, 'id'>>) => void;
    closeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    restoreContent: (tab: SerializedTab) => React.ReactNode | null;
}

// Generate unique ID
const generateId = (): string =>
    `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useTabStore = create<TabState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,

            addTab: (title, content, componentType, props = {}) => {
                console.log(componentType)
                const { tabs } = get();

                // Check if a tab with this title already exists
                const existingTab = tabs.find(tab => tab.title === title);
                if (existingTab) {
                    set({ activeTabId: existingTab.id });
                    return existingTab.id;
                }

                const newTabId = generateId();
                const newTab: Tab = {
                    id: newTabId,
                    title,
                    content, // This will be null when serialized
                    componentType, // Store the component type for later restoration
                    props // Store props for later restoration
                };

                set(state => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: newTabId
                }));

                return newTabId;
            },

            closeTab: (tabId) => {
                const { tabs, activeTabId } = get();
                const tabIndex = tabs.findIndex(tab => tab.id === tabId);

                if (tabIndex === -1) return;

                // If closing active tab, select next or previous tab
                if (activeTabId === tabId) {
                    const nextTab = tabs[tabIndex + 1] || tabs[tabIndex - 1];
                    set({ activeTabId: nextTab?.id || null });
                }

                set(state => ({
                    tabs: state.tabs.filter(tab => tab.id !== tabId)
                }));
            },

            updateTab: (tabId, updates) => {
                set(state => ({
                    tabs: state.tabs.map(tab =>
                        tab.id === tabId ? { ...tab, ...updates } : tab
                    )
                }));
            },

            setActiveTab: (tabId) => {
                set({ activeTabId: tabId });
            },

            restoreContent: (tab) => {
                if (!tab.componentType) return null;
                
                // Use the ComponentLoader to dynamically load the component
                return (
                    <ComponentLoader 
                        componentType={tab.componentType} 
                        props={tab.props || {}} 
                    />
                );
            }
        }),
        {
            name: 'tab-storage', // Name for the localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => {
                // Convert Tab objects to serializable format before storing
                const serializableTabs = state.tabs.map(tab => ({
                    id: tab.id,
                    title: tab.title,
                    componentType: tab.componentType,
                    props: tab.props,
                    // content is React node and cannot be serialized
                }));
                
                return {
                    tabs: serializableTabs,
                    activeTabId: state.activeTabId
                };
            },
        }
    )
);