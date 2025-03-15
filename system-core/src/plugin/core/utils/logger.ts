// src/plugin/logger.ts
import { createLogger } from '../../../api/logger';

// Create dedicated loggers for each plugin system component
export const pluginLogger = createLogger('plugin');

// Specialized loggers for specific plugin system components
export const pluginManagerLogger = pluginLogger.extend('manager');
export const pluginRegistryLogger = pluginLogger.extend('registry');
export const pluginApiLogger = pluginLogger.extend('api');
export const pluginMessageLogger = pluginLogger.extend('message');
export const pluginLoaderLogger = pluginLogger.extend('loader');
export const pluginExecutorsLogger = pluginLogger.extend('executor');
export const pluginContextLogger = pluginLogger.extend('context');
export const pluginClientApiLogger = pluginLogger.extend('clientApi');
export const pluginSearchLogger = pluginLogger.extend('search');

// Export the main logger and its extensions
export default pluginLogger;