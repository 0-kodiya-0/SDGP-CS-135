import { PluginConfig } from "../../../../plugin/core";

// Define a Tab structure for our client-side state
export interface PluginTab {
  id: string; // Client-generated unique ID
  pluginId: string; // ID of the plugin
  title: string; // Display title for the tab
  config: PluginConfig; // Full plugin configuration
  state: Record<string, unknown>; // Optional state for the tab
  createdAt: number; // Timestamp for creation order
}

// Define a TabView structure for client-side
export interface ClientTabView {
  id: string; // Client-generated unique ID
  environmentId: number; // Associated environment ID
  tabs: PluginTab[]; // Tabs in this view
  createdAt: number; // Creation timestamp
}

export interface TabState {
  // Store all tab views indexed by environment ID
  tabViews: Record<number, ClientTabView>;
  
  // Track active tab
  activeTabViewId: string | null;
  activeTabId: string | null;
  
  // Actions
  createTabView: (environmentId: number) => string;
  addTab: (environmentId: number, plugin: PluginConfig, state?: Record<string, unknown>) => string;
  closeTab: (environmentId: number, tabId: string) => void;
  setActiveTab: (tabViewId: string, tabId: string) => void;
  updateTabState: (environmentId: number, tabId: string, state: Record<string, unknown>) => void;
  
  // Environment change handling
  setActiveEnvironment: (environmentId: number) => void;
  clearActiveTab: () => void;
}