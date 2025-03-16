import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PluginId } from '../../../../plugin/core/types';
import { PluginState, NavigationState, NavigationActions } from '../types/types.store';
import { stateLogger } from '../../../../api/logger';

// Create dedicated logger for navigation store
const navStoreLogger = stateLogger.extend('navigation');

// Default plugin state
const DEFAULT_PLUGIN_STATE: PluginState = {
  isSelected: false,
  isExpanded: false,
};

// Initial store state
const INITIAL_STATE: NavigationState = {
  selectedPlugin: null,
  pluginStates: {},
};



// Create the navigation store
export const useNavigationStore = create<NavigationActions>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // Select a plugin
      selectPlugin: (pluginId) => {
        navStoreLogger('Selecting plugin: %s', pluginId);
        
        set((state) => {
          // Create a new state object with all plugins not selected
          const newPluginStates: Record<PluginId, PluginState> = {};
          
          // Copy existing plugin states but mark all as not selected
          Object.keys(state.pluginStates).forEach((id) => {
            newPluginStates[id] = {
              ...state.pluginStates[id],
              isSelected: id === pluginId
            };
          });

          navStoreLogger('Plugin %s selected successfully', pluginId);
          return {
            selectedPlugin: pluginId,
            pluginStates: newPluginStates
          };
        });
      },

      // Toggle a plugin's expansion state
      togglePluginExpansion: (pluginId) => {
        navStoreLogger('Toggling expansion for plugin: %s', pluginId);
        
        set((state) => {
          const pluginState = state.pluginStates[pluginId] || DEFAULT_PLUGIN_STATE;
          const newIsExpanded = !pluginState.isExpanded;
          
          navStoreLogger('Plugin %s expansion toggled to: %s', pluginId, newIsExpanded);
          
          return {
            ...state,
            pluginStates: {
              ...state.pluginStates,
              [pluginId]: {
                ...pluginState,
                isExpanded: newIsExpanded,
              },
            },
          };
        });
      },

      // Clear selected plugin
      clearSelection: () => {
        navStoreLogger('Clearing plugin selection');
        
        set((state) => {
          const newPluginStates: Record<PluginId, PluginState> = {};
          
          // Reset all plugins to not selected
          Object.keys(state.pluginStates).forEach((id) => {
            newPluginStates[id] = {
              ...state.pluginStates[id],
              isSelected: false
            };
          });

          navStoreLogger('Plugin selection cleared successfully');
          return {
            selectedPlugin: null,
            pluginStates: newPluginStates
          };
        });
      },

      // Add a new plugin to the store
      addPlugin: (pluginId) => {
        navStoreLogger('Adding plugin to navigation: %s', pluginId);
        
        set((state) => {
          // Only add if it doesn't already exist
          if (state.pluginStates[pluginId]) {
            navStoreLogger('Plugin %s already exists in navigation, skipping add', pluginId);
            return state;
          }

          navStoreLogger('Plugin %s added to navigation successfully', pluginId);
          return {
            ...state,
            pluginStates: {
              ...state.pluginStates,
              [pluginId]: { ...DEFAULT_PLUGIN_STATE },
            },
          };
        });
      },

      // Remove a plugin from the store
      removePlugin: (pluginId) => {
        navStoreLogger('Removing plugin from navigation: %s', pluginId);
        
        set((state) => {
          if (!state.pluginStates[pluginId]) {
            navStoreLogger('Plugin %s not found in navigation, nothing to remove', pluginId);
            return state;
          }
          
          const newPluginStates = { ...state.pluginStates };
          delete newPluginStates[pluginId];

          // If the deleted plugin was selected, clear selection
          const newSelectedPlugin = 
            state.selectedPlugin === pluginId ? null : state.selectedPlugin;
          
          if (state.selectedPlugin === pluginId) {
            navStoreLogger('Removed plugin %s was selected, clearing selection', pluginId);
          }
          
          navStoreLogger('Plugin %s removed from navigation successfully', pluginId);
          return {
            selectedPlugin: newSelectedPlugin,
            pluginStates: newPluginStates,
          };
        });
      },
    }),
    {
      name: 'navigation-storage',
      version: 1,
      onRehydrateStorage: () => {
        navStoreLogger('Rehydrating navigation store from storage');
        return (state) => {
          if (state) {
            const pluginCount = Object.keys(state.pluginStates).length;
            navStoreLogger('Navigation store rehydrated with %d plugins, selected: %s', 
                          pluginCount, state.selectedPlugin || 'none');
          } else {
            navStoreLogger('Failed to rehydrate navigation store');
          }
        };
      }
    }
  )
);

// Selector to get the selected plugin state
export const selectedPluginState = (state: NavigationState) => 
  state.selectedPlugin ? state.pluginStates[state.selectedPlugin] : DEFAULT_PLUGIN_STATE;

// Selector to get the selected plugin ID
export const selectedPluginId = (state: NavigationState) => state.selectedPlugin;