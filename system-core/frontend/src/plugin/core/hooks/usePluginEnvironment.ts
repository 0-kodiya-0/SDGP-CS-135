import { useCallback, useState } from 'react';
import { usePlugins } from '../../../plugin/core/context/pluginContext';
import { PluginId, PluginConfig } from '../../../plugin/core/types';
import useEnvironment from '../../../features/default/environment/hooks/useEnvironment';
import { Environment } from '../../../features/default/environment';

interface PluginEnvironmentState {
    loading: boolean;
    error: Error | null;
    initialized: boolean;
}

interface UsePluginEnvironmentReturn {
    // State
    currentEnvironment: Environment | null;
    availablePlugins: PluginConfig[];
    activePlugins: PluginId[];
    pluginState: PluginEnvironmentState;

    // Actions
    initializePlugins: () => Promise<void>;
    setupPlugin: (pluginId: PluginId) => Promise<boolean>;
    stopPlugin: (pluginId: PluginId) => Promise<boolean>;
    isPluginActive: (pluginId: PluginId) => boolean;
}

/**
 * Hook that combines environment and plugin context
 * Handles initializing plugins for the current environment
 */
export const usePluginEnvironment = (): UsePluginEnvironmentReturn => {
    // Get environment data
    const { currentEnvironment } = useEnvironment();

    // Get plugin methods
    const {
        loadedPlugins,
        activePluginIds,
        initializePlugins: initPlugins,
        setupPlugin: setupPluginBase,
        stopPlugin: stopPluginBase,
        isPluginActive
    } = usePlugins();

    // Plugin state
    const [pluginState, setPluginState] = useState<PluginEnvironmentState>({
        loading: false,
        error: null,
        initialized: false
    });

    // Initialize plugins
    const initializePlugins = useCallback(async (): Promise<void> => {
        if (pluginState.initialized) return;

        try {
            setPluginState(prev => ({ ...prev, loading: true }));
            await initPlugins();
            setPluginState({
                loading: false,
                error: null,
                initialized: true
            });
        } catch (error) {
            setPluginState({
                loading: false,
                error: error instanceof Error ? error : new Error('Failed to initialize plugins'),
                initialized: false
            });
        }
    }, [initPlugins, pluginState.initialized]);

    // Setup a plugin with the current environment
    const setupPlugin = useCallback(async (pluginId: PluginId): Promise<boolean> => {
        if (!currentEnvironment) {
            console.error('Cannot setup plugin without an active environment');
            return false;
        }

        return await setupPluginBase(pluginId, true, currentEnvironment.id);
    }, [currentEnvironment, setupPluginBase]);

    // Stop a plugin
    const stopPlugin = useCallback(async (pluginId: PluginId): Promise<boolean> => {
        return await stopPluginBase(pluginId);
    }, [stopPluginBase]);

    return {
        currentEnvironment,
        availablePlugins: loadedPlugins,
        activePlugins: activePluginIds,
        pluginState,
        initializePlugins,
        setupPlugin,
        stopPlugin,
        isPluginActive
    };
};

export default usePluginEnvironment;