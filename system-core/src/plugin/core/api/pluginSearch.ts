import pluginClient, { PluginClientApi } from './pluginClientApi';
import { PluginConfig } from '../types';

export interface SearchOptions {
    query: string;
    categories?: string[];
    tags?: string[];
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'popularity' | 'updated' | 'created';
    sortDirection?: 'asc' | 'desc';
    includeInternal?: boolean;
    includeExternal?: boolean;
}

export interface SearchResult {
    plugins: PluginConfig[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Plugin Search service for finding and filtering plugins
 */
export class PluginSearch {
    private static instance: PluginSearch;
    private clientApi: PluginClientApi;

    /**
     * Create a new PluginSearch instance
     * @param clientApi The PluginClientApi instance to use
     */
    private constructor(clientApi: PluginClientApi) {
        this.clientApi = clientApi;
    }

    /**
     * Get singleton instance of the PluginSearch
     * @param clientApi Optional PluginClientApi instance
     */
    public static getInstance(clientApi?: PluginClientApi): PluginSearch {
        if (!PluginSearch.instance) {
            PluginSearch.instance = new PluginSearch(clientApi || pluginClient);
        }
        return PluginSearch.instance;
    }

    /**
     * Search for plugins with the given criteria
     * @param options Search options
     * @returns Promise resolving to search results
     */
    public async searchPlugins(options: SearchOptions): Promise<SearchResult> {
        try {
            // Get the appropriate plugin lists based on options
            const promises: Promise<PluginConfig[]>[] = [];

            if (options.includeInternal !== false) {
                promises.push(this.clientApi.getInternalPlugins());
            }

            if (options.includeExternal !== false) {
                promises.push(this.clientApi.getExternalPlugins(options.page, options.limit));
            }

            // Get all plugins
            const pluginLists = await Promise.all(promises);
            let allPlugins: PluginConfig[] = pluginLists.flat();

            // Filter plugins by query
            if (options.query) {
                const query = options.query.toLowerCase();
                allPlugins = allPlugins.filter(plugin =>
                    plugin.name.toLowerCase().includes(query) ||
                    plugin.description?.toLowerCase().includes(query)
                );
            }

            // Filter by categories if specified
            if (options.categories && options.categories.length > 0) {
                allPlugins = allPlugins.filter(plugin =>
                    plugin.categories?.some(category =>
                        options.categories?.includes(category)
                    )
                );
            }

            // Filter by tags if specified
            if (options.tags && options.tags.length > 0) {
                allPlugins = allPlugins.filter(plugin =>
                    plugin.tags?.some(tag =>
                        options.tags?.includes(tag)
                    )
                );
            }

            // Sort plugins
            if (options.sortBy) {
                allPlugins.sort((a, b) => {
                    const aValue = a[options.sortBy as keyof PluginConfig];
                    const bValue = b[options.sortBy as keyof PluginConfig];

                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                        return options.sortDirection === 'desc'
                            ? bValue.localeCompare(aValue)
                            : aValue.localeCompare(bValue);
                    }

                    if (typeof aValue === 'number' && typeof bValue === 'number') {
                        return options.sortDirection === 'desc'
                            ? bValue - aValue
                            : aValue - bValue;
                    }

                    return 0;
                });
            }

            // Calculate pagination
            const page = options.page || 1;
            const limit = options.limit || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedPlugins = allPlugins.slice(startIndex, endIndex);

            return {
                plugins: paginatedPlugins,
                total: allPlugins.length,
                page,
                limit,
                hasMore: endIndex < allPlugins.length
            };
        } catch (error) {
            console.error('Plugin search failed:', error);
            return {
                plugins: [],
                total: 0,
                page: options.page || 1,
                limit: options.limit || 20,
                hasMore: false
            };
        }
    }

    /**
     * Get plugin suggestions based on a partial query
     * @param query Partial search query
     * @param limit Maximum number of suggestions to return
     * @returns Promise resolving to suggested plugins
     */
    public async getPluginSuggestions(query: string, limit: number = 5): Promise<PluginConfig[]> {
        try {
            const result = await this.searchPlugins({
                query,
                limit,
                includeInternal: true,
                includeExternal: true
            });

            return result.plugins;
        } catch (error) {
            console.error('Failed to get plugin suggestions:', error);
            return [];
        }
    }

    /**
     * Get featured or recommended plugins
     * @param limit Maximum number of plugins to return
     * @returns Promise resolving to featured plugins
     */
    public async getFeaturedPlugins(limit: number = 5): Promise<PluginConfig[]> {
        try {
            // For now, just return some internal plugins
            const internalPlugins = await this.clientApi.getInternalPlugins();
            return internalPlugins.slice(0, limit);
        } catch (error) {
            console.error('Failed to get featured plugins:', error);
            return [];
        }
    }
}

// Export default singleton instance
export default PluginSearch.getInstance();