/**
 * Network API provider types
 */
export enum ProviderType {
    HTTP = 'http',
    WEBSOCKET = 'websocket',
    SOCKETIO = 'socketio'
}

/**
 * Options for the NetworkApi
 */
export interface NetworkApiOptions {
    /**
     * The type of network connection
     */
    type?: ProviderType;

    /**
     * Unique namespace for the connection
     */
    namespace: string;

    /**
     * Base URL for the connection, mostly used for HTTP
     */
    baseUrl?: string;

    /**
     * Request timeout in milliseconds
     */
    timeout?: number;

    /**
     * HTTP headers
     */
    headers?: Record<string, string>;

    /**
     * Whether to include credentials with the request
     */
    withCredentials?: boolean;
}