import axios, { AxiosInstance } from 'axios';
import { PluginConfig, PluginId } from '../types';
import { pluginClientApiLogger } from '../utils/logger';

/**
 * Client API for interacting with the plugin server
 * Handles fetching plugin configurations and assets
 */
export class PluginClientApi {
    private static instance: PluginClientApi;
    private apiClient: AxiosInstance;
    private baseUrl: string;
    private pluginBasePath: string;

    /**
     * Create a new PluginClientApi instance
     * @param baseUrl Base URL for the plugin server
     * @param pluginBasePath Base path for internal plugins
     */
    private constructor(baseUrl: string = '/api/plugins', pluginBasePath: string = '/plugins') {
        this.baseUrl = baseUrl;
        this.pluginBasePath = pluginBasePath;
        pluginClientApiLogger('Initializing PluginClientApi with baseUrl=%s, pluginBasePath=%s', baseUrl, pluginBasePath);

        this.apiClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        pluginClientApiLogger('Created axios instance with baseURL=%s, timeout=%d', this.baseUrl, 10000);

        // Add response interceptor for error handling
        this.apiClient.interceptors.response.use(
            response => response,
            error => {
                pluginClientApiLogger('Plugin API error: %o', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    statusText: error.response?.statusText
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get singleton instance of the PluginClientApi
     * @param baseUrl Optional base URL for the plugin server
     * @param pluginBasePath Optional base path for internal plugins
     */
    public static getInstance(baseUrl?: string, pluginBasePath?: string): PluginClientApi {
        if (!PluginClientApi.instance) {
            pluginClientApiLogger('Creating PluginClientApi singleton instance');
            PluginClientApi.instance = new PluginClientApi(baseUrl, pluginBasePath);
        }
        return PluginClientApi.instance;
    }

    /**
     * Fetch a list of all available external plugins
     * @param page Page number for pagination
     * @param limit Number of results per page
     * @returns Promise resolving to an array of plugin metadata
     */
    public async getExternalPlugins(page: number = 1, limit: number = 20): Promise<PluginConfig[]> {
        pluginClientApiLogger('Fetching external plugins (page=%d, limit=%d)', page, limit);
        try {
            const response = await this.apiClient.get('/external', {
                params: { page, limit }
            });
            pluginClientApiLogger('Retrieved %d external plugins', response.data.length);
            return response.data;
        } catch (error) {
            pluginClientApiLogger('Failed to fetch external plugins: %o', error);
            return [];
        }
    }

    /**
     * Get internal plugins is no longer handled by the API
     * This is now done directly by the InternalPluginLoader
     * @deprecated Use InternalPluginLoader.loadAllPlugins() instead
     */
    public async getInternalPlugins(): Promise<PluginConfig[]> {
        pluginClientApiLogger('DEPRECATED: getInternalPlugins called. Use InternalPluginLoader.loadAllPlugins() instead.');
        return [];
    }

    /**
     * Fetch a specific plugin's configuration
     * @param pluginId ID of the plugin to fetch
     * @param isInternal Whether the plugin is internal
     * @returns Promise resolving to the plugin configuration
     */
    public async getPluginConfig(pluginId: PluginId, isInternal: boolean = true): Promise<PluginConfig | null> {
        pluginClientApiLogger('Getting plugin config for %s (internal: %s)', pluginId, isInternal);
        try {
            // For internal plugins, loading is now handled by InternalPluginLoader
            if (isInternal) {
                pluginClientApiLogger('getPluginConfig for internal plugin %s is deprecated. Use InternalPluginLoader directly.', pluginId);
                return null;
            }

            // External plugin API calls remain unchanged
            pluginClientApiLogger('Fetching external plugin config for %s', pluginId);
            const response = await this.apiClient.get(`/external/${pluginId}/config`);
            pluginClientApiLogger('Successfully retrieved config for plugin %s', pluginId);
            return response.data;
        } catch (error) {
            pluginClientApiLogger('Failed to fetch plugin config for %s: %o', pluginId, error);
            return null;
        }
    }

    /**
     * Check if all required files for a plugin exist
     * @param pluginId ID of the plugin to check
     * @param pluginConfig Plugin configuration
     * @returns Promise resolving to an object containing validation results
     */
    public async validatePluginFiles(
        pluginId: PluginId,
        pluginConfig: PluginConfig
    ): Promise<{ valid: boolean; missingFiles: string[] }> {
        pluginClientApiLogger('Validating files for plugin %s', pluginId);
        try {
            // For internal plugins, we're skipping validation
            if (pluginConfig.internalPlugin) {
                pluginClientApiLogger('Skipping validation for internal plugin %s', pluginId);
                return { valid: true, missingFiles: [] };
            }

            // For external plugins, keep the validation
            pluginClientApiLogger('Validating external plugin %s files', pluginId);
            const response = await this.apiClient.post(`/validate/${pluginId}`, pluginConfig);

            const result = response.data;
            if (result.valid) {
                pluginClientApiLogger('Plugin %s files validated successfully', pluginId);
            } else {
                pluginClientApiLogger('Plugin %s validation failed, missing files: %o', pluginId, result.missingFiles);
            }

            return result;
        } catch (error) {
            pluginClientApiLogger('Failed to validate plugin files for %s: %o', pluginId, error);
            return { valid: false, missingFiles: ['Failed to validate due to error'] };
        }
    }

    /**
     * Fetch global plugin configuration
     * @returns Promise resolving to the global plugin configuration
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async getGlobalConfig(): Promise<any> {
        pluginClientApiLogger('Fetching global plugin configuration from %s', `${this.pluginBasePath}/plugin.global.conf.json`);
        try {
            const response = await fetch(`${this.pluginBasePath}/plugin.global.conf.json`);
            if (!response.ok) {
                pluginClientApiLogger('Failed to load global plugin config: %s', response.statusText);
                throw new Error(`Failed to load global plugin config: ${response.statusText}`);
            }

            const config = await response.json();
            pluginClientApiLogger('Successfully loaded global plugin config with %d plugins',
                config.plugins ? config.plugins.length : 0);
            return config;
        } catch (error) {
            pluginClientApiLogger('Failed to fetch global plugin configuration: %o', error);
            return null;
        }
    }

    /**
     * Check if a plugin exists
     * @param pluginId ID of the plugin to check
     * @param isInternal Whether the plugin is internal
     * @returns Promise resolving to a boolean indicating if the plugin exists
     */
    public async pluginExists(pluginId: PluginId, isInternal: boolean = true): Promise<boolean> {
        pluginClientApiLogger('Checking if plugin %s exists (internal: %s)', pluginId, isInternal);
        try {
            // For internal plugins, check the global config
            if (isInternal) {
                pluginClientApiLogger('Checking internal plugin %s existence in global config', pluginId);
                const globalConfig = await this.getGlobalConfig();
                if (!globalConfig || !globalConfig.plugins) {
                    pluginClientApiLogger('Global config missing or has no plugins');
                    return false;
                }

                const exists = globalConfig.plugins.some((p: any) => p.id === pluginId && p.enabled !== false);
                pluginClientApiLogger('Internal plugin %s %s', pluginId, exists ? 'exists' : 'does not exist');
                return exists;
            }

            // External plugin API calls remain unchanged
            pluginClientApiLogger('Checking external plugin %s existence via API', pluginId);
            const response = await this.apiClient.head(`/external/${pluginId}`);
            const exists = response.status === 200;
            pluginClientApiLogger('External plugin %s %s', pluginId, exists ? 'exists' : 'does not exist');
            return exists;
        } catch (error) {
            pluginClientApiLogger('Error checking if plugin %s exists: %o', pluginId, error);
            return false;
        }
    }

    /**
     * Get the URL for a plugin asset
     * @param pluginId Plugin ID
     * @param assetPath Path to the asset relative to the plugin root
     * @param isInternal Whether the plugin is internal
     * @returns URL to the asset
     */
    public getAssetUrl(pluginId: PluginId, assetPath: string, isInternal: boolean = true): string {
        let url;
        if (isInternal) {
            // For internal plugins, return the direct path to the public directory
            url = `${this.pluginBasePath}/${pluginId}/${assetPath}`;
        } else {
            // For external plugins, use the API endpoint
            url = `${this.baseUrl}/external/${pluginId}/assets/${assetPath}`;
        }

        pluginClientApiLogger('Generated asset URL for plugin %s: %s (internal: %s)', pluginId, url, isInternal);
        return url;
    }

    /**
     * Get plugin entry point URL
     * @param pluginId Plugin ID
     * @param entryPoint Entry point path 
     * @param isInternal Whether the plugin is internal
     * @returns URL to the entry point
     */
    public getEntryPointUrl(pluginId: PluginId, entryPoint: string, isInternal: boolean = true): string {
        const basePluginsUrl = new URL('../../../../plugins/', import.meta.url);
        const url = new URL(`plugins/${pluginId}/dist/${entryPoint}`, basePluginsUrl.toString());

        pluginClientApiLogger('Generated entry point URL for plugin %s: %s (entryPoint: %s, internal: %s)',
            pluginId, url.toString(), entryPoint, isInternal);
        return url.toString();
    }
}

// Export default singleton instance
export default PluginClientApi.getInstance();