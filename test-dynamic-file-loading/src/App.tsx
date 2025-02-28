// src/App.tsx
import React, { useEffect, useState } from 'react';
import { LoadedPlugin } from './plugin/types/plugin.types';
import PluginLoader from './services/pluginLoader';
import PluginRenderer from './components/PluginRenderer';

const App: React.FC = () => {
    const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
    const [activePluginId, setActivePluginId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isProduction = import.meta.env.PROD;

    useEffect(() => {
        const pluginLoader = new PluginLoader();

        const loadPlugins = async () => {
            try {
                setLoading(true);
                const loadedPlugins = await pluginLoader.loadAllPlugins();
                setPlugins(loadedPlugins);
                
                // Set the first plugin as active by default if available
                if (loadedPlugins.length > 0) {
                    setActivePluginId(loadedPlugins[0].id);
                }
                
                setError(null);
            } catch (err) {
                setError(`Failed to load plugins: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        loadPlugins();

        // Clean up plugins when component unmounts
        return () => {
            pluginLoader.unloadAllPlugins();
        };
    }, []);

    // Get the currently active plugin
    const activePlugin = plugins.find(plugin => plugin.id === activePluginId);

    // Handle plugin selection
    const handlePluginSelect = (pluginId: string) => {
        setActivePluginId(pluginId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg font-semibold">Loading plugins...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            </div>
        );
    }

    if (plugins.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg font-semibold">No plugins found.</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Plugin System Demo</h1>
            
            {/* Environment indicator */}
            {!isProduction && (
                <div className="mb-4 p-2 bg-amber-100 border border-amber-300 text-amber-800 rounded">
                    <strong>Development Mode</strong> - Some features may use fallback implementations
                </div>
            )}
            
            {/* Plugin Selector */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Available Plugins</h2>
                <div className="flex flex-wrap gap-2">
                    {plugins.map(plugin => (
                        <button
                            key={plugin.id}
                            onClick={() => handlePluginSelect(plugin.id)}
                            className={`px-4 py-2 rounded transition-colors flex items-center ${
                                activePluginId === plugin.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            <span>{plugin.name}</span>
                            {!plugin.hasUI && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-700 text-white">
                                    No UI
                                </span>
                            )}
                            {plugin.isDevelopmentMock && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-500 text-white">
                                    Mock
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Active Plugin Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">
                    {activePlugin ? `Active Plugin: ${activePlugin.name}` : 'No plugin selected'}
                    {activePlugin?.isDevelopmentMock && (
                        <span className="ml-2 text-sm px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            Development Mock
                        </span>
                    )}
                </h2>
                
                {activePlugin ? (
                    <PluginRenderer plugin={activePlugin} />
                ) : (
                    <div className="text-gray-500">Please select a plugin from above.</div>
                )}
            </div>
            
            {/* Plugin Information */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Plugin Information</h2>
                <div className="space-y-4">
                    {plugins.map(plugin => (
                        <div 
                            key={plugin.id} 
                            className={`p-4 rounded-lg border ${
                                activePluginId === plugin.id
                                    ? 'border-blue-300 bg-blue-50'
                                    : 'border-gray-200'
                            }`}
                        >
                            <h3 className="font-bold flex items-center">
                                {plugin.name}
                                {plugin.isDevelopmentMock && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-500 text-white">
                                        Mock
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-600">{plugin.config.description || 'No description'}</p>
                            <div className="mt-2 text-xs text-gray-500">
                                <p>ID: {plugin.id}</p>
                                <p>Version: {plugin.config.version || 'Unknown'}</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {plugin.hasUI && (
                                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">
                                            UI Component
                                        </span>
                                    )}
                                    {plugin.hasBackground && (
                                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                            Background Process
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                        Worker
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Development Environment Info */}
            {!isProduction && (
                <div className="mt-6 bg-amber-50 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Development Environment</h2>
                    <p className="mb-2">
                        You're currently running in development mode. Some features may use fallback implementations
                        to ensure the UI works properly during development.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Mock components may be used when actual plugins can't be loaded</li>
                        <li>UI components may use alternative import strategies</li>
                        <li>Some plugin data may be simulated</li>
                    </ul>
                    <p className="mt-4 text-sm">
                        Use <code className="bg-gray-100 px-1 py-0.5 rounded">npm run build</code> to create a production build with full plugin functionality.
                    </p>
                </div>
            )}
        </div>
    );
};

export default App;