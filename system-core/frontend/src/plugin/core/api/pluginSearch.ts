import pluginClient, { PluginClientApi } from './pluginClientApi';
import { PluginConfig } from '../types';
import { pluginSearchLogger } from '../utils/logger';

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
        pluginSearchLogger('PluginSearch initialized');
    }

    /**
     * Get singleton instance of the PluginSearch
     * @param clientApi Optional PluginClientApi instance
     */
    public static getInstance(clientApi?: PluginClientApi): PluginSearch {
        if (!PluginSearch.instance) {
            pluginSearchLogger('Creating PluginSearch singleton instance');
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
        pluginSearchLogger('Searching plugins with options: %o', {
            query: options.query,
            categories: options.categories?.length,
            tags: options.tags?.length,
            page: options.page,
            limit: options.limit,
            sortBy: options.sortBy,
            includeInternal: options.includeInternal,
            includeExternal: options.includeExternal
        });
        
        try {
            // Get the appropriate plugin lists based on options
            const promises: Promise<PluginConfig[]>[] = [];

            if (options.includeInternal !== false) {
                pluginSearchLogger('Including internal plugins in search');
                promises.push(this.clientApi.getInternalPlugins());
            }

            if (options.includeExternal !== false) {
                pluginSearchLogger('Including external plugins in search (page %d, limit %d)', 
                           options.page || 1, options.limit || 20);
                promises.push(this.clientApi.getExternalPlugins(options.page, options.limit));
            }

            // Get all plugins
            pluginSearchLogger('Fetching plugin data from sources');
            const pluginLists = await Promise.all(promises);
            let allPlugins: PluginConfig[] = pluginLists.flat();
            pluginSearchLogger('Retrieved %d total plugins before filtering', allPlugins.length);

            // Filter plugins by query
            if (options.query) {
                const query = options.query.toLowerCase();
                pluginSearchLogger('Filtering plugins by query: %s', options.query);
                
                const preFilterCount = allPlugins.length;
                allPlugins = allPlugins.filter(plugin =>
                    plugin.name.toLowerCase().includes(query) ||
                    plugin.description?.toLowerCase().includes(query)
                );
                
                pluginSearchLogger('Query filter matched %d/%d plugins', allPlugins.length, preFilterCount);
            }

            // Filter by categories if specified
            if (options.categories && options.categories.length > 0) {
                pluginSearchLogger('Filtering plugins by %d categories: %s', 
                            options.categories.length, options.categories.join(', '));
                
                const preFilterCount = allPlugins.length;
                allPlugins = allPlugins.filter(plugin =>
                    plugin.categories?.some(category =>
                        options.categories?.includes(category)
                    )
                );
                
                pluginSearchLogger('Category filter matched %d/%d plugins', allPlugins.length, preFilterCount);
            }

            // Filter by tags if specified
            if (options.tags && options.tags.length > 0) {
                pluginSearchLogger('Filtering plugins by %d tags: %s', 
                            options.tags.length, options.tags.join(', '));
                
                const preFilterCount = allPlugins.length;
                allPlugins = allPlugins.filter(plugin =>
                    plugin.tags?.some(tag =>
                        options.tags?.includes(tag)
                    )
                );
                
                pluginSearchLogger('Tag filter matched %d/%d plugins', allPlugins.length, preFilterCount);
            }

            // Sort plugins
            if (options.sortBy) {
                pluginSearchLogger('Sorting plugins by %s (%s)', 
                           options.sortBy, options.sortDirection || 'asc');
                
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
            
            pluginSearchLogger('Pagination: page %d, limit %d, returning %d/%d plugins', 
                       page, limit, paginatedPlugins.length, allPlugins.length);

            return {
                plugins: paginatedPlugins,
                total: allPlugins.length,
                page,
                limit,
                hasMore: endIndex < allPlugins.length
            };
        } catch (error) {
            pluginSearchLogger('Plugin search failed: %o', error);
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
        pluginSearchLogger('Getting plugin suggestions for query "%s" (limit: %d)', query, limit);
        try {
            const result = await this.searchPlugins({
                query,
                limit,
                includeInternal: true,
                includeExternal: true
            });

            pluginSearchLogger('Found %d plugin suggestions for query "%s"', result.plugins.length, query);
            return result.plugins;
        } catch (error) {
            pluginSearchLogger('Failed to get plugin suggestions for query "%s": %o', query, error);
            return [];
        }
    }

    /**
     * Get featured or recommended plugins
     * @param limit Maximum number of plugins to return
     * @returns Promise resolving to featured plugins
     */
    public async getFeaturedPlugins(limit: number = 5): Promise<PluginConfig[]> {
        pluginSearchLogger('Getting featured plugins (limit: %d)', limit);
        try {
            // For now, just return some internal plugins
            const internalPlugins = await this.clientApi.getInternalPlugins();
            const featuredPlugins = internalPlugins.slice(0, limit);
            
            pluginSearchLogger('Found %d featured plugins', featuredPlugins.length);
            return featuredPlugins;
        } catch (error) {
            pluginSearchLogger('Failed to get featured plugins: %o', error);
            return [];
        }
    }
}

// Export default singleton instance
export default PluginSearch.getInstance();