import React, { createContext, useContext, useEffect, useState } from 'react';
import { PluginId, PluginConfig, ExtendedPluginStatus } from '../types';
import pluginManager from '../pluginManager';
import eventBus from '../../../events';

export interface PluginContextType {
    // Plugin system state
    isInitialized: boolean;
    isLoading: boolean;
    loadedPlugins: PluginConfig[];
    activePluginIds: PluginId[];

    // Plugin actions
    initializePlugins: () => Promise<void>;
    loadPlugin: (pluginId: PluginId, isInternal?: boolean) => Promise<PluginConfig | null>;
    registerPlugin: (pluginId: PluginId) => Promise<boolean>;
    approvePlugin: (pluginId: PluginId) => Promise<boolean>;
    executePlugin: (pluginId: PluginId) => Promise<boolean>;
    stopPlugin: (pluginId: PluginId, reason?: 'user' | 'system' | 'error') => Promise<boolean>;
    unregisterPlugin: (pluginId: PluginId, reason?: string) => Promise<boolean>;
    setupPlugin: (pluginId: PluginId, isInternal?: boolean) => Promise<boolean>;

    // Plugin status
    isPluginActive: (pluginId: PluginId) => boolean;
    getPluginStatus: (pluginId: PluginId) => Promise<ExtendedPluginStatus>;
}

export const PluginContext = createContext<PluginContextType | undefined>(undefined);

export interface PluginProviderProps {
    children: React.ReactNode;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadedPlugins, setLoadedPlugins] = useState<PluginConfig[]>([]);
    const [activePluginIds, setActivePluginIds] = useState<PluginId[]>([]);

    // Initialize plugin system
    const initializePlugins = async (): Promise<void> => {
        if (isInitialized) {
            return;
        }

        try {
            setIsLoading(true);

            // Initialize the plugin system
            await pluginManager.initialize();

            // Get loaded plugins
            setLoadedPlugins(pluginManager.getLoadedPlugins());

            // Get active plugin IDs
            setActivePluginIds(pluginManager.getActivePluginIds());

            setIsInitialized(true);
        } catch (error) {
            console.error('Failed to initialize plugins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Listen for plugin events to keep state updated
    useEffect(() => {
        const onPluginRegistered = () => {
            setLoadedPlugins(pluginManager.getLoadedPlugins());
        };

        const onPluginWorkerStarted = () => {
            setActivePluginIds(pluginManager.getActivePluginIds());
        };

        const onPluginWorkerStopped = () => {
            setActivePluginIds(pluginManager.getActivePluginIds());
        };

        // Subscribe to events
        eventBus.on('pluginRegistered', onPluginRegistered);
        eventBus.on('pluginWorkerStarted', onPluginWorkerStarted);
        eventBus.on('pluginWorkerStopped', onPluginWorkerStopped);

        // Clean up event listeners
        return () => {
            eventBus.off('pluginRegistered', onPluginRegistered);
            eventBus.off('pluginWorkerStarted', onPluginWorkerStarted);
            eventBus.off('pluginWorkerStopped', onPluginWorkerStopped);
        };
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            // Shutdown the plugin system when the component unmounts
            pluginManager.shutdown().catch(error => {
                console.error('Error shutting down plugin system:', error);
            });
        };
    }, []);

    // Context value - all functions are delegated to the pluginManager
    const contextValue: PluginContextType = {
        // State
        isInitialized: isInitialized,
        isLoading,
        loadedPlugins,
        activePluginIds,

        // Actions - delegating to pluginManager
        initializePlugins,
        loadPlugin: (pluginId, isInternal = true) => pluginManager.loadPlugin(pluginId, isInternal),
        registerPlugin: (pluginId) => pluginManager.registerPlugin(pluginId),
        approvePlugin: (pluginId) => pluginManager.approvePlugin(pluginId),
        executePlugin: (pluginId) => pluginManager.executePlugin(pluginId),
        stopPlugin: (pluginId, reason = 'user') => pluginManager.stopPlugin(pluginId, reason),
        unregisterPlugin: (pluginId, reason) => pluginManager.unregisterPlugin(pluginId, reason),
        setupPlugin: (pluginId, isInternal = true) => pluginManager.setupPlugin(pluginId, isInternal),

        // Status
        isPluginActive: (pluginId) => pluginManager.isPluginActive(pluginId),
        getPluginStatus: (pluginId) => pluginManager.getPluginStatus(pluginId),
    };

    return (
        <PluginContext.Provider value={contextValue}>
            {children}
        </PluginContext.Provider>
    );
};

// Custom hook for using the plugin context
export const usePlugins = (): PluginContextType => {
    const context = useContext(PluginContext);
    if (!context) {
        throw new Error('usePlugins must be used within a PluginProvider');
    }
    return context;
};

export default PluginProvider;