import React, { useEffect, useState } from 'react';
import { usePlugins } from '../context/pluginContext';
import { PluginId, ExtendedPluginStatus } from '../types';
import pluginRegistry from '../pluginRegistry';

interface PluginListItemProps {
    pluginId: PluginId;
    onApprove: (pluginId: PluginId) => void;
    onExecute: (pluginId: PluginId) => void;
    onStop: (pluginId: PluginId) => void;
    onUnregister: (pluginId: PluginId) => void;
}

/**
 * Component for individual plugin list item
 */
const PluginListItem: React.FC<PluginListItemProps> = ({
    pluginId,
    onApprove,
    onExecute,
    onStop,
    onUnregister
}) => {
    const { getPluginStatus, isPluginActive } = usePlugins();
    const [status, setStatus] = useState<ExtendedPluginStatus | null>(null);
    const [loading, setLoading] = useState(true);

    // Load plugin status
    useEffect(() => {
        const loadStatus = async () => {
            setLoading(true);
            const pluginStatus = await getPluginStatus(pluginId);
            setStatus(pluginStatus);
            setLoading(false);
        };

        loadStatus();

        // Poll for updates every 2 seconds
        const interval = setInterval(loadStatus, 2000);
        return () => clearInterval(interval);
    }, [pluginId, getPluginStatus]);

    if (loading || !status) {
        return (
            <div className="p-4 bg-gray-100 rounded-md animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
        );
    }

    const config = pluginRegistry.getPluginConfig(pluginId);
    const isActive = isPluginActive(pluginId);

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm mb-4">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-800">{config?.name || pluginId}</h3>
                <div className="flex flex-wrap gap-2">
                    {status.isRegistered && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            Registered
                        </span>
                    )}
                    {status.isApproved && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Approved
                        </span>
                    )}
                    {isActive && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                            Active
                        </span>
                    )}
                </div>
            </div>

            <div className="text-gray-600 text-sm mb-2">
                {config?.description || 'No description available'}
            </div>

            <div className="text-gray-500 text-xs mb-4">
                Version: {config?.version || 'Unknown'}
            </div>

            <div className="flex flex-wrap gap-2">
                {!status.isApproved && (
                    <button
                        className={`px-3 py-1.5 rounded text-sm font-medium ${
                            status.isRegistered
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        } transition-colors`}
                        onClick={() => onApprove(pluginId)}
                        disabled={!status.isRegistered}
                    >
                        Approve
                    </button>
                )}

                {status.isApproved && !isActive && config?.background && (
                    <button
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
                        onClick={() => onExecute(pluginId)}
                    >
                        Execute
                    </button>
                )}

                {isActive && (
                    <button
                        className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 transition-colors"
                        onClick={() => onStop(pluginId)}
                    >
                        Stop
                    </button>
                )}

                <button
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                        isActive
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                    } transition-colors`}
                    onClick={() => onUnregister(pluginId)}
                    disabled={isActive}
                >
                    Unregister
                </button>
            </div>
        </div>
    );
};

/**
 * Plugin Manager UI component
 * Displays a list of available plugins with controls
 */
const PluginManagerUI: React.FC = () => {
    const {
        loadedPlugins,
        activePluginIds,
        initializePlugins,
        approvePlugin,
        executePlugin,
        stopPlugin,
        unregisterPlugin
    } = usePlugins();

    const [initialized, setInitialized] = useState(false);

    // Initialize plugins on mount
    useEffect(() => {
        const init = async () => {
            await initializePlugins();
            setInitialized(true);
        };

        if (!initialized) {
            init();
        }
    }, [initializePlugins, initialized]);

    // Handle approve plugin
    const handleApprove = async (pluginId: PluginId) => {
        const success = await approvePlugin(pluginId);
        if (success) {
            console.log(`Plugin ${pluginId} approved successfully`);
        } else {
            console.error(`Failed to approve plugin ${pluginId}`);
        }
    };

    // Handle execute plugin
    const handleExecute = async (pluginId: PluginId) => {
        const success = await executePlugin(pluginId);
        if (success) {
            console.log(`Plugin ${pluginId} executed successfully`);
        } else {
            console.error(`Failed to execute plugin ${pluginId}`);
        }
    };

    // Handle stop plugin
    const handleStop = async (pluginId: PluginId) => {
        const success = await stopPlugin(pluginId);
        if (success) {
            console.log(`Plugin ${pluginId} stopped successfully`);
        } else {
            console.error(`Failed to stop plugin ${pluginId}`);
        }
    };

    // Handle unregister plugin
    const handleUnregister = async (pluginId: PluginId) => {
        const success = await unregisterPlugin(pluginId);
        if (success) {
            console.log(`Plugin ${pluginId} unregistered successfully`);
        } else {
            console.error(`Failed to unregister plugin ${pluginId}`);
        }
    };

    // Get registered plugin IDs
    const registeredPluginIds = pluginRegistry.getRegisteredPluginIds();

    return (
        <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Plugin Manager</h2>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4">
                <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md">
                    <span className="font-medium">Loaded:</span> {loadedPlugins.length}
                </div>
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
                    <span className="font-medium">Registered:</span> {registeredPluginIds.length}
                </div>
                <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-md">
                    <span className="font-medium">Active:</span> {activePluginIds.length}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Loaded Plugins</h3>
                {loadedPlugins.length === 0 ? (
                    <p className="text-gray-500 italic">No plugins loaded</p>
                ) : (
                    <div className="space-y-4">
                        {loadedPlugins.map(plugin => (
                            <PluginListItem
                                key={plugin.id}
                                pluginId={plugin.id}
                                onApprove={handleApprove}
                                onExecute={handleExecute}
                                onStop={handleStop}
                                onUnregister={handleUnregister}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PluginManagerUI;