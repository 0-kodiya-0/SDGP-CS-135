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
        return <div className="plugin-list-item loading">Loading plugin info...</div>;
    }

    const config = pluginRegistry.getPluginConfig(pluginId);
    const isActive = isPluginActive(pluginId);

    return (
        <div className="plugin-list-item">
            <div className="plugin-header">
                <h3>{config?.name || pluginId}</h3>
                <div className="plugin-status">
                    {status.isRegistered ? <span className="status-badge registered">Registered</span> : null}
                    {status.isApproved ? <span className="status-badge approved">Approved</span> : null}
                    {isActive ? <span className="status-badge active">Active</span> : null}
                </div>
            </div>

            <div className="plugin-description">
                {config?.description || 'No description available'}
            </div>

            <div className="plugin-version">
                Version: {config?.version || 'Unknown'}
            </div>

            <div className="plugin-actions">
                {!status.isApproved && (
                    <button
                        className="approve-button"
                        onClick={() => onApprove(pluginId)}
                        disabled={!status.isRegistered}
                    >
                        Approve
                    </button>
                )}

                {status.isApproved && !isActive && config?.background && (
                    <button
                        className="execute-button"
                        onClick={() => onExecute(pluginId)}
                    >
                        Execute
                    </button>
                )}

                {isActive && (
                    <button
                        className="stop-button"
                        onClick={() => onStop(pluginId)}
                    >
                        Stop
                    </button>
                )}

                <button
                    className="unregister-button"
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
        <div className="plugin-manager-ui">
            <h2>Plugin Manager</h2>

            <div className="plugin-status-summary">
                <div className="status-count">
                    <span>Loaded: {loadedPlugins.length}</span>
                </div>
                <div className="status-count">
                    <span>Registered: {registeredPluginIds.length}</span>
                </div>
                <div className="status-count">
                    <span>Active: {activePluginIds.length}</span>
                </div>
            </div>

            <div className="plugin-list">
                <h3>Loaded Plugins</h3>
                {loadedPlugins.length === 0 ? (
                    <p>No plugins loaded</p>
                ) : (
                    loadedPlugins.map(plugin => (
                        <PluginListItem
                            key={plugin.id}
                            pluginId={plugin.id}
                            onApprove={handleApprove}
                            onExecute={handleExecute}
                            onStop={handleStop}
                            onUnregister={handleUnregister}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default PluginManagerUI;