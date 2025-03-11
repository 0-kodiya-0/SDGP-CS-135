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

interface SummaryViewProps {
    pluginId: PluginId;
    config: PluginConfig;
    permissions: PermissionObject;
    onClose: () => void;
    viewId?: string; // Optional custom view ID
}

/**
 * SummaryViewExecutor React component
 * Renders a plugin's summary view in an iframe and registers with registry
 */
export const SummaryViewExecutor: React.FC<SummaryViewProps> = ({
    pluginId,
    config,
    permissions,
    onClose,
    viewId: propViewId
}) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // Generate a unique view ID if not provided
    const [viewId] = useState(() => propViewId || `summary-${pluginId}-${Date.now()}`);

    useEffect(() => {
        let unmounted = false;

        const loadView = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check if the plugin has a summary view
                if (!config.view?.summary?.entryPoint) {
                    throw new Error(`Plugin ${pluginId} does not have a summary view entry point`);
                }

                // Get the URL for the entry point
                const isInternal = !!config.internalPlugin;
                const viewUrl = pluginClient.getEntryPointUrl(
                    pluginId,
                    config.view.summary.entryPoint,
                    isInternal
                );

                // When the iframe loads, we'll set up the communication
                if (!unmounted && iframeRef.current) {
                    iframeRef.current.onload = () => {
                        setupIframeApi(iframeRef.current!, pluginId, config, permissions);
                        setLoading(false);

                        // Register the view with the registry
                        pluginRegistry.registerView(pluginId, viewId, 'summary', iframeRef.current!);
                    };
                }

                // Emit event that a plugin UI is being displayed with the actual URL
                eventBus.emit('pluginUiDisplay', {
                    pluginId,
                    config,
                    viewType: 'summary',
                    uiPath: viewUrl,
                    timestamp: Date.now()
                } as PluginUiDisplayEvent);
                
            } catch (err) {
                const viewError = new PluginExecutionError(
                    `Error loading summary view: ${err instanceof Error ? err.message : String(err)}`,
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
                    MessageTarget.SUMMARY,
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

            console.log(`API exposed to summary view for plugin ${pluginId}`);
        } catch (error) {
            console.error(`Failed to set up API for summary view of plugin ${pluginId}:`, error);
        }
    };

    // Get the iframe URL for the plugin view
    const getIframeSrc = (): string => {
        if (!config.view?.summary?.entryPoint) {
            return 'about:blank';
        }

        const isInternal = !!config.internalPlugin;
        return pluginClient.getEntryPointUrl(
            pluginId,
            config.view.summary.entryPoint,
            isInternal
        );
    };

    const handleClose = () => {
        // Unregister the view from the registry before closing
        pluginRegistry.unregisterView(pluginId, viewId);
        onClose();
    };

    if (error) {
        return (
            <div className="plugin-error" data-plugin-id={pluginId} data-view-type="summary" data-view-id={viewId}>
                <div className="plugin-error-content">
                    <h3>Error Loading Plugin</h3>
                    <p>{error}</p>
                    <button onClick={handleClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="plugin-view-container" data-plugin-id={pluginId} data-view-type="summary" data-view-id={viewId}>
            {loading && (
                <div className="plugin-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading plugin...</p>
                </div>
            )}
            <iframe
                ref={iframeRef}
                src={getIframeSrc()}
                title={`Plugin: ${config.name || pluginId} (Summary View)`}
                className="plugin-iframe plugin-summary-view"
                sandbox="allow-scripts allow-same-origin"
                allow="clipboard-read; clipboard-write"
            />
            <div className="plugin-controls">
                <button className="plugin-close-btn" onClick={handleClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default SummaryViewExecutor;