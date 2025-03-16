import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import pluginManager from '../pluginManager';
import { PluginConfig, PluginId } from '../types';
import { Environment } from '../../../features/default/environment';
import { pluginContextLogger } from '../utils/logger';

interface PluginContextState {
    loadedPlugins: PluginConfig[];
    isInitialized: boolean;
    isLoading: boolean;
    error: Error | null;
    initializePlugins: () => Promise<void>;
    executePlugin: (pluginId: PluginId, environmentId: number) => Promise<boolean>;
}

export const PluginContext = createContext<PluginContextState>({
    loadedPlugins: [],
    isInitialized: false,
    isLoading: false,
    error: null,
    initializePlugins: async () => { },
    executePlugin: async () => false,
});

interface PluginProviderProps {
    children: ReactNode;
    environment: Environment | null;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ children, environment }) => {
    pluginContextLogger('Creating PluginProvider, environment: %o', environment?.id || 'none');
    
    const [loadedPlugins, setLoadedPlugins] = useState<PluginConfig[]>([]);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Initialize plugins system
    const initializePlugins = async () => {
        if (isInitialized || isLoading) {
            pluginContextLogger('Skipping initialization: already %s', isInitialized ? 'initialized' : 'loading');
            return;
        }

        pluginContextLogger('Initializing plugin system');
        setIsLoading(true);
        setError(null);

        try {
            // Initialize the plugin system
            pluginContextLogger('Calling pluginManager.initialize()');
            await pluginManager.initialize();

            // Get all loaded plugins
            pluginContextLogger('Getting loaded plugins');
            const plugins = pluginManager.getLoadedPlugins();
            setLoadedPlugins(plugins);

            setIsInitialized(true);
            pluginContextLogger('Plugin system initialized with %d plugins', plugins.length);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to initialize plugins');
            pluginContextLogger('Error initializing plugins: %o', error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Execute all internal plugins when environment changes
    useEffect(() => {
        if (!isInitialized || !environment) {
            pluginContextLogger('Skipping internal plugin execution: initialized=%s, environment=%s', 
                        isInitialized, environment?.id || 'none');
            return;
        }

        const executeInternalPlugins = async () => {
            pluginContextLogger('Executing internal plugins for environment %d', environment.id);
            try {
                const executedCount = await pluginManager.executeAllInternalPlugins(environment.id);
                pluginContextLogger('Executed %d internal plugins for environment %d', executedCount, environment.id);
            } catch (err) {
                pluginContextLogger('Error executing internal plugins for environment %d: %o', environment.id, err);
            }
        };

        executeInternalPlugins();
    }, [isInitialized, environment]);

    // Auto-initialize plugins on mount
    useEffect(() => {
        pluginContextLogger('PluginProvider mounted, initialized=%s, loading=%s', isInitialized, isLoading);
        if (!isInitialized && !isLoading) {
            pluginContextLogger('Auto-initializing plugins on mount');
            initializePlugins();
        }
        
        return () => {
            pluginContextLogger('PluginProvider unmounting');
        };
    }, []);

    // Execute a specific plugin
    const executePlugin = async (pluginId: PluginId, environmentId: number) => {
        pluginContextLogger('Executing plugin %s in environment %d', pluginId, environmentId);
        try {
            const success = await pluginManager.executePlugin(pluginId, environmentId);
            pluginContextLogger('Plugin %s execution %s', pluginId, success ? 'succeeded' : 'failed');
            return success;
        } catch (err) {
            pluginContextLogger('Error executing plugin %s: %o', pluginId, err);
            return false;
        }
    };

    const value = {
        loadedPlugins,
        isInitialized,
        isLoading,
        error,
        initializePlugins,
        executePlugin,
    };

    pluginContextLogger('Rendering PluginProvider with %d plugins', loadedPlugins.length);
    return <PluginContext.Provider value={value}>{children}</PluginContext.Provider>;
};

export const usePlugins = () => useContext(PluginContext);

export default PluginProvider;