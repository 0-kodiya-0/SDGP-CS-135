import { useCallback, useMemo } from 'react';
import { PluginId, PluginConfig } from '../../../plugin/core/types';
import { usePluginEnvironment } from './usePluginEnvironment';

interface UseActivePluginsReturn {
    // Active plugin data
    activePluginIds: PluginId[];
    activePlugins: PluginConfig[];

    // Plugin management
    activatePlugin: (pluginId: PluginId) => Promise<boolean>;
    deactivatePlugin: (pluginId: PluginId) => Promise<boolean>;
    togglePluginActive: (pluginId: PluginId) => Promise<boolean>;
    isPluginActive: (pluginId: PluginId) => boolean;
}

/**
 * Hook for managing active plugins
 * Provides methods to activate/deactivate plugins and
 * access to currently active plugins
 */
export const useActivePlugins = (): UseActivePluginsReturn => {
    const {
        availablePlugins,
        activePlugins,
        setupPlugin,
        stopPlugin,
        isPluginActive
    } = usePluginEnvironment();

    // Get active plugin configurations 
    const activePluginConfigs = useMemo(() =>
        availablePlugins.filter(plugin =>
            activePlugins.includes(plugin.id)
        ),
        [availablePlugins, activePlugins]);

    // Activate a plugin
    const activatePlugin = useCallback(async (pluginId: PluginId): Promise<boolean> => {
        if (isPluginActive(pluginId)) return true;
        return await setupPlugin(pluginId);
    }, [isPluginActive, setupPlugin]);

    // Deactivate a plugin
    const deactivatePlugin = useCallback(async (pluginId: PluginId): Promise<boolean> => {
        if (!isPluginActive(pluginId)) return true;
        return await stopPlugin(pluginId);
    }, [isPluginActive, stopPlugin]);

    // Toggle plugin active state
    const togglePluginActive = useCallback(async (pluginId: PluginId): Promise<boolean> => {
        return isPluginActive(pluginId)
            ? await deactivatePlugin(pluginId)
            : await activatePlugin(pluginId);
    }, [isPluginActive, deactivatePlugin, activatePlugin]);

    return {
        activePluginIds: activePlugins,
        activePlugins: activePluginConfigs,
        activatePlugin,
        deactivatePlugin,
        togglePluginActive,
        isPluginActive
    };
};

export default useActivePlugins;