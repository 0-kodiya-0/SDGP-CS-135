import React, { useEffect } from 'react';
import { useTabStore } from '../store';
import { TabManagement } from './TabManagement';
import { Environment } from '../../../default/environment/types/types.data';
import ExpandViewExecutor from '../../../../plugin/core/executors/expandViewExecutor';
import usePluginTab from '../hooks/usePluginTab';

interface TabViewProps {
  environment: Environment;
  className?: string;
}

export const TabView: React.FC<TabViewProps> = ({ environment, className }) => {
  const { setActiveEnvironment } = useTabStore();
  const { tabs, activeTab } = usePluginTab({ environmentId: environment.id });

  // Handle environment change
  useEffect(() => {
    if (environment.id) {
      setActiveEnvironment(environment.id);
    }
  }, [environment.id, setActiveEnvironment]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Bar */}
      <TabManagement 
        environmentId={environment.id}
        className="flex-shrink-0"
      />
      
      {/* Tab Content */}
      <div className="flex-grow overflow-hidden">
        {activeTab ? (
          <ExpandViewExecutor
            pluginId={activeTab.pluginId}
            config={activeTab.config}
            permissions={activeTab.config.permissions || {}}
            viewId={`tab-${activeTab.id}`}
            environmentId={environment.id}
            tabId={activeTab.id}
          />
        ) : (
          <div className="p-4 text-gray-500 flex items-center justify-center h-full">
            {tabs.length === 0
              ? "No tabs open. Select a plugin to open a new tab."
              : "Select a tab to view content"
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TabView;