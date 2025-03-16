import { PluginId } from "../../../../plugin/core/types";

// Plugin state interface
export interface PluginState {
  isSelected: boolean;
  isExpanded: boolean;
}

// Navigation store state interface
export interface NavigationState {
  selectedPlugin: PluginId | null;
  pluginStates: Record<PluginId, PluginState>;
}

// Navigation store actions interface
export interface NavigationActions extends NavigationState {
  selectPlugin: (pluginId: PluginId | null) => void;
  togglePluginExpansion: (pluginId: PluginId) => void;
  clearSelection: () => void;
  addPlugin: (pluginId: PluginId) => void;
  removePlugin: (pluginId: PluginId) => void;
}