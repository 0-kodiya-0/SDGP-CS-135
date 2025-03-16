import * as Comlink from "comlink";
import { PluginId, PluginConfig, PluginStatus, PermissionObject } from "../types";
import { PluginWorkerAPI } from "../pluginWorkerApi";
import { PluginWorkerErrorEvent } from "../types.event";
import createPluginApi from "../pluginApi";
import { PluginExecutionError } from "../types.error";
import { MessageTarget } from "../types.message";
import { validatePluginWorkerAPI } from "../utils/validatePluginWorkerAPI";

import pluginClient from "../api/pluginClientApi";
import pluginRegistry from "../pluginRegistry";
import eventBus from "../../../events";
import { pluginExecutorsLogger } from "../utils/logger";

const backgroundLogger = pluginExecutorsLogger.extend('background');

/**
 * BackgroundScriptExecutor - Responsible for executing plugin background scripts
 * Focuses solely on execution and uses registry for tracking
 */
export class BackgroundScriptExecutor {
  private static instance: BackgroundScriptExecutor;

  private constructor() {
    backgroundLogger('Background script executor initialized');
  }

  /**
   * Get the singleton instance of the BackgroundScriptExecutor
   */
  public static getInstance(): BackgroundScriptExecutor {
    if (!BackgroundScriptExecutor.instance) {
      BackgroundScriptExecutor.instance = new BackgroundScriptExecutor();
    }
    return BackgroundScriptExecutor.instance;
  }

  /**
   * Execute a plugin's background worker
   * 
   * @param pluginId The ID of the plugin to execute
   * @param config The plugin configuration
   * @param permissions The permissions object for the plugin
   * @param environmentId The current environment ID
   * @returns Promise resolving to the worker proxy or null if execution failed
   */
  public async executeWorker(
    pluginId: PluginId,
    config: PluginConfig,
    permissions: PermissionObject,
    environmentId: number
  ): Promise<Comlink.Remote<PluginWorkerAPI> | null> {
    backgroundLogger('Executing worker for plugin %s in environment %d', pluginId, environmentId);
    try {
      // Check if worker is already active in registry
      if (pluginRegistry.hasActiveWorker(pluginId)) {
        backgroundLogger('Worker for plugin %s is already active', pluginId);
        return pluginRegistry.getWorkerProxy(pluginId);
      }

      // Verify background entry point is defined
      if (!config.background || !config.background.entryPoint) {
        backgroundLogger('Plugin %s does not have a background entry point', pluginId);
        return null;
      }

      // Create and execute the worker
      backgroundLogger('Loading plugin worker for %s', pluginId);
      const workerResult = await this.loadPluginWorker(
        pluginId,
        config,
        permissions,
        environmentId
      );

      if (!workerResult) {
        backgroundLogger('Failed to load worker for plugin %s', pluginId);
        return null;
      }

      const { worker, proxy, blobUrl } = workerResult;

      // Register the worker with the registry
      backgroundLogger('Registering worker for plugin %s with registry', pluginId);
      pluginRegistry.registerWorker(pluginId, worker, proxy, blobUrl);

      backgroundLogger('Worker execution complete for plugin %s', pluginId);
      return proxy;
    } catch (error) {
      const execError = new PluginExecutionError(
        error instanceof Error ? error.message : String(error),
        pluginId
      );
      
      backgroundLogger('Error executing worker for plugin %s: %o', pluginId, execError);

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
    backgroundLogger('Stopping worker for plugin %s (reason: %s)', pluginId, reason);
    try {
      // Check if worker is active
      if (!pluginRegistry.hasActiveWorker(pluginId)) {
        backgroundLogger('No active worker found for plugin %s', pluginId);
        return false;
      }

      // Get worker proxy
      const proxy = pluginRegistry.getWorkerProxy(pluginId);

      // Call terminate method on the plugin if available
      if (proxy) {
        try {
          backgroundLogger('Calling terminate() on plugin %s', pluginId);
          await proxy.terminate();
        } catch (e) {
          backgroundLogger('Error calling terminate() on plugin %s: %o', pluginId, e);
        }
      }

      // Unregister worker (will handle termination and cleanup)
      backgroundLogger('Unregistering worker for plugin %s', pluginId);
      const result = pluginRegistry.unregisterWorker(pluginId, reason);
      
      if (result) {
        backgroundLogger('Worker successfully stopped for plugin %s', pluginId);
      } else {
        backgroundLogger('Failed to stop worker for plugin %s', pluginId);
      }
      
      return result;
    } catch (error) {
      const stopError = new PluginExecutionError(
        `Error stopping worker: ${error instanceof Error ? error.message : String(error)}`,
        pluginId
      );
      
      backgroundLogger('Error stopping worker for plugin %s: %o', pluginId, stopError);

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
    backgroundLogger('Stopping all plugin workers');
    // Get all active worker plugin IDs from registry
    const activePluginIds = pluginRegistry.getActivePluginIds();
    backgroundLogger('Found %d active workers to stop', activePluginIds.length);

    // Stop all workers
    for (const pluginId of activePluginIds) {
      await this.stopWorker(pluginId, 'system');
    }

    backgroundLogger('Stopped all plugin workers');
  }

  /**
   * Get the status of a plugin worker
   * 
   * @param pluginId Plugin ID
   * @returns Plugin status or null if not active
   */
  public async getWorkerStatus(pluginId: PluginId): Promise<PluginStatus | null> {
    backgroundLogger('Getting status for plugin worker %s', pluginId);
    try {
      // Get worker proxy from registry
      const proxy = pluginRegistry.getWorkerProxy(pluginId);

      if (!proxy) {
        backgroundLogger('No active worker found for plugin %s', pluginId);
        return null;
      }

      const status = await proxy.getStatus();
      backgroundLogger('Retrieved status for plugin %s: %o', pluginId, status);
      return status;
    } catch (error) {
      backgroundLogger('Error getting status for plugin %s: %o', pluginId, error);
      return null;
    }
  }

  /**
   * Load a plugin worker
   * 
   * @param pluginId The ID of the plugin
   * @param config The plugin configuration
   * @param permissions The permissions object for the plugin
   * @param environmentId The current environment ID
   * @returns Promise resolving to worker information or null if failed
   * @private
   */
  private async loadPluginWorker(
    pluginId: PluginId,
    config: PluginConfig,
    permissions: PermissionObject,
    environmentId: number
  ): Promise<{
    worker: Worker;
    proxy: Comlink.Remote<PluginWorkerAPI>;
    blobUrl?: string;
  } | null> {
    try {
      // Get the full path to the background entry point
      const entryPoint = config.background?.entryPoint;
      if (!entryPoint) {
        backgroundLogger('Plugin %s does not have a background entry point', pluginId);
        return null;
      }

      // Get the URL for the entry point
      const isInternal = !!config.internalPlugin;
      const bundleUrl = pluginClient.getEntryPointUrl(pluginId, entryPoint, isInternal);

      backgroundLogger('Loading plugin worker for %s from: %s', pluginId, bundleUrl);

      // Create a worker from the bundle URL
      const worker = new Worker(bundleUrl, { type: 'module' });
      backgroundLogger('Worker created for plugin %s', pluginId);

      // Add error listener
      worker.onerror = (event) => {
        backgroundLogger('Worker error for plugin %s: %s', pluginId, event.message);
        eventBus.emit('pluginWorkerError', {
          pluginId,
          error: event.message,
          timestamp: Date.now(),
          fatal: true
        } as PluginWorkerErrorEvent);
      };

      // Create a Comlink proxy to the worker that implements PluginWorkerAPI
      const proxy = Comlink.wrap<PluginWorkerAPI>(worker);
      backgroundLogger('Created Comlink proxy for plugin %s', pluginId);

      try {
        // Create API for the background script with proper source type
        const initialState = {}; // No initial state for background workers
        backgroundLogger('Creating API for background worker %s', pluginId);
        const pluginApi = createPluginApi(
          config,
          environmentId,
          initialState,
          MessageTarget.BACKGROUND // Use BACKGROUND as the source type
        );

        // Expose the API to the worker
        backgroundLogger('Exposing API to worker for plugin %s', pluginId);
        Comlink.expose(pluginApi, worker);

        // Verify that the required PluginWorkerAPI methods are implemented
        backgroundLogger('Validating worker API for plugin %s', pluginId);
        await validatePluginWorkerAPI(proxy, pluginId, 'Background worker');

        // Initialize the plugin worker once verified
        backgroundLogger('Initializing worker for plugin %s', pluginId);
        await proxy.initialize();

        backgroundLogger('Worker for plugin %s initialized successfully with API', pluginId);
      } catch (error) {
        const initError = new PluginExecutionError(
          `Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`,
          pluginId
        );
        
        backgroundLogger('Failed to initialize worker for plugin %s: %o', pluginId, initError);

        eventBus.emit('pluginWorkerError', {
          pluginId,
          error: initError.message,
          timestamp: Date.now(),
          fatal: true
        } as PluginWorkerErrorEvent);

        worker.terminate();
        backgroundLogger('Terminated worker due to initialization failure: %s', pluginId);
        return null;
      }

      return { worker, proxy };
    } catch (error) {
      const createError = new PluginExecutionError(
        `Failed to create worker: ${error instanceof Error ? error.message : String(error)}`,
        pluginId
      );
      
      backgroundLogger('Failed to create worker for plugin %s: %o', pluginId, createError);

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

export default BackgroundScriptExecutor.getInstance();