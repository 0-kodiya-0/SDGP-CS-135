import debug from 'debug';

/**
 * Logger namespace prefix for all application logs
 */
const APP_NAMESPACE = 'app';

/**
 * Enable all debug logs for development/testing
 * In production, this should be controlled by environment variables
 */
if (process.env.NODE_ENV !== 'production') {
  debug.enable(`${APP_NAMESPACE}:*`);
}

/**
 * Creates a logger instance for the specified namespace
 * @param namespace The specific component/module namespace
 * @returns A debug logger instance
 */
export function createLogger(namespace: string) {
  return debug(`${APP_NAMESPACE}:${namespace}`);
}

// Export pre-configured loggers for main components
export const storageLogger = createLogger('storage');
export const filesLogger = createLogger('fileSystem');
export const stateLogger = createLogger('state');
export const apiLogger = createLogger('api');

// Export debug package for advanced configuration if needed
export { debug };