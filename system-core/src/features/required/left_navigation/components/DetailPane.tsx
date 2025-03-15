import { useCallback, useEffect, useState } from 'react';
import { selectedPluginId, useNavigationStore } from '../store';
import { Environment } from '../../../default/environment/types/types.data.ts';
import { PluginId } from '../../../../plugin/core/types';
import { usePlugins } from '../../../../plugin/core/context/pluginContext';
import SummaryViewExecutor from '../../../../plugin/core/executors/summaryViewExecutor';
import { usePluginTab } from '../../tab_view/hooks/usePluginTab.ts';
import { ArrowUpRight } from 'lucide-react';

interface DetailPaneProps {
  environment: Environment;
  className?: string;
}

export function DetailPane({ environment, className }: DetailPaneProps) {
  const selectedPlugin = useNavigationStore(selectedPluginId);
  const [selectedPluginBefore, setSelectedPluginBefore] = useState<PluginId | null>(null);
  const clearSelection = useNavigationStore(state => state.clearSelection);
  const { loadedPlugins } = usePlugins();
  const { openPluginTab } = usePluginTab({ environmentId: environment.id });

  // Handle selection changes
  useEffect(() => {
    if (!selectedPluginBefore) {
      setSelectedPluginBefore(selectedPlugin);
      return;
    }

    if (selectedPlugin !== selectedPluginBefore) {
      clearSelection();
      setSelectedPluginBefore(selectedPlugin);
    }
  }, [selectedPlugin, selectedPluginBefore, clearSelection]);

  // Find the selected plugin config
  const selectedPluginConfig = selectedPlugin
    ? loadedPlugins.find(plugin => plugin.id === selectedPlugin)
    : null;

  // Handle opening plugin in a tab
  const handleOpenInTab = useCallback(() => {
    if (selectedPluginConfig) {
      openPluginTab(selectedPluginConfig);
    }
  }, [selectedPluginConfig, openPluginTab]);

  // Render content based on selection
  const renderContent = () => {
    if (!selectedPlugin || !selectedPluginConfig) {
      return (
        <div className="text-sm text-gray-500 flex items-center justify-center h-full">
          Select a plugin to view its details
        </div>
      );
    }

    // Check if the plugin has a summary view
    if (!selectedPluginConfig.view?.summary?.entryPoint) {
      return (
        <div className="text-sm text-gray-500 p-4">
          Summary view for {selectedPluginConfig.name} is not available
        </div>
      );
    }

    console.log(selectedPluginConfig)
    
    // Use SummaryViewExecutor to display the plugin's summary view
    return (
      <SummaryViewExecutor
        pluginId={selectedPlugin}
        config={selectedPluginConfig}
        permissions={selectedPluginConfig.permissions || {}}
        viewId={`detail-summary-${selectedPlugin}`}
        environmentId={environment.id}
      />
    );
  };

  // Get plugin name for display
  const getDisplayName = (): string => {
    if (selectedPluginConfig) return selectedPluginConfig.name;
    return '';
  };

  // Check if plugin has an expand view
  const hasExpandView = selectedPluginConfig?.view?.expand?.entryPoint;

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${className}`}
    >
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center px-2 flex-shrink-0 overflow-hidden justify-between">
        <div className={`transition-opacity duration-300`}>
          <span className="ml-2 text-sm font-medium text-gray-900 truncate">
            {getDisplayName()}
          </span>
        </div>

        {/* Button to open in tab if plugin has expand view */}
        {hasExpandView && selectedPluginConfig && (
          <button
            onClick={handleOpenInTab}
            className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 flex items-center"
            title="Open in tab"
          >
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Open in Tab
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 p-4 opacity-100 w-full 
                custom-scrollbar
            `}
      >
        {renderContent()}
      </div>
    </div>
  );
}