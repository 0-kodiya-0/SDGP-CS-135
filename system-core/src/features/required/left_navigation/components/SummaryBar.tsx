import { useEffect, useState } from 'react';
import { selectedPluginId, useNavigationStore } from '../store';
import { PluginId, PluginConfig } from '../../../../plugin/core/types';
import { usePlugins } from '../../../../plugin/core/context/pluginContext';
import pluginClient from '../../../../plugin/core/api/pluginClientApi';
import { SummarySection } from './SummarySection';

interface SummaryBarProps {
  className?: string;
}

export function SummaryBar({ className }: SummaryBarProps) {
  const { loadedPlugins, initializePlugins, isInitialized } = usePlugins();
  const [loading, setLoading] = useState(true);
  const selectPlugin = useNavigationStore(state => state.selectPlugin);
  const addPlugin = useNavigationStore(state => state.addPlugin);
  const selectedPlugin = useNavigationStore(selectedPluginId);

  // Initialize plugins when component mounts
  useEffect(() => {
    if (!isInitialized) {
      const init = async () => {
        setLoading(true);
        await initializePlugins();
        setLoading(false);
      };
      init();
    } else {
      setLoading(false);
    }
  }, [isInitialized, initializePlugins]);

  // Add plugins to the navigation store
  useEffect(() => {
    loadedPlugins.forEach(plugin => {
      addPlugin(plugin.id);
    });
  }, [loadedPlugins, addPlugin]);

  // Handle plugin selection
  const handlePluginSelect = (pluginId: PluginId) => {
    if (pluginId === selectedPlugin) {
      return;
    }
    selectPlugin(pluginId);
  };

  // Render plugin icon
  const renderPluginIcon = (plugin: PluginConfig) => {
    if (plugin.icon) {
      // Get the icon URL
      const iconUrl = pluginClient.getAssetUrl(
        plugin.id,
        plugin.icon,
        !!plugin.internalPlugin
      );

      return (
        <img
          src={iconUrl}
          alt={`${plugin.name} icon`}
          className="w-6 h-6"
        />
      );
    }

    // Default icon if no icon is defined
    return (
      <div className="w-6 h-6 bg-gray-300 rounded-md flex items-center justify-center text-gray-600 text-xs font-bold">
        {plugin.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 py-4 flex-shrink-0 ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700" />
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {loadedPlugins.map(plugin => (
            <SummarySection
              key={plugin.id}
              icon={renderPluginIcon(plugin)}
              title={plugin.name}
              featureComponent={null}
              featureType={plugin.id}
              onSelect={handlePluginSelect}
              badgeCount={undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}