// src/services/PluginLoader.ts
import * as Comlink from 'comlink';
import { LoadedPlugin, PluginConfig } from '../plugin/types/plugin.types';
import PluginRegistry from './pluginRegistry';

class PluginLoader {
    private registry: PluginRegistry;
    private isProduction: boolean;

    constructor() {
        this.registry = PluginRegistry.getInstance();
        // Check if we're in production mode
        this.isProduction = import.meta.env.PROD;

        console.log(`Plugin loader initialized in ${this.isProduction ? 'production' : 'development'} mode`);
    }

    // Load all plugins
    async loadAllPlugins(): Promise<LoadedPlugin[]> {
        try {
            // List of plugin IDs to load
            const pluginIds = ['example-plugin', 'counter-plugin'];
            console.log(`Loading plugins: ${pluginIds.join(', ')}`);

            const results = [];

            // Load plugins one by one to better isolate errors
            for (const id of pluginIds) {
                try {
                    const plugin = await this.loadPluginById(id);
                    results.push(plugin);
                } catch (error) {
                    console.error(`Failed to load plugin ${id}:`, error);
                    // Continue with other plugins
                }
            }

            return results;
        } catch (error) {
            console.error('Error in loadAllPlugins:', error);
            return [];
        }
    }

    // Load a plugin by ID
    private async loadPluginById(pluginId: string): Promise<LoadedPlugin> {
        try {
            console.log(`Loading plugin by ID: ${pluginId}`);
            console.log(`Environment: ${this.isProduction ? 'Production' : 'Development'}`);

            // Config path differs between development and production
            let configPath;
            
            if (this.isProduction) {
                configPath = `./plugin/${pluginId}/plugin.conf.json`;
            } else {
                // In development, try a more direct approach
                configPath = `/src/plugin/${pluginId}/plugin.conf.json`;
            }

            console.log(`Fetching config from: ${configPath}`);

            try {
                // In dev mode, we may need to adjust how we fetch the config
                let response;
                try {
                    response = await fetch(new URL(configPath, import.meta.url));
                } catch (urlError) {
                    console.log(`URL fetch failed, trying direct fetch`, urlError);
                    response = await fetch(configPath);
                }

                if (!response.ok) {
                    console.error(`HTTP error: ${response.status} ${response.statusText}`);
                    throw new Error(`Failed to load plugin config: ${response.status} ${response.statusText}`);
                }

                const configText = await response.text();
                console.log(`Raw config text:`, configText.substring(0, 200) + '...');

                let config;
                try {
                    config = JSON.parse(configText);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.error('Invalid JSON content:', configText);
                    throw new Error(`Failed to parse plugin config: ${parseError}`);
                }

                console.log(`Loaded config for ${pluginId}:`, config);
                
                // Validate worker entry point - this is required
                if (!config.worker || !config.worker.entryPoint) {
                    throw new Error(`Plugin ${pluginId} is missing required worker entry point`);
                }
                
                // Log UI and background entry points if they exist
                if (config.ui && config.ui.entryPoint) {
                    console.log(`UI entry point: ${config.ui.entryPoint}`);
                } else {
                    console.log(`No UI entry point defined for plugin ${pluginId}`);
                }
                
                if (config.background && config.background.entryPoint) {
                    console.log(`Background entry point: ${config.background.entryPoint}`);
                } else {
                    console.log(`No background entry point defined for plugin ${pluginId}`);
                }
                
                console.log(`Worker entry point: ${config.worker.entryPoint}`);

                return this.loadPlugin(pluginId, config);
            } catch (fetchError) {
                console.error(`Fetch error for ${configPath}:`, fetchError);
                
                // In development mode, try to create a mock config if the fetch fails
                if (!this.isProduction) {
                    console.log(`Attempting to create mock config for development`);
                    
                    // Create a minimal valid config for development testing
                    const mockConfig: PluginConfig = {
                        id: pluginId,
                        name: `${pluginId.charAt(0).toUpperCase() + pluginId.slice(1).replace(/-/g, ' ')}`,
                        worker: {
                            entryPoint: "worker.ts"
                        },
                        ui: {
                            entryPoint: "src/ui.tsx"
                        }
                    };
                    
                    console.log(`Created mock config for development:`, mockConfig);
                    return this.loadPlugin(pluginId, mockConfig);
                }
                
                throw fetchError;
            }
        } catch (error) {
            console.error(`Failed to load plugin ${pluginId}:`, error);
            throw error;
        }
    }

    // Load a plugin from its config
    async loadPlugin(pluginId: string, config: PluginConfig): Promise<LoadedPlugin> {
        try {
            console.log(`Loading plugin from config: ${pluginId}`);

            // Worker path differs between development and production
            let workerPath;
            
            if (this.isProduction) {
                workerPath = `./plugin/${pluginId}/${config.worker.entryPoint}`;
            } else {
                // In development, handle paths differently
                workerPath = `/src/plugin/${pluginId}/${config.worker.entryPoint}`;
                
                // Log the absolute URL to help with debugging
                const absoluteWorkerUrl = new URL(workerPath, window.location.origin).href;
                console.log(`Absolute worker URL: ${absoluteWorkerUrl}`);
            }

            console.log(`Creating worker from: ${workerPath}`);

            let worker;
            try {
                // Create the worker with error handler - try different approaches in development
                try {
                    worker = new Worker(new URL(workerPath, import.meta.url), { type: 'module' });
                } catch (urlError) {
                    if (!this.isProduction) {
                        console.log(`URL Worker creation failed, trying direct path`, urlError);
                        worker = new Worker(workerPath, { type: 'module' });
                    } else {
                        throw urlError;
                    }
                }

                // Add error listener to the worker
                worker.onerror = (event) => {
                    console.error(`Worker error:`, event);
                };

                console.log(`Worker created successfully`);

                // Create a comlink proxy to the worker
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const proxy = Comlink.wrap<any>(worker);
                console.log(`Comlink proxy created`);

                // Initialize the plugin with its settings
                console.log(`Initializing plugin ${pluginId}`);
                try {
                    // Add timeout to prevent hanging if initialize never resolves
                    const initializePromise = proxy.setSettings(config.settings || {})
                        .then(() => {
                            console.log(`Settings applied to plugin ${pluginId}`);
                            return proxy.initialize();
                        });

                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Plugin initialization timed out')), 10000);
                    });

                    await Promise.race([initializePromise, timeoutPromise]);
                    console.log(`Plugin ${pluginId} initialized successfully`);
                } catch (initError) {
                    console.error(`Failed to initialize plugin ${pluginId}:`, initError);
                    worker.terminate();
                    throw initError;
                }

                // Register the plugin with UI and background components being optional
                const loadedPlugin: LoadedPlugin = {
                    id: pluginId,
                    name: config.name || pluginId,
                    config,
                    worker,
                    proxy,
                    hasUI: Boolean(config.ui && config.ui.entryPoint),
                    hasBackground: Boolean(config.background && config.background.entryPoint)
                };

                this.registry.registerPlugin(loadedPlugin);
                console.log(`Plugin ${config.name || pluginId} loaded successfully with hasUI=${loadedPlugin.hasUI}, hasBackground=${loadedPlugin.hasBackground}`);

                return loadedPlugin;
            } catch (workerError) {
                console.error(`Failed to create worker for plugin ${pluginId}:`, workerError);
                if (worker) {
                    worker.terminate();
                }
                
                // In development mode, create a mock worker if needed
                if (!this.isProduction) {
                    console.log(`Creating mock worker for development testing`);
                    
                    // Create a blob-based worker that just provides minimal implementation
                    const mockWorkerCode = `
                        importScripts("https://unpkg.com/comlink/dist/umd/comlink.js");
                        
                        const mockPlugin = {
                            setSettings: async () => console.log("Mock setSettings called"),
                            initialize: async () => console.log("Mock initialize called"),
                            getData: async () => ({
                                counter: Math.floor(Math.random() * 100),
                                timestamp: new Date().toISOString(),
                                randomValue: Math.random() * 10,
                                count: Math.floor(Math.random() * 50),
                                incrementBy: 1,
                                lastUpdated: new Date().toISOString()
                            }),
                            incrementCounter: async () => console.log("Mock increment called"),
                            resetCounter: async () => console.log("Mock reset called")
                        };
                        
                        Comlink.expose(mockPlugin);
                    `;
                    
                    const blob = new Blob([mockWorkerCode], { type: 'application/javascript' });
                    const mockWorkerUrl = URL.createObjectURL(blob);
                    const mockWorker = new Worker(mockWorkerUrl, { type: 'module' });
                    
                    // Create a comlink proxy to the mock worker
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mockProxy = Comlink.wrap<any>(mockWorker);
                    
                    // Create a development-only plugin
                    const devPlugin: LoadedPlugin = {
                        id: pluginId,
                        name: `${config.name || pluginId} (Dev Mock)`,
                        config,
                        worker: mockWorker,
                        proxy: mockProxy,
                        hasUI: Boolean(config.ui && config.ui.entryPoint),
                        hasBackground: Boolean(config.background && config.background.entryPoint),
                        isDevelopmentMock: true
                    };
                    
                    this.registry.registerPlugin(devPlugin);
                    console.log(`Development mock plugin ${devPlugin.name} created`);
                    
                    return devPlugin;
                }
                
                throw workerError;
            }
        } catch (error) {
            console.error(`Failed to load plugin ${pluginId}:`, error);
            throw error;
        }
    }

    // Unload a plugin
    unloadPlugin(pluginId: string): void {
        this.registry.unregisterPlugin(pluginId);
    }

    // Unload all plugins
    unloadAllPlugins(): void {
        this.registry.cleanup();
    }
}

export default PluginLoader;