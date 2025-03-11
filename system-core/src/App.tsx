// src/App.tsx
import React, { useState } from 'react';
import { PluginProvider } from './plugin/core/context/pluginContext';
import PluginManagerUI from './plugin/core/ui/PluginManagerUI';
import SummaryViewExecutor from './plugin/core/executors/summaryViewExecutor';
import ExpandViewExecutor from './plugin/core/executors/expandViewExecutor';
import pluginRegistry from './plugin/core/pluginRegistry';
import { usePlugins } from './plugin/core/context/pluginContext';

/**
 * PluginRenderer component
 * Manages plugin UI rendering
 */
const PluginRenderer: React.FC = () => {
  const { activePluginIds } = usePlugins();
  const [visiblePlugins, setVisiblePlugins] = useState<{
    [key: string]: {
      view: 'summary' | 'expand' | null;
    }
  }>({});

  // Toggle a plugin's view
  const togglePluginView = (pluginId: string, view: 'summary' | 'expand' | null) => {
    setVisiblePlugins(prev => ({
      ...prev,
      [pluginId]: {
        view
      }
    }));
  };

  // Render active plugins
  return (
    <div className="plugin-renderer">
      <div className="active-plugins">
        <h3>Active Plugins</h3>
        <div className="plugin-buttons">
          {activePluginIds.map(pluginId => {
            const config = pluginRegistry.getPluginConfig(pluginId);
            const permissions = pluginRegistry.getPluginPermissions(pluginId);

            if (!config || !permissions) return null;

            const currentView = visiblePlugins[pluginId]?.view || null;

            return (
              <div key={pluginId} className="plugin-button-container">
                <button
                  className="plugin-button"
                  onClick={() => {
                    // Toggle between summary and null
                    const newView = currentView === 'summary' ? null : 'summary';
                    togglePluginView(pluginId, newView);
                  }}
                >
                  {config.name || pluginId}
                </button>

                {config.view?.expand && (
                  <button
                    className="plugin-expand-button"
                    onClick={() => {
                      // Toggle between expand and null
                      const newView = currentView === 'expand' ? null : 'expand';
                      togglePluginView(pluginId, newView);
                    }}
                  >
                    {currentView === 'expand' ? 'Minimize' : 'Expand'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="plugin-views">
        {activePluginIds.map(pluginId => {
          const view = visiblePlugins[pluginId]?.view;
          if (!view) return null;

          const config = pluginRegistry.getPluginConfig(pluginId);
          const permissions = pluginRegistry.getPluginPermissions(pluginId);

          if (!config || !permissions) return null;

          if (view === 'summary' && config.view?.summary) {
            return (
              <SummaryViewExecutor
                key={`${pluginId}-summary`}
                pluginId={pluginId}
                config={config}
                permissions={permissions}
                onClose={() => togglePluginView(pluginId, null)}
              />
            );
          }

          if (view === 'expand' && config.view?.expand) {
            return (
              <ExpandViewExecutor
                key={`${pluginId}-expand`}
                pluginId={pluginId}
                config={config}
                permissions={permissions}
                onClose={() => togglePluginView(pluginId, null)}
                onMinimize={() => togglePluginView(pluginId, 'summary')}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

/**
 * Main App component
 */
const App: React.FC = () => {
  const [showPluginManager, setShowPluginManager] = useState(false);

  return (
    <PluginProvider>
      <div className="app-container">
        <header className="app-header">
          <h1>Plugin System Demo</h1>
          <button
            className="toggle-plugin-manager"
            onClick={() => setShowPluginManager(!showPluginManager)}
          >
            {showPluginManager ? 'Hide Plugin Manager' : 'Show Plugin Manager'}
          </button>
        </header>

        <main className="app-content">
          {showPluginManager ? (
            <div className="plugin-manager-container">
              <PluginManagerUI />
            </div>
          ) : (
            <div className="app-main-content">
              <h2>Main Application</h2>
              <p>This is the main application content. Plugin views will be rendered here.</p>
              <PluginRenderer />
            </div>
          )}
        </main>

        <footer className="app-footer">
          <p>&copy; 2025 Plugin System Demo</p>
        </footer>
      </div>
    </PluginProvider>
  );
};

export default App;