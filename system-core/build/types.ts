// Plugin configuration interfaces
export interface PluginConfig {
    id?: string;
    name?: string;
    description?: string;
    version?: string;
    ui?: {
        entryPoint: string;
    };
    background?: {
        entryPoint: string;
    };
    worker?: {
        entryPoint: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings?: Record<string, any>;
}

// Entry point information for build process
export interface PluginEntryPoint {
    pluginId: string;
    type: 'ui' | 'background' | 'worker';
    entryPath: string;
    outputPath: string;
    originalPath: string;
}

// Config file location information
export interface PluginConfigFile {
    configPath: string;
    relativePath: string;
}