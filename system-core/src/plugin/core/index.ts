// src/plugin/index.ts
export { default as pluginManager } from './pluginManager';
export { default as pluginRegistry } from './pluginRegistry';

// Plugin API and client
export { default as pluginClient } from './api/pluginClientApi';
export { default as pluginSearch } from './api/pluginSearch';

// Plugin executors
export * from './executors';

// React context and hooks
export {
    PluginProvider,
    usePlugins,
    PluginContext
} from './context/pluginContext';

// UI components
export { default as PluginManagerUI } from './ui/PluginManagerUI';

// Types
export * from './types';