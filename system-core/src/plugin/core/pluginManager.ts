import { ExternalPluginLoader, InternalPluginLoader } from "./loaders";
import { PluginConfig } from "./types";

/**
 * Manager class that coordinates both internal and external plugin loaders
 * Responsible for discovering and loading plugin configurations
 */
class PluginLoaderManager {
    private static instance: PluginLoaderManager;
    private internalLoader: InternalPluginLoader;
    private externalLoader: ExternalPluginLoader;

    private constructor() {
        this.internalLoader = new InternalPluginLoader();
        this.externalLoader = new ExternalPluginLoader();
        console.log('Plugin loader manager initialized');
    }

    /**
     * Get the singleton instance of the PluginLoaderManager
     */
    public static getInstance(): PluginLoaderManager {
        if (!PluginLoaderManager.instance) {
            PluginLoaderManager.instance = new PluginLoaderManager();
        }
        return PluginLoaderManager.instance;
    }

    /**
     * Load all plugin configurations (both internal and external)
     */
    async loadAllPlugins(): Promise<PluginConfig[]> {
        console.log('Loading all plugin configurations');

        // Load internal plugins first
        const internalPlugins = await this.internalLoader.loadAllPlugins();
        console.log(`Loaded ${internalPlugins.length} internal plugin configurations`);

        // Then load external plugins
        // const externalPlugins = await this.externalLoader.loadAllPlugins();
        // console.log(`Loaded ${externalPlugins.length} external plugin configurations`);

        // Combine results
        return internalPlugins; // [...internalPlugins, ...externalPlugins];
    }

    /**
     * Load only internal plugin configurations
     */
    async loadInternalPlugins(): Promise<PluginConfig[]> {
        console.log('Loading internal plugin configurations');
        return this.internalLoader.loadAllPlugins();
    }

    /**
     * Load only external plugin configurations
     */
    async loadExternalPlugins(): Promise<PluginConfig[]> {
        console.log('Loading external plugin configurations');
        return this.externalLoader.loadAllPlugins();
    }

    /**
     * Unload all plugins
     */
    unloadAllPlugins(): void {
        console.log('Unloading all plugins');
        this.internalLoader.unloadAllPlugins();
        this.externalLoader.unloadAllPlugins();
    }

    /**
     * Get access to the internal plugin loader
     */
    getInternalLoader(): InternalPluginLoader {
        return this.internalLoader;
    }

    /**
     * Get access to the external plugin loader
     */
    getExternalLoader(): ExternalPluginLoader {
        return this.externalLoader;
    }
}

export default PluginLoaderManager;