import * as Comlink from "comlink";
import { PluginId, PluginConfig, PluginStatus, PermissionObject } from "../types";
import { PluginWorkerAPI } from "../pluginWorkerApi";
import { PluginWorkerErrorEvent } from "../types.event";
import { exposePluginApi } from "../pluginApi";
import pluginClient from "../api/pluginClientApi";
import pluginRegistry from "../pluginRegistry";
import eventBus from "../../../events";
import { PluginExecutionError } from "../types.error";
import { MessageTarget } from "../types.message";

/**
 * BackgroundPluginExecutor - Responsible for executing plugin background workers
 * Focuses solely on execution and uses registry for tracking
 */
export class BackgroundPluginExecutor {
  private static instance: BackgroundPluginExecutor;

  private constructor() {
    console.log('Background plugin executor initialized');
  }

  /**
   * Get the singleton instance of the BackgroundPluginExecutor
   */
  public static getInstance(): BackgroundPluginExecutor {
    if (!BackgroundPluginExecutor.instance) {
      BackgroundPluginExecutor.instance = new BackgroundPluginExecutor();
    }
    return BackgroundPluginExecutor.instance;
  }

  /**
   * Execute a plugin's background worker
   * 
   * @param pluginId The ID of the plugin to execute
   * @param config The plugin configuration
   * @param permissions The permissions object for the plugin
   * @returns Promise resolving to the worker proxy or null if execution failed
   */
  public async executeWorker(
    pluginId: PluginId,
    config: PluginConfig,
    permissions: PermissionObject
  ): Promise<Comlink.Remote<PluginWorkerAPI> | null> {
    try {
      // Check if worker is already active in registry
      if (pluginRegistry.hasActiveWorker(pluginId)) {
        console.log(`Worker for plugin ${pluginId} is already active`);
        return pluginRegistry.getWorkerProxy(pluginId);
      }

      // Verify background entry point is defined
      if (!config.background || !config.background.entryPoint) {
        console.error(`Plugin ${pluginId} does not have a background entry point`);
        return null;
      }

      // Create and execute the worker
      const workerResult = await this.loadPluginWorker(pluginId, config, permissions);
      if (!workerResult) {
        return null;
      }

      const { worker, proxy, blobUrl } = workerResult;

      // Register the worker with the registry
      pluginRegistry.registerWorker(pluginId, worker, proxy, blobUrl);

      return proxy;
    } catch (error) {
      const execError = new PluginExecutionError(
        error instanceof Error ? error.message : String(error),
        pluginId
      );

      // Emit error event
      eventBus.emit('pluginWorkerError', {
        pluginId,
        error: execError.message,
        timestamp: Date.now()
      } as PluginWorkerErrorEvent);

      return null;
    }
  }

  /**
   * Stop a plugin's background worker
   * 
   * @param pluginId The ID of the plugin to stop
   * @param reason The reason for stopping the worker
   * @returns true if the worker was stopped
   */
  public async stopWorker(pluginId: PluginId, reason: 'user' | 'system' | 'error' = 'user'): Promise<boolean> {
    try {
      // Check if worker is active
      if (!pluginRegistry.hasActiveWorker(pluginId)) {
        console.log(`No active worker found for plugin ${pluginId}`);
        return false;
      }

      // Get worker proxy
      const proxy = pluginRegistry.getWorkerProxy(pluginId);

      // Call terminate method on the plugin if available
      if (proxy) {
        try {
          await proxy.terminate();
        } catch (e) {
          console.warn(`Error calling terminate() on plugin ${pluginId}:`, e);
        }
      }

      // Unregister worker (will handle termination and cleanup)
      return pluginRegistry.unregisterWorker(pluginId, reason);
    } catch (error) {
      const stopError = new PluginExecutionError(
        `Error stopping worker: ${error instanceof Error ? error.message : String(error)}`,
        pluginId
      );

      // Emit error event
      eventBus.emit('pluginWorkerError', {
        pluginId,
        error: stopError.message,
        timestamp: Date.now()
      } as PluginWorkerErrorEvent);

      return false;
    }
  }

  /**
   * Stop all workers
   */
  public async stopAllWorkers(): Promise<void> {
    // Get all active worker plugin IDs from registry
    const activePluginIds = pluginRegistry.getActivePluginIds();

    // Stop all workers
    for (const pluginId of activePluginIds) {
      await this.stopWorker(pluginId, 'system');
    }

    console.log('Stopped all plugin workers');
  }

  /**
   * Get the status of a plugin worker
   * 
   * @param pluginId Plugin ID
   * @returns Plugin status or null if not active
   */
  public async getWorkerStatus(pluginId: PluginId): Promise<PluginStatus | null> {
    try {
      // Get worker proxy from registry
      const proxy = pluginRegistry.getWorkerProxy(pluginId);

      if (!proxy) {
        console.error(`No active worker found for plugin ${pluginId}`);
        return null;
      }

      return await proxy.getStatus();
    } catch (error) {
      console.error(`Error getting status for plugin ${pluginId}:`, error);
      return null;
    }
  }

  /**
   * Load a plugin worker
   * 
   * @param pluginId The ID of the plugin
   * @param config The plugin configuration
   * @param permissions The permissions object for the plugin
   * @returns Promise resolving to worker information or null if failed
   * @private
   */
  private async loadPluginWorker(
    pluginId: PluginId,
    config: PluginConfig,
    permissions: PermissionObject
  ): Promise<{
    worker: Worker;
    proxy: Comlink.Remote<PluginWorkerAPI>;
    blobUrl?: string;
  } | null> {
    try {
      // Get the full path to the background entry point
      const entryPoint = config.background?.entryPoint;
      if (!entryPoint) {
        console.error(`Plugin ${pluginId} does not have a background entry point`);
        return null;
      }

      // Get the URL for the entry point
      const isInternal = !!config.internalPlugin;
      const bundleUrl = pluginClient.getEntryPointUrl(pluginId, entryPoint, isInternal);

      console.log(`Loading plugin worker for ${pluginId} from: ${bundleUrl}`);

      // Create a worker from the bundle URL
      const worker = new Worker(bundleUrl, { type: 'module' });

      // Add error listener
      worker.onerror = (event) => {
        console.error(`Worker error for plugin ${pluginId}:`, event);
        eventBus.emit('pluginWorkerError', {
          pluginId,
          error: event.message,
          timestamp: Date.now(),
          fatal: true
        } as PluginWorkerErrorEvent);
      };

      // Create a Comlink proxy to the worker
      const proxy = Comlink.wrap<PluginWorkerAPI>(worker);

      try {

        exposePluginApi(pluginId,
          config.name || pluginId,
          MessageTarget.BACKGROUND,
          permissions, worker);

        // Initialize the plugin
        await proxy.initialize();

        console.log(`Worker for plugin ${pluginId} initialized successfully with API`);
      } catch (error) {
        const initError = new PluginExecutionError(
          `Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`,
          pluginId
        );

        eventBus.emit('pluginWorkerError', {
          pluginId,
          error: initError.message,
          timestamp: Date.now(),
          fatal: true
        } as PluginWorkerErrorEvent);

        worker.terminate();
        return null;
      }

      return { worker, proxy };
    } catch (error) {
      const createError = new PluginExecutionError(
        `Failed to create worker: ${error instanceof Error ? error.message : String(error)}`,
        pluginId
      );

      eventBus.emit('pluginWorkerError', {
        pluginId,
        error: createError.message,
        timestamp: Date.now(),
        fatal: true
      } as PluginWorkerErrorEvent);

      return null;
    }
  }
}

export default BackgroundPluginExecutor.getInstance();