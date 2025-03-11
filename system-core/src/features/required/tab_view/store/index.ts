import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabState } from '../types/store.ts';
import { Tab, TabView } from '../types/data.ts';

export const useTabStore = create<TabState>()(
    persist(
        (set) => ({
            activeTabViewId: null,
            activeTabId: null,

            setActiveTabView: (tabView: TabView | null) =>
                set((state: TabState) => ({
                    ...state,
                    activeTabViewId: tabView,
                    // Reset activeTabId when switching tab views
                    activeTabId: null
                })),

            setActiveTab: (tab: Tab | null) =>
                set((state: TabState) => {
                    // Handle null case first
                    if (!tab) {
                        return { ...state, activeTabId: null };
                    }

                    // Verify tab belongs to current tab view
                    if (!state.activeTabViewId || tab.tabViewId !== state.activeTabViewId.id) {
                        return state;
                    }

                    return {
                        ...state,
                        activeTabId: tab
                    };
                }),

            resetActiveTab: () =>
                set((state: TabState) => ({
                    ...state,
                    activeTabId: null
                })),

            resetState: () =>
                set(() => ({
                    activeTabViewId: null,
                    activeTabId: null
                }))
        }),
        {
            name: 'tab-storage',
            version: 2,
            onRehydrateStorage: () => (state) => {
                // Ensure we have a valid state object
                if (!state) return;

                // Type assertion for compile-time safety
                const tabState = state as TabState;

                // Validate stored state when rehydrating
                if (tabState.activeTabId &&
                    (!tabState.activeTabViewId ||
                        tabState.activeTabId.tabViewId !== tabState.activeTabViewId.id)) {
                    // Use set directly instead of state.resetState
                    return {
                        activeTabViewId: null,
                        activeTabId: null
                    };
                }
            }
        }
    )
);

export const getActiveTabViewId = (state: TabState) => state.activeTabViewId;
export const getActiveTabId = (state: TabState) => state.activeTabId;