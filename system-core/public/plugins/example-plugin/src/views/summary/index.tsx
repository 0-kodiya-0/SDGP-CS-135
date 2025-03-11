/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as Comlink from 'comlink';
import {
    PluginState,
    MessageType,
    MessagePayload,
    MessageTarget,
    PluginGlobalApi,
    RemoteSystemAPI
} from '../../types';
import './styles.css';

/**
 * Summary View Component
 */
const SummaryView: React.FC = () => {
    // State
    const [state, setState] = useState<PluginState | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // References to plugin API and messaging
    const systemApi = useRef<RemoteSystemAPI | null>(null);
    const pluginApiRef = useRef<PluginGlobalApi | null>(null);
    const sendMessageRef = useRef<(<T>(target: string, topic: string, payload: T) => Promise<boolean>) | null>(null);

    // Initialize communication with the plugin system
    useEffect(() => {
        const initializePluginApi = async () => {
            try {
                // The plugin system exposes the API via Comlink in the window object
                if (window.parent) {
                    // Create a Comlink endpoint connecting to the parent window
                    const endpoint = Comlink.windowEndpoint(window.parent);

                    // Connect to the exposed API
                    systemApi.current = Comlink.wrap<RemoteSystemAPI>(endpoint);

                    // Get the actual pluginApi and sendMessage function
                    // Since Comlink wraps these as promises, we need to await them
                    const api = await systemApi.current.pluginApi;
                    pluginApiRef.current = api;
                    sendMessageRef.current = systemApi.current.sendMessage;

                    console.log('Summary View: Plugin API connected via Comlink');

                    // Request initial state
                    requestInitialState();
                } else {
                    setError('Cannot connect to plugin system: No parent window found');
                }
            } catch (error) {
                console.error('Summary View: Error connecting to plugin system', error);
                setError('Failed to connect to plugin system');
            }
        };

        initializePluginApi();

        // Set up message listener for communication from the plugin system
        const handleMessage = (event: MessageEvent) => {
            // Check if the message is from the plugin system
            if (event.data && event.data.pluginMessage) {
                const message = event.data.pluginMessage;
                handlePluginMessage(message.topic, message.payload);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    /**
     * Request initial state from background service
     */
    const requestInitialState = async () => {
        if (!sendMessageRef.current) {
            console.warn('Summary View: System API not available yet');
            return;
        }

        setIsLoading(true);

        try {
            // Request current state from background
            await sendMessageRef.current(
                MessageTarget.BACKGROUND,
                MessageType.STATE_REQUEST,
                {}
            );
        } catch (error) {
            console.error('Summary View: Error requesting state', error);
            setError('Failed to connect to background service');
            setIsLoading(false);
        }
    };

    /**
     * Handle plugin messages from background service
     */
    const handlePluginMessage = (type: string, payload: any) => {
        console.log(`Summary View: Received message - ${type}`);

        switch (type) {
            case MessageType.STATE_UPDATE:
                handleStateUpdate(payload as MessagePayload.StateUpdate);
                break;

            case MessageType.SYNC_COMPLETE:
                handleSyncComplete(payload as MessagePayload.SyncComplete);
                break;

            case MessageType.SYNC_ERROR:
                handleSyncError(payload as MessagePayload.SyncError);
                break;

            case MessageType.ITEM_UPDATED:
            case MessageType.ITEM_DELETED:
                // Request full state update when items change
                requestInitialState();
                break;
        }
    };

    /**
     * Handle state update message
     */
    const handleStateUpdate = (payload: MessagePayload.StateUpdate) => {
        setIsLoading(false);
        setState(payload.state);
        setError(null);
    };

    /**
     * Handle sync complete message
     */
    const handleSyncComplete = (payload: MessagePayload.SyncComplete) => {
        setIsLoading(false);

        // Update last synced timestamp in state if available
        if (state) {
            setState({
                ...state,
                lastSynced: payload.timestamp,
                isSyncing: false,
                error: null
            });
        }
    };

    /**
     * Handle sync error message
     */
    const handleSyncError = (payload: MessagePayload.SyncError) => {
        setIsLoading(false);
        setError(payload.message);

        // Update error in state if available
        if (state) {
            setState({
                ...state,
                isSyncing: false,
                error: payload.message
            });
        }
    };

    /**
     * Handle sync button click
     */
    const handleSyncClick = async () => {
        if (!sendMessageRef.current) {
            return;
        }

        // Set syncing state
        if (state) {
            setState({
                ...state,
                isSyncing: true,
                error: null
            });
        }

        try {
            // Request sync from background
            await sendMessageRef.current(
                MessageTarget.BACKGROUND,
                MessageType.SYNC_REQUEST,
                { force: true }
            );
        } catch (error) {
            console.error('Summary View: Error requesting sync', error);
            setError('Failed to send sync request');

            // Update error in state
            if (state) {
                setState({
                    ...state,
                    isSyncing: false,
                    error: 'Failed to send sync request'
                });
            }
        }
    };

    // Format last synced timestamp
    const formatLastSynced = (timestamp: number | null): string => {
        if (!timestamp) {
            return 'Never';
        }

        return new Date(timestamp).toLocaleString();
    };

    // Show loading state
    if (isLoading && !state) {
        return (
            <div className="plugin-summary-view">
                <div className="status-section">
                    <div className="status loading">Initializing...</div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !state) {
        return (
            <div className="plugin-summary-view">
                <div className="status-section">
                    <div className="status error">{error}</div>
                </div>
            </div>
        );
    }

    // Show data when state is available
    return (
        <div className="plugin-summary-view">
            <div className="status-section">
                <div className={`status ${state?.isSyncing ? 'loading' : state?.error ? 'error' : 'success'}`}>
                    {state?.isSyncing ? 'Syncing...' : state?.error ? `Error: ${state.error}` : 'Ready'}
                </div>
            </div>

            <div className="data-section">
                <div className="item-count">
                    Items: {state?.items.length || 0}
                </div>
                <div className="last-sync">
                    Last synced: {formatLastSynced(state?.lastSynced || null)}
                </div>
            </div>

            <div className="action-section">
                <button
                    className="sync-button"
                    onClick={handleSyncClick}
                    disabled={state?.isSyncing || !sendMessageRef.current}
                >
                    {state?.isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
            </div>
        </div>
    );
};

// Create root element
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Render the component
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <SummaryView />
    </React.StrictMode>
);