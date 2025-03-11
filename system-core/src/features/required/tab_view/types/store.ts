import { Tab, TabView } from "./data.ts";

export interface TabState {
    activeTabViewId: TabView | null;
    activeTabId: Tab | null;
    setActiveTabView: (tabView: TabView | null) => void;
    setActiveTab: (tab: Tab | null) => void;
    resetActiveTab: () => void;
    resetState: () => void; // Add this new action
}