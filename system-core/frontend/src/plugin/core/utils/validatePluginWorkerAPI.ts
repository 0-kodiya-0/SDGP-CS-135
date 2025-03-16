import * as Comlink from "comlink";
import { PluginWorkerAPI } from "../pluginWorkerApi";
import { PluginId } from "../types";

/**
 * Validates that a proxy implements all required PluginWorkerAPI methods
 * 
 * @param proxy The Comlink proxy to check
 * @param pluginId The plugin ID (for error messages)
 * @param componentType The component type (background, summary, expand) for error messages
 * @returns Promise that resolves to true if valid or rejects with an error if invalid
 */
export async function validatePluginWorkerAPI(
    proxy: Comlink.Remote<PluginWorkerAPI>,
    pluginId: PluginId,
    componentType: string = 'plugin'
): Promise<boolean> {
    // Check that all required methods exist
    const requiredMethods = ['initialize', 'terminate', 'getStatus'];

    for (const method of requiredMethods) {
        try {
            // For Comlink proxies, we can't check typeof directly 
            // Instead, try to invoke Object.prototype.toString on the method
            // If the method exists, this will work, even if it's a proxy
            const methodExists = await new Promise(resolve => {
                try {
                    // Try accessing the method to see if it exists
                    // For Comlink proxies, this won't error if the method exists
                    const methodRef = proxy[method as keyof typeof proxy];
                    resolve(!!methodRef);
                } catch {
                    resolve(false);
                }
            });

            if (!methodExists) {
                throw new Error(
                    `${componentType} for ${pluginId} does not implement required PluginWorkerAPI method: ${method}`
                );
            }
        } catch {
            throw new Error(
                `${componentType} for ${pluginId} does not implement required PluginWorkerAPI method: ${method}`
            );
        }
    }

    return true;
}