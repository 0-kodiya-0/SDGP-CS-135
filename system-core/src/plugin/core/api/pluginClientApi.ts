import axios, { AxiosInstance } from 'axios';
import { PluginConfig, PluginId } from '../types';

/**
 * Client API for interacting with the plugin server
 * Handles fetching plugin configurations and assets
 */
export class PluginClientApi {
    private static instance: PluginClientApi;
    private apiClient: AxiosInstance;
    private baseUrl: string;

    /**
     * Create a new PluginClientApi instance
     * @param baseUrl Base URL for the plugin server
     */
    private constructor(baseUrl: string = '/api/plugins') {
        this.baseUrl = baseUrl;
        this.apiClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add response interceptor for error handling
        this.apiClient.interceptors.response.use(
            response => response,
            error => {
                console.error('Plugin API error:', error);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get singleton instance of the PluginClientApi
     * @param baseUrl Optional base URL for the plugin server
     */
    public static getInstance(baseUrl?: string): PluginClientApi {
        if (!PluginClientApi.instance) {
            PluginClientApi.instance = new PluginClientApi(baseUrl);
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
        try {
            const response = await this.apiClient.get('/external', {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch external plugins:', error);
            return [];
        }
    }

    /**
     * Fetch a specific plugin's configuration
     * @param pluginId ID of the plugin to fetch
     * @param isInternal Whether the plugin is internal
     * @returns Promise resolving to the plugin configuration
     */
    public async getPluginConfig(pluginId: PluginId, isInternal: boolean = true): Promise<PluginConfig | null> {
        try {
            // For internal plugins, this method is no longer used
            // External plugin API calls remain unchanged
            if (isInternal) {
                console.warn('getPluginConfig for internal plugins is deprecated. Use InternalPluginLoader directly.');
                return null;
            }
            
            const response = await this.apiClient.get(`/external/${pluginId}/config`);
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch plugin config for ${pluginId}:`, error);
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
        try {
            // For internal plugins, this is no longer needed
            // For external plugins, keep the validation
            if (pluginConfig.internalPlugin) {
                console.warn('validatePluginFiles for internal plugins is deprecated.');
                return { valid: true, missingFiles: [] };
            }
            
            const response = await this.apiClient.post(`/validate/${pluginId}`, pluginConfig);
            return response.data;
        } catch (error) {
            console.error(`Failed to validate plugin files for ${pluginId}:`, error);
            return { valid: false, missingFiles: ['Failed to validate due to error'] };
        }
    }

    /**
     * Fetch global plugin configuration
     * @returns Promise resolving to the global plugin configuration
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async getGlobalConfig(): Promise<any> {
        try {
            const response = await this.apiClient.get('/global-config');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch global plugin configuration:', error);
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
        try {
            // For internal plugins, this method is no longer used
            // External plugin API calls remain unchanged
            if (isInternal) {
                console.warn('pluginExists for internal plugins is deprecated. Use InternalPluginLoader directly.');
                return false;
            }
            
            const response = await this.apiClient.head(`/external/${pluginId}`);
            return response.status === 200;
        } catch {
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
        if (isInternal) {
            // For internal plugins, return the direct path to the public directory
            // Assets are in the dist folder
            return `/plugins/${pluginId}/dist/assets/${assetPath}`;
        }
        
        // For external plugins, use the API endpoint
        return `${this.baseUrl}/external/${pluginId}/assets/${assetPath}`;
    }

    /**
     * Get plugin entry point URL
     * @param pluginId Plugin ID
     * @param entryPoint Entry point path 
     * @param isInternal Whether the plugin is internal
     * @returns URL to the entry point
     */
    public getEntryPointUrl(pluginId: PluginId, entryPoint: string, isInternal: boolean = true): string {
        if (isInternal) {
            // For internal plugins, return the direct path to the public directory
            // Entry points are in the dist folder
            return `/plugins/${pluginId}/dist/${entryPoint}`;
        }
        
        // For external plugins, use the API endpoint
        return `${this.baseUrl}/external/${pluginId}/${entryPoint}`;
    }
}

// Export default singleton instance
export default PluginClientApi.getInstance();