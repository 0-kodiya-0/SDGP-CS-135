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
import { useTabStore } from '../../../features/required/tab_view/store';
import { PluginWorkerAPI } from '../pluginWorkerApi';
import { validatePluginWorkerAPI } from '../utils/validatePluginWorkerAPI';
import PluginErrorBoundary from '../ui/PluginErrorBoundary';
import { pluginExecutorsLogger } from '../utils/logger';

const expandLogger = pluginExecutorsLogger.extend('expand');

interface ExpandViewProps {
    pluginId: PluginId;
    config: PluginConfig;
    permissions: PermissionObject;
    viewId?: string; // Optional custom view ID
    environmentId: number;
    tabId?: string; // Optional tab ID if opened in a tab
}

/**
 * ExpandViewExecutor React component
 * Renders a plugin's expanded view in an iframe and registers with registry
 */
export const ExpandViewExecutor: React.FC<ExpandViewProps> = ({
    pluginId,
    config,
    permissions,
    viewId: propViewId,
    environmentId,
    tabId
}) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const tabStore = useTabStore();
    const [viewProxy, setViewProxy] = useState<Comlink.Remote<PluginWorkerAPI> | null>(null);

    // Generate a unique view ID if not provided
    const [viewId] = useState(() => propViewId || `expand-${pluginId}-${Date.now()}`);

    // Get the initial state from the tab if available
    const [initialState] = useState(() => {
        if (tabId && environmentId) {
            const tabView = tabStore.tabViews[environmentId];
            if (tabView) {
                const tab = tabView.tabs.find(t => t.id === tabId);
                if (tab && tab.state) {
                    expandLogger('Using initial state from tab %s for plugin %s', tabId, pluginId);
                    return tab.state;
                }
            }
        }
        return {};
    });

    // Log component mount with important details
    useEffect(() => {
        expandLogger('Mounting expand view for plugin %s (viewId: %s, environment: %d, tabId: %s)',
            pluginId, viewId, environmentId, tabId || 'none');

        return () => {
            expandLogger('Unmounting expand view for plugin %s (viewId: %s)', pluginId, viewId);
        };
    }, [pluginId, viewId, environmentId, tabId]);

    useEffect(() => {
        let unmounted = false;

        const loadView = async () => {
            try {
                if (unmounted) return;

                setLoading(true);
                setError(null);

                // Check if the plugin has an expand view
                if (!config.view?.expand?.entryPoint) {
                    expandLogger('Plugin %s does not have an expand view entry point', pluginId);
                    throw new Error(`Plugin ${pluginId} does not have an expand view entry point`);
                }

                // Get the URL for the entry point
                const isInternal = !!config.internalPlugin;
                const viewUrl = pluginClient.getEntryPointUrl(
                    pluginId,
                    config.view.expand.entryPoint,
                    isInternal
                );

                expandLogger('Loading expand view for plugin %s from %s', pluginId, viewUrl);

                // Emit event that a plugin UI is being displayed with the actual URL
                eventBus.emit('pluginUiDisplay', {
                    pluginId,
                    config,
                    viewType: 'expand',
                    uiPath: viewUrl,
                    timestamp: Date.now()
                } as PluginUiDisplayEvent);

            } catch (err) {
                if (unmounted) return;

                const viewError = new PluginExecutionError(
                    `Error loading expand view: ${err instanceof Error ? err.message : String(err)}`,
                    pluginId
                );
                expandLogger('Error loading expand view for plugin %s: %o', pluginId, viewError);
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
                    expandLogger('Terminating view proxy for plugin %s (viewId: %s)', pluginId, viewId);
                    viewProxy.terminate().catch(err => {
                        expandLogger('Error terminating expand view %s: %o', viewId, err);
                    });
                } catch (err) {
                    expandLogger('Failed to call terminate on expand view %s: %o', viewId, err);
                }
            }

            // Unregister the view from the registry when component unmounts
            expandLogger('Unregistering expand view %s for plugin %s', viewId, pluginId);
            pluginRegistry.unregisterView(pluginId, viewId);
        };
    }, [pluginId, config, viewId, environmentId, tabId, viewProxy]); // Added viewProxy to dependencies

    // Handle iframe onLoad event
    const handleIframeLoad = () => {
        if (!iframeRef.current) return;

        expandLogger('Expand view iframe loaded for plugin %s (viewId: %s)', pluginId, viewId);
        setIframeLoaded(true);
        setLoading(false);

        // Setup API and register the view after iframe is loaded
        setupIframeApi(iframeRef.current);
    };

    // Set up communication with the iframe
    const setupIframeApi = (iframe: HTMLIFrameElement) => {
        try {
            if (!iframe.contentWindow) {
                expandLogger('No contentWindow available in iframe for plugin %s', pluginId);
                return;
            }

            expandLogger('Setting up API for expand view %s of plugin %s', viewId, pluginId);

            // Create plugin API with initial state and EXPAND source type
            expandLogger('Creating plugin API for expand view %s', viewId);
            const pluginApi = createPluginApi(
                config,
                environmentId,
                initialState,
                MessageTarget.EXPAND // Specify the source type as EXPAND
            );

            // If tab ID is provided, handle state changes
            if (tabId) {
                expandLogger('Setting up state syncing with tab %s for expand view %s', tabId, viewId);
                // Override the state.update method to sync with tab state
                // Override the state.update method to sync with tab state
                const originalUpdate = pluginApi.state.update;
                pluginApi.state.update = async (updates: Record<string, unknown>) => {
                    // Call the original update method
                    const result = await originalUpdate(updates);

                    // Sync with tab state
                    if (result) {
                        expandLogger('Syncing state update to tab %s: %o', tabId, updates);
                        tabStore.updateTabState(environmentId, tabId, updates);
                    }

                    return result;
                };
            }

            // Expose the plugin API to the iframe
            expandLogger('Exposing API to iframe for expand view %s', viewId);
            Comlink.expose(
                pluginApi,
                Comlink.windowEndpoint(iframe.contentWindow)
            );

            // Create a Comlink proxy to the iframe for PluginWorkerAPI
            expandLogger('Creating Comlink proxy for expand view %s', viewId);
            const proxy = Comlink.wrap<PluginWorkerAPI>(
                Comlink.windowEndpoint(iframe.contentWindow)
            );

            // Store the proxy for later use
            setViewProxy(proxy);

            // Validate and initialize the view
            expandLogger('Validating and initializing expand view %s', viewId);
            validatePluginWorkerAPI(proxy, pluginId, 'Expand view')
                .then(() => {
                    expandLogger('API validation successful for expand view %s', viewId);
                    return proxy.initialize();
                })
                .then(() => {
                    expandLogger('Expand view %s initialized successfully', viewId);

                    // Register the view with the registry including the proxy
                    expandLogger('Registering expand view %s with registry', viewId);
                    pluginRegistry.registerView(pluginId, viewId, 'expand', proxy, iframe);
                })
                .catch(error => {
                    expandLogger('Failed to validate or initialize expand view %s: %o', viewId, error);
                    eventBus.emit('pluginWorkerError', {
                        pluginId,
                        error: `Failed to initialize expand view: ${error}`,
                        timestamp: Date.now()
                    } as PluginWorkerErrorEvent);
                });
        } catch (error) {
            expandLogger('Failed to set up API for expand view of plugin %s: %o', pluginId, error);
        }
    };

    // Get the iframe URL for the plugin view
    const getIframeSrc = (): string | URL => {
        if (!config.view?.expand?.entryPoint) {
            expandLogger('No expand view entry point defined for plugin %s, using blank page', pluginId);
            return 'about:blank';
        }

        const isInternal = !!config.internalPlugin;
        const url = pluginClient.getEntryPointUrl(
            pluginId,
            config.view.expand.entryPoint,
            isInternal
        );
        expandLogger('Using iframe source URL for plugin %s: %s', pluginId, url);
        return url;
    };

    if (error) {
        expandLogger('Rendering error state for expand view %s: %s', viewId, error);
        return (
            <div
                className="bg-red-50 text-red-700 p-4"
                data-plugin-id={pluginId}
                data-view-type="expand"
                data-view-id={viewId}
            >
                {error}
            </div>
        );
    }

    expandLogger('Rendering expand view %s iframe', viewId);
    return (
        <PluginErrorBoundary
            pluginId={pluginId}
            viewType="expand"
            fallback={
                <div
                    className="bg-red-50 text-red-700 p-4"
                    data-plugin-id={pluginId}
                    data-view-type="expand"
                    data-view-id={viewId}
                >
                    An error occurred in the expand view. Please try reloading.
                </div>
            }
        >
            <div className="w-full h-full relative">
                {loading && !iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                )}
                <iframe
                    ref={iframeRef}
                    src={getIframeSrc().toString()}
                    title={`Plugin: ${config.name || pluginId} (Expand View)`}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    allow="clipboard-read; clipboard-write"
                    onLoad={handleIframeLoad}
                />
            </div>
        </PluginErrorBoundary>
    );
};

export default ExpandViewExecutor;