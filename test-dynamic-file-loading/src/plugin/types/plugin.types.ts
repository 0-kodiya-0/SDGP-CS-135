/* eslint-disable @typescript-eslint/no-explicit-any */
// src/plugin/types/plugin.types.ts

// Plugin configuration interface
export interface PluginConfig {
    id: string;
    name: string;
    description?: string;
    version?: string;
    ui?: {
        entryPoint: string;
    };
    background?: {
        entryPoint: string;
    };
    worker: {
        entryPoint: string;
    };
    settings?: Record<string, any>;
}

export interface LoadedPlugin {
    id: string;
    name: string;
    config: PluginConfig;
    worker: Worker;
    proxy: any;
    hasUI?: boolean;
    hasBackground?: boolean;
    isDevelopmentMock?: boolean; // Flag to indicate a mock plugin in development
}

// Props passed to plugin UI components
export interface PluginUIProps {
    pluginId: string;
    proxy: any; // Proxy to the worker
}

export interface PluginAPI {
    getData: () => Promise<any>;
    initialize: () => Promise<void>;
}