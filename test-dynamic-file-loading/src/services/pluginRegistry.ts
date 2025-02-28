import { LoadedPlugin } from '../plugin/types/plugin.types';

class PluginRegistry {
    private plugins = new Map<string, LoadedPlugin>();
    private static instance: PluginRegistry | null = null;

    // Singleton pattern
    static getInstance(): PluginRegistry {
        if (!PluginRegistry.instance) {
            PluginRegistry.instance = new PluginRegistry();
        }
        return PluginRegistry.instance;
    }

    // Register a new plugin
    registerPlugin(plugin: LoadedPlugin): void {
        if (this.plugins.has(plugin.id)) {
            console.warn(`Plugin with id ${plugin.id} is already registered. Overriding.`);
            // Clean up the existing plugin if needed
            this.unregisterPlugin(plugin.id);
        }

        this.plugins.set(plugin.id, plugin);
        console.log(`Plugin ${plugin.name} (${plugin.id}) registered successfully.`);
    }

    // Unregister a plugin
    unregisterPlugin(pluginId: string): void {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            // Clean up resources
            plugin.worker.terminate();
            this.plugins.delete(pluginId);
            console.log(`Plugin ${pluginId} unregistered.`);
        }
    }

    // Get a plugin by ID
    getPlugin(pluginId: string): LoadedPlugin | undefined {
        return this.plugins.get(pluginId);
    }

    // Get all plugins
    getAllPlugins(): LoadedPlugin[] {
        return Array.from(this.plugins.values());
    }

    // Clean up all plugins
    cleanup(): void {
        this.plugins.forEach((plugin) => {
            plugin.worker.terminate();
        });
        this.plugins.clear();
    }
}

export default PluginRegistry;