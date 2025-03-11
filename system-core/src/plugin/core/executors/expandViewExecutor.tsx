import React, { useState, useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import { PluginId, PluginConfig, PermissionObject } from '../types';
import { PluginUiDisplayEvent, PluginWorkerErrorEvent } from '../types.event';
import { createPluginWorkerApi } from '../pluginApi';
import pluginClient from '../api/pluginClientApi';
import pluginRegistry from '../pluginRegistry';
import eventBus from '../../../events';
import { PluginExecutionError } from '../types.error';
import pluginMessageBus from '../pluginMessageBus';
import { MessageTarget } from '../types.message';

interface ExpandViewProps {
    pluginId: PluginId;
    config: PluginConfig;
    permissions: PermissionObject;
    onClose: () => void;
    onMinimize?: () => void;
    viewId?: string; // Optional custom view ID
}

/**
 * ExpandViewExecutor React component
 * Renders a plugin's expanded view in an iframe and registers with registry
 */
export const ExpandViewExecutor: React.FC<ExpandViewProps> = ({
    pluginId,
    config,
    permissions,
    onClose,
    onMinimize,
    viewId: propViewId
}) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // Generate a unique view ID if not provided
    const [viewId] = useState(() => propViewId || `expand-${pluginId}-${Date.now()}`);

    useEffect(() => {
        let unmounted = false;

        const loadView = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check if the plugin has an expand view
                if (!config.view?.expand?.entryPoint) {
                    throw new Error(`Plugin ${pluginId} does not have an expand view entry point`);
                }

                // Get the URL for the entry point
                const isInternal = !!config.internalPlugin;
                const viewUrl = pluginClient.getEntryPointUrl(
                    pluginId,
                    config.view.expand.entryPoint,
                    isInternal
                );

                // When the iframe loads, we'll set up the communication
                if (!unmounted && iframeRef.current) {
                    iframeRef.current.onload = () => {
                        setupIframeApi(iframeRef.current!, pluginId, config, permissions);
                        setLoading(false);

                        // Register the view with the registry
                        pluginRegistry.registerView(pluginId, viewId, 'expand', iframeRef.current!);
                    };
                }

                // Emit event that a plugin UI is being displayed with the actual URL
                eventBus.emit('pluginUiDisplay', {
                    pluginId,
                    config,
                    viewType: 'expand',
                    uiPath: viewUrl,
                    timestamp: Date.now()
                } as PluginUiDisplayEvent);
            } catch (err) {
                const viewError = new PluginExecutionError(
                    `Error loading expand view: ${err instanceof Error ? err.message : String(err)}`,
                    pluginId
                );
                console.error(viewError);
                setError(viewError.message);
                setLoading(false);

                // Emit error event
                eventBus.emit('pluginWorkerError', {
                    pluginId,
                    error: viewError.message,
                    timestamp: Date.now()
                } as PluginWorkerErrorEvent);
            }
        };

        loadView();

        return () => {
            unmounted = true;

            // Unregister the view from the registry when component unmounts
            pluginRegistry.unregisterView(pluginId, viewId);
        };
    }, [pluginId, config, permissions, viewId]);

    // Set up communication with the iframe
    const setupIframeApi = (
        iframe: HTMLIFrameElement,
        pluginId: string,
        config: PluginConfig,
        permissions: PermissionObject
    ) => {
        try {
            if (!iframe.contentWindow) {
                console.error('No contentWindow available in iframe');
                return;
            }

            // Create plugin API
            const pluginApi = createPluginWorkerApi(
                pluginId,
                config.name || pluginId,
                permissions
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sendMessageFunction = (target: string, topic: string, payload: any) => {
                return pluginMessageBus.sendMessage(
                    pluginId,
                    MessageTarget.EXPAND,
                    target,
                    topic,
                    payload
                );
            };

            // Expose the plugin API to the iframe
            Comlink.expose(
                { sendMessage: sendMessageFunction },
                Comlink.windowEndpoint(iframe.contentWindow)
            );

            console.log(`API exposed to expand view for plugin ${pluginId}`);
        } catch (error) {
            console.error(`Failed to set up API for expand view of plugin ${pluginId}:`, error);
        }
    };

    // Get the iframe URL for the plugin view
    const getIframeSrc = (): string => {
        if (!config.view?.expand?.entryPoint) {
            return 'about:blank';
        }

        const isInternal = !!config.internalPlugin;
        return pluginClient.getEntryPointUrl(
            pluginId,
            config.view.expand.entryPoint,
            isInternal
        );
    };

    const handleClose = () => {
        // Unregister the view from the registry before closing
        pluginRegistry.unregisterView(pluginId, viewId);
        onClose();
    };

    const handleMinimize = () => {
        // Unregister the view from the registry before minimizing
        pluginRegistry.unregisterView(pluginId, viewId);

        if (onMinimize) {
            onMinimize();
        }
    };

    if (error) {
        return (
            <div className="plugin-error" data-plugin-id={pluginId} data-view-type="expand" data-view-id={viewId}>
                <div className="plugin-error-content">
                    <h3>Error Loading Plugin</h3>
                    <p>{error}</p>
                    <button onClick={handleClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="plugin-view-container plugin-expand-container" data-plugin-id={pluginId} data-view-type="expand" data-view-id={viewId}>
            <div className="plugin-header">
                <h3 className="plugin-title">{config.name || pluginId}</h3>
                <div className="plugin-header-controls">
                    {onMinimize && (
                        <button className="plugin-minimize-btn" onClick={handleMinimize}>
                            Minimize
                        </button>
                    )}
                    <button className="plugin-close-btn" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
            {loading && (
                <div className="plugin-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading plugin...</p>
                </div>
            )}
            <div className="plugin-body">
                <iframe
                    ref={iframeRef}
                    src={getIframeSrc()}
                    title={`Plugin: ${config.name || pluginId} (Expand View)`}
                    className="plugin-iframe plugin-expand-view"
                    sandbox="allow-scripts allow-same-origin"
                    allow="clipboard-read; clipboard-write"
                />
            </div>
        </div>
    );
};

export default ExpandViewExecutor;