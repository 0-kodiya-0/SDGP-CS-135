import * as Comlink from "comlink";
import { createPluginWorkerApi } from "./pluginApi";
import permissionManager from "./pluginPermissionManager";
import { PluginRegistry } from "./pluginRegister";
import { PluginId, PluginConfig } from "./types";

/**
 * PluginExecutor - Responsible for securely executing plugin workers
 * 
 * This class handles:
 * 1. Creating and managing web workers for plugin background processes
 * 2. Emitting events for UI components to respond to
 * 3. Injecting the appropriate API into execution context
 * 4. Enforcing security boundaries
 */
class PluginExecutor {
    private static instance: PluginExecutor;
    private registry: PluginRegistry;

    // Track active workers
    private activeWorkers: Map<PluginId, {
        worker: Worker,
        proxy: Comlink.Remote<PluginWorkerAPI>
    }> = new Map();

    private constructor() {
        this.registry = PluginRegistry.getInstance();
        console.log('Plugin executor initialized');
    }

    /**
     * Get the singleton instance of the PluginExecutor
     */
    public static getInstance(): PluginExecutor {
        if (!PluginExecutor.instance) {
            PluginExecutor.instance = new PluginExecutor();
        }
        return PluginExecutor.instance;
    }

    /**
     * Execute a plugin's background worker
     * 
     * @param pluginId The ID of the plugin to execute
     * @returns Promise resolving to the worker proxy or null if execution failed
     */
    public async executeWorker(pluginId: PluginId): Promise<Comlink.Remote<PluginWorkerAPI> | null> {
        try {
            // Check if worker is already active
            if (this.activeWorkers.has(pluginId)) {
                console.log(`Worker for plugin ${pluginId} is already active`);
                return this.activeWorkers.get(pluginId)?.proxy || null;
            }

            // Check if plugin is registered and approved
            if (!this.registry.isPluginRegistered(pluginId)) {
                console.error(`Plugin ${pluginId} is not registered`);
                return null;
            }

            if (!this.registry.isPluginApproved(pluginId)) {
                console.error(`Plugin ${pluginId} is not approved`);
                return null;
            }

            // Get plugin configuration
            const config = this.registry.getPluginConfig(pluginId);
            if (!config) {
                console.error(`Failed to get configuration for plugin ${pluginId}`);
                return null;
            }

            // Verify worker entry point is defined
            if (!config.worker || !config.worker.entryPoint) {
                console.error(`Plugin ${pluginId} does not have a worker entry point`);
                return null;
            }

            // Create and execute the worker
            const workerProxy = await this.createSecureWorker(pluginId, config);

            // Emit event to notify UI components that a worker has been started
            eventBus.emit('pluginWorkerStarted', { pluginId, config });

            return workerProxy;
        } catch (error) {
            console.error(`Failed to execute worker for plugin ${pluginId}:`, error);
            return null;
        }
    }

    /**
     * Stop a plugin's background worker
     * 
     * @param pluginId The ID of the plugin to stop
     * @returns true if the worker was stopped
     */
    public stopWorker(pluginId: PluginId): boolean {
        try {
            const workerInfo = this.activeWorkers.get(pluginId);

            if (!workerInfo) {
                console.log(`No active worker found for plugin ${pluginId}`);
                return false;
            }

            // Terminate the worker
            workerInfo.worker.terminate();
            this.activeWorkers.delete(pluginId);

            // Emit event to notify UI components that a worker has been stopped
            eventBus.emit('pluginWorkerStopped', { pluginId });

            console.log(`Terminated worker for plugin ${pluginId}`);
            return true;
        } catch (error) {
            console.error(`Error stopping worker for plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Stop all workers
     */
    public stopAllWorkers(): void {
        // Stop all workers
        for (const pluginId of this.activeWorkers.keys()) {
            this.stopWorker(pluginId);
        }

        console.log('Stopped all plugin workers');
    }

    /**
     * Notify UI components that they should display a plugin UI
     * 
     * @param pluginId The ID of the plugin
     * @param uiType The type of UI to display ('default', 'summary', or 'expanded')
     * @returns true if the notification was sent
     */
    public notifyUiDisplay(pluginId: PluginId, uiType: 'default' | 'summary' | 'expanded' = 'default'): boolean {
        try {
            // Check if plugin is registered and approved
            if (!this.registry.isPluginRegistered(pluginId)) {
                console.error(`Plugin ${pluginId} is not registered`);
                return false;
            }

            if (!this.registry.isPluginApproved(pluginId)) {
                console.error(`Plugin ${pluginId} is not approved`);
                return false;
            }

            // Get plugin configuration
            const config = this.registry.getPluginConfig(pluginId);
            if (!config) {
                console.error(`Failed to get configuration for plugin ${pluginId}`);
                return false;
            }

            // Determine which UI entry point to use
            let entryPoint: string | undefined;

            switch (uiType) {
                case 'summary':
                    entryPoint = config.ui?.summaryView;
                    break;
                case 'expanded':
                    entryPoint = config.ui?.expandView;
                    break;
                default:
                    entryPoint = config.ui?.entryPoint;
            }

            if (!entryPoint) {
                console.error(`Plugin ${pluginId} does not have the requested UI component (${uiType})`);
                return false;
            }

            // Get the path to the UI file
            const basePath = config._meta?.basePath || pluginId;
            const uiPath = `/plugins/${basePath}/${entryPoint}`;

            // Emit event to notify UI components that they should display a plugin UI
            eventBus.emit('pluginUiDisplay', {
                pluginId,
                config,
                uiType,
                uiPath
            });

            console.log(`Notified UI components to display UI for plugin ${pluginId} (${uiType})`);
            return true;
        } catch (error) {
            console.error(`Error notifying UI display for plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Notify UI components that they should hide a plugin UI
     * 
     * @param pluginId The ID of the plugin
     * @returns true if the notification was sent
     */
    public notifyUiHide(pluginId: PluginId): boolean {
        try {
            // Emit event to notify UI components that they should hide a plugin UI
            eventBus.emit('pluginUiHide', { pluginId });

            console.log(`Notified UI components to hide UI for plugin ${pluginId}`);
            return true;
        } catch (error) {
            console.error(`Error notifying UI hide for plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Check if a plugin worker is active
     * 
     * @param pluginId The ID of the plugin
     * @returns true if the worker is active
     */
    public isWorkerActive(pluginId: PluginId): boolean {
        return this.activeWorkers.has(pluginId);
    }

    /**
     * Get a proxy to a plugin worker
     * 
     * @param pluginId The ID of the plugin
     * @returns The worker proxy or null if not active
     */
    public getWorkerProxy(pluginId: PluginId): Comlink.Remote<PluginWorkerAPI> | null {
        return this.activeWorkers.get(pluginId)?.proxy || null;
    }

    /**
     * Get the number of active workers
     */
    public getActiveWorkerCount(): number {
        return this.activeWorkers.size;
    }

    /**
     * Get the IDs of all active workers
     */
    public getActiveWorkerIds(): PluginId[] {
        return Array.from(this.activeWorkers.keys());
    }

    /**
     * Create a secure web worker for a plugin
     * 
     * @param pluginId The ID of the plugin
     * @param config The plugin configuration
     * @returns Promise resolving to the worker proxy
     * @private
     */
    private async createSecureWorker(
        pluginId: PluginId,
        config: PluginConfig
    ): Promise<Comlink.Remote<PluginWorkerAPI> | null> {
        try {
            // Get the full path to the worker entry point
            const basePath = config._meta?.basePath || pluginId;
            const workerPath = `/plugins/${basePath}/${config.worker.entryPoint}`;

            console.log(`Creating worker for plugin ${pluginId} from: ${workerPath}`);

            // Create a worker wrapper script that injects our plugin API
            const workerWrapper = this.createWorkerWrapper(pluginId, config.name, workerPath);

            // Create a blob URL for the wrapper script
            const blob = new Blob([workerWrapper], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);

            // Create the worker from the blob URL
            const worker = new Worker(blobUrl, { type: 'module' });

            // Add error listener
            worker.onerror = (event) => {
                console.error(`Worker error for plugin ${pluginId}:`, event);
                eventBus.emit('pluginWorkerError', {
                    pluginId,
                    error: event.message
                });
            };

            // Create a Comlink proxy to the worker
            const proxy = Comlink.wrap<PluginWorkerAPI>(worker);

            // Initialize the worker with the plugin's settings
            try {
                await proxy.setSettings(config.settings || {});
                await proxy.initialize();
                console.log(`Worker for plugin ${pluginId} initialized successfully`);
            } catch (error) {
                console.error(`Failed to initialize worker for plugin ${pluginId}:`, error);
                worker.terminate();
                URL.revokeObjectURL(blobUrl);
                eventBus.emit('pluginWorkerError', {
                    pluginId,
                    error: 'Failed to initialize worker: ' + (error as Error).message
                });
                return null;
            }

            // Store the active worker
            this.activeWorkers.set(pluginId, { worker, proxy });

            // Clean up the blob URL
            URL.revokeObjectURL(blobUrl);

            return proxy;
        } catch (error) {
            console.error(`Failed to create worker for plugin ${pluginId}:`, error);
            eventBus.emit('pluginWorkerError', {
                pluginId,
                error: 'Failed to create worker: ' + (error as Error).message
            });
            return null;
        }
    }

    /**
     * Create a worker wrapper script that injects the plugin API
     * 
     * @param pluginId The ID of the plugin
     * @param pluginName The name of the plugin
     * @param workerPath The path to the worker entry point
     * @returns Worker wrapper script as a string
     * @private
     */
    private createWorkerWrapper(pluginId: PluginId, pluginName: string, workerPath: string): string {
        // Get the plugin's permissions
        const permissions = permissionManager.getPluginPermissions(pluginId) || {};

        // Create the wrapper script
        return `
            // Import Comlink for communication
            importScripts('https://unpkg.com/comlink/dist/umd/comlink.js');
            
            // Create a secure environment for the plugin
            (async function() {
                try {
                    // Plugin API object - will be injected into the plugin's scope
                    const pluginApi = ${JSON.stringify(createPluginWorkerApi(pluginId, pluginName, permissions))};
                    
                    // Create a secure scope for the plugin
                    const secureScope = {
                        // Plugin API is exposed to the plugin
                        plugin: pluginApi.plugin,
                        storage: pluginApi.storage,
                        
                        // Restrict access to global objects
                        console: {
                            log: (...args) => console.log(\`[Plugin ${pluginId}]\`, ...args),
                            info: (...args) => console.info(\`[Plugin ${pluginId}]\`, ...args),
                            warn: (...args) => console.warn(\`[Plugin ${pluginId}]\`, ...args),
                            error: (...args) => console.error(\`[Plugin ${pluginId}]\`, ...args)
                        },
                        
                        // Import necessary globals, but restrict others
                        self: undefined,
                        window: undefined,
                        document: undefined,
                        fetch: ${permissions.network?.http ? 'fetch.bind(self)' : 'undefined'},
                        setTimeout: setTimeout.bind(self),
                        clearTimeout: clearTimeout.bind(self),
                        setInterval: setInterval.bind(self),
                        clearInterval: clearInterval.bind(self),
                        
                        // Provide minimal Comlink functionality for messaging
                        Comlink: {
                            expose: self.Comlink.expose,
                            proxy: self.Comlink.proxy
                        }
                    };
                    
                    // Create a secure import function
                    secureScope.importScripts = (url) => {
                        // Only allow importing from same origin or specific CDNs
                        if (url.startsWith('/') || 
                            url.startsWith('https://unpkg.com/') || 
                            url.startsWith('https://cdn.jsdelivr.net/')) {
                            return importScripts(url);
                        }
                        throw new Error(\`Importing from \${url} is not allowed\`);
                    };
                    
                    // Load the plugin worker in the secure scope
                    const response = await fetch('${workerPath}');
                    if (!response.ok) {
                        throw new Error(\`Failed to load worker from ${workerPath}: \${response.status} \${response.statusText}\`);
                    }
                    
                    const workerCode = await response.text();
                    
                    // Execute the worker code in the secure scope
                    const secureWorker = new Function(...Object.keys(secureScope), workerCode);
                    secureWorker(...Object.values(secureScope));
                    
                    // The plugin should have exposed its API via Comlink
                    // We'll re-expose it to the main thread
                    console.log(\`[Plugin ${pluginId}] Worker loaded successfully\`);
                } catch (error) {
                    console.error(\`[Plugin ${pluginId}] Worker initialization error:\`, error);
                    // Expose a fallback API with error reporting
                    self.Comlink.expose({
                        setSettings: async () => { throw error; },
                        initialize: async () => { throw error; }
                    });
                }
            })();
        `;
    }
}

export default PluginExecutor;