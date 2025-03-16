import React, { useState, useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import { PluginId, PluginConfig, PermissionObject } from '../types';
import { PluginUiDisplayEvent, PluginWorkerErrorEvent } from '../types.event';
import createPluginApi from '../pluginApi';
import pluginClient from '../api/pluginClientApi';
import pluginRegistry from '../pluginRegistry';
import eventBus from '../../../events';
import { PluginExecutionError } from '../types.error';
import { MessageTarget } from '../types.message';
import { PluginWorkerAPI } from '../pluginWorkerApi';
import { validatePluginWorkerAPI } from '../utils/validatePluginWorkerAPI';
import PluginErrorBoundary from '../ui/PluginErrorBoundary';
import { pluginExecutorsLogger } from '../utils/logger';

const summaryLogger = pluginExecutorsLogger.extend('summary');

interface SummaryViewProps {
    pluginId: PluginId;
    config: PluginConfig;
    permissions: PermissionObject;
    viewId?: string; // Optional custom view ID
    environmentId: number;
}

/**
 * SummaryViewExecutor React component
 * Renders a plugin's summary view in an iframe and registers with registry
 */
export const SummaryViewExecutor: React.FC<SummaryViewProps> = ({
    pluginId,
    config,
    permissions,
    viewId: propViewId,
    environmentId
}) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // Generate a unique view ID if not provided
    const [viewId] = useState(() => propViewId || `summary-${pluginId}-${Date.now()}`);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [viewProxy, setViewProxy] = useState<Comlink.Remote<PluginWorkerAPI> | null>(null);

    // Log component mount with important details
    useEffect(() => {
        summaryLogger('Mounting summary view for plugin %s (viewId: %s, environment: %d)', 
                     pluginId, viewId, environmentId);
        
        return () => {
            summaryLogger('Unmounting summary view for plugin %s (viewId: %s)', pluginId, viewId);
        };
    }, [pluginId, viewId, environmentId]);

    useEffect(() => {
        let unmounted = false;

        const loadView = async () => {
            try {
                if (unmounted) return;

                setLoading(true);
                setError(null);

                // Check if the plugin has a summary view
                if (!config.view?.summary?.entryPoint) {
                    summaryLogger('Plugin %s does not have a summary view entry point', pluginId);
                    throw new Error(`Plugin ${pluginId} does not have a summary view entry point`);
                }

                // Get the URL for the entry point
                const isInternal = !!config.internalPlugin;
                const viewUrl = pluginClient.getEntryPointUrl(
                    pluginId,
                    config.view.summary.entryPoint,
                    isInternal
                );

                summaryLogger('Loading summary view for plugin %s from %s', pluginId, viewUrl);

                // Emit event that a plugin UI is being displayed with the actual URL
                eventBus.emit('pluginUiDisplay', {
                    pluginId,
                    config,
                    viewType: 'summary',
                    uiPath: viewUrl,
                    timestamp: Date.now()
                } as PluginUiDisplayEvent);
            } catch (err) {
                if (unmounted) return;

                const viewError = new PluginExecutionError(
                    `Error loading summary view: ${err instanceof Error ? err.message : String(err)}`,
                    pluginId
                );
                summaryLogger('Error loading summary view for plugin %s: %o', pluginId, viewError);
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

            // Properly terminate the view proxy if it exists
            if (viewProxy) {
                try {
                    summaryLogger('Terminating view proxy for plugin %s (viewId: %s)', pluginId, viewId);
                    viewProxy.terminate().catch(err => {
                        summaryLogger('Error terminating summary view %s: %o', viewId, err);
                    });
                } catch (err) {
                    summaryLogger('Failed to call terminate on summary view %s: %o', viewId, err);
                }
            }

            // Unregister the view from the registry when component unmounts
            summaryLogger('Unregistering summary view %s for plugin %s', viewId, pluginId);
            pluginRegistry.unregisterView(pluginId, viewId);
        };
    }, [pluginId, config, viewId, environmentId, viewProxy]); // Add viewProxy to dependencies

    // Handle iframe onLoad event
    const handleIframeLoad = () => {
        if (!iframeRef.current) return;

        summaryLogger('Summary view iframe loaded for plugin %s (viewId: %s)', pluginId, viewId);
        setIframeLoaded(true);
        setLoading(false);

        // Setup API and register the view after iframe is loaded
        setupIframeApi(iframeRef.current);
    };

    // Set up communication with the iframe
    const setupIframeApi = (iframe: HTMLIFrameElement) => {
        try {
            if (!iframe.contentWindow) {
                summaryLogger('No contentWindow available in iframe for plugin %s', pluginId);
                return;
            }

            summaryLogger('Setting up API for summary view %s of plugin %s', viewId, pluginId);
            
            // Get current tab state if any
            const initialState: Record<string, unknown> = {};

            // Create serializable plugin API with SUMMARY source type
            summaryLogger('Creating plugin API for summary view %s', viewId);
            const pluginApi = createPluginApi(
                config,
                environmentId,
                initialState,
                MessageTarget.SUMMARY // Specify the source type as SUMMARY
            );

            // Expose the plugin API to the iframe
            summaryLogger('Exposing API to iframe for summary view %s', viewId);
            Comlink.expose(
                pluginApi,
                Comlink.windowEndpoint(iframe.contentWindow)
            );

            // Create a Comlink proxy to the iframe for PluginWorkerAPI
            summaryLogger('Creating Comlink proxy for summary view %s', viewId);
            const proxy = Comlink.wrap<PluginWorkerAPI>(
                Comlink.windowEndpoint(iframe.contentWindow)
            );

            // Store the proxy for later use
            setViewProxy(proxy);

            // Validate and initialize the view
            summaryLogger('Validating and initializing summary view %s', viewId);
            validatePluginWorkerAPI(proxy, pluginId, 'Summary view')
                .then(() => {
                    summaryLogger('API validation successful for summary view %s', viewId);
                    return proxy.initialize();
                })
                .then(() => {
                    summaryLogger('Summary view %s initialized successfully', viewId);

                    // Register the view with the registry including the proxy
                    summaryLogger('Registering summary view %s with registry', viewId);
                    pluginRegistry.registerView(pluginId, viewId, 'summary', proxy, iframe);
                })
                .catch(error => {
                    summaryLogger('Failed to validate or initialize summary view %s: %o', viewId, error);
                    eventBus.emit('pluginWorkerError', {
                        pluginId,
                        error: `Failed to initialize summary view: ${error}`,
                        timestamp: Date.now()
                    } as PluginWorkerErrorEvent);
                });
        } catch (error) {
            summaryLogger('Failed to set up API for summary view of plugin %s: %o', pluginId, error);
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

    if (error) {
        summaryLogger('Rendering error state for summary view %s: %s', viewId, error);
        return (
            <div
                className="bg-red-50 text-red-700 p-4"
                data-plugin-id={pluginId}
                data-view-type="summary"
                data-view-id={viewId}
            >
                {error}
            </div>
        );
    }

    summaryLogger('Rendering summary view %s iframe', viewId);
    return (
        <PluginErrorBoundary
            pluginId={pluginId}
            viewType="summary"
            fallback={
                <div
                    className="bg-red-50 text-red-700 p-4"
                    data-plugin-id={pluginId}
                    data-view-type="summary"
                    data-view-id={viewId}
                >
                    An error occurred in the summary view. Please try reloading.
                </div>
            }
        >
            <div className="w-full h-full relative">
                {loading && !iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                )}
                <iframe
                    ref={iframeRef}
                    src={getIframeSrc()}
                    title={`Plugin: ${config.name || pluginId} (Summary View)`}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    allow="clipboard-read; clipboard-write"
                    onLoad={handleIframeLoad}
                />
            </div>
        </PluginErrorBoundary>
    );
};

export default SummaryViewExecutor;