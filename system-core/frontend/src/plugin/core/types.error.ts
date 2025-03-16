import { PluginId } from "./types";

/**
 * Error types for plugins
 */
export class PluginError extends Error {
    pluginId?: PluginId;
    
    constructor(message: string, pluginId?: PluginId) {
        super(message);
        this.name = 'PluginError';
        this.pluginId = pluginId;
    }
}

export class PluginLoadError extends PluginError {
    constructor(message: string, pluginId?: PluginId) {
        super(message, pluginId);
        this.name = 'PluginLoadError';
    }
}

export class PluginExecutionError extends PluginError {
    constructor(message: string, pluginId?: PluginId) {
        super(message, pluginId);
        this.name = 'PluginExecutionError';
    }
}

export class PluginPermissionError extends PluginError {
    constructor(operation: string, pluginId?: PluginId) {
        super(`Permission denied: Operation "${operation}" requires appropriate permissions`, pluginId);
        this.name = 'PluginPermissionError';
    }
}