/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Socket, ManagerOptions, SocketOptions, io } from 'socket.io-client';
import { NetworkApiOptions, ProviderType } from './types';

/**
 * Network API for handling HTTP, WebSocket, and Socket.IO communications
 */
export class NetworkApi {
    private connections: Map<string, { type: ProviderType, instance: any }> = new Map();
    private static instance: NetworkApi;

    /**
     * Create a new NetworkApi instance
     */
    private constructor() {
        // No default initialization needed
    }

    public static getInstance() {
        if (!NetworkApi.instance) {
            NetworkApi.instance = new NetworkApi();
        }
        return NetworkApi.instance;
    }

    // HTTP Methods

    private genNamespace(namespace: string): string {
        return `${ProviderType.WEBSOCKET}:${namespace}`;
    }

    /**
     * Create a custom axios instance
     * @param options Network options with namespace
     * @param config Additional Axios configuration
     * @returns The axios instance
     */
    createAxiosInstance(options: NetworkApiOptions, config: AxiosRequestConfig = {}): AxiosInstance {
        const namespace = this.genNamespace(options.namespace);

        if (this.connections.has(namespace)) {
            this.removeConnection(namespace);
        }

        // Merge options into config
        const mergedConfig: AxiosRequestConfig = {
            ...config,
            baseURL: options.baseUrl,
            timeout: options.timeout,
            headers: options.headers,
            withCredentials: options.withCredentials
        };

        const instance = axios.create(mergedConfig);

        // Add response interceptor for common error handling
        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                // Sanitize error logging to avoid exposing sensitive data
                if (error.response) {
                    console.error('Response error:', error.response.status);
                } else if (error.request) {
                    console.error('Request error: Network issue');
                } else {
                    console.error('Error:', error.message);
                }
                return Promise.reject(error);
            }
        );

        this.connections.set(namespace, { type: ProviderType.HTTP, instance });
        return instance;
    }

    /**
     * Get an axios instance by its namespace
     * @param namespace Namespace for the axios instance
     * @returns The requested axios instance or undefined if not found
     */
    getAxiosInstance(namespace: string): AxiosInstance | undefined {
        namespace = this.genNamespace(namespace);
        
        const connection = this.connections.get(namespace);
        if (connection && connection.type === ProviderType.HTTP) {
            return connection.instance;
        }
        return undefined;
    }

    // WebSocket Methods

    /**
     * Create a WebSocket connection
     * @param options Network options with namespace
     * @param url WebSocket URL
     * @returns WebSocket connection
     */
    createWebSocket(options: NetworkApiOptions): WebSocket {
        const namespace = this.genNamespace(options.namespace);

        // Close existing connection if it exists
        if (this.connections.has(namespace)) {
            this.removeConnection(namespace);
        }

        const ws = new WebSocket(options.baseUrl || "http://localhost/");

        // Auto-remove connection when closed
        ws.addEventListener('close', () => {
            this.connections.delete(namespace);
        });

        this.connections.set(namespace, { type: ProviderType.WEBSOCKET, instance: ws });
        return ws;
    }

    /**
     * Get a connection by its ID
     * @param namespace Unique identifier for the connection
     * @returns Connection instance or undefined if not found
     */
    getConnection(namespace: string): any {
        namespace = this.genNamespace(namespace);

        const connection = this.connections.get(namespace);
        return connection ? connection.instance : undefined;
    }

    /**
     * Get a WebSocket connection by its ID
     * @param namespace Unique identifier for the WebSocket connection
     * @returns WebSocket or undefined if not found
     */
    getWebSocket(namespace: string): WebSocket | undefined {
        namespace = this.genNamespace(namespace);

        const connection = this.connections.get(namespace);
        if (connection && connection.type === ProviderType.WEBSOCKET) {
            return connection.instance;
        }
        return undefined;
    }

    // Socket.IO Methods

    /**
     * Create a Socket.IO connection
     * @param options Network options with namespace
     * @param url Socket.IO URL
     * @param socketOptions Additional Socket.IO options
     * @returns Socket.IO socket
     */
    createSocketIO(options: NetworkApiOptions, socketOptions: Partial<ManagerOptions & SocketOptions> = {}): Socket {
        const namespace = this.genNamespace(options.namespace);

        // Close existing connection if it exists
        if (this.connections.has(namespace)) {
            this.removeConnection(namespace);
        }

        const socket = io(options.baseUrl, socketOptions);

        // Auto-remove connection when disconnected
        socket.on('disconnect', () => {
            this.connections.delete(namespace);
        });

        this.connections.set(namespace, { type: ProviderType.SOCKETIO, instance: socket });
        return socket;
    }

    /**
     * Get a Socket.IO connection by its ID
     * @param namespace Unique identifier for the Socket.IO connection
     * @returns Socket.IO socket or undefined if not found
     */
    getSocketIO(namespace: string): Socket | undefined {
        namespace = this.genNamespace(namespace);

        const connection = this.connections.get(namespace);
        if (connection && connection.type === ProviderType.SOCKETIO) {
            return connection.instance;
        }
        return undefined;
    }

    /**
     * Remove a connection
     * @param namespace Unique identifier for the connection
     * @returns true if removal was successful
     */
    removeConnection(namespace: string): boolean {
        namespace = this.genNamespace(namespace);

        if (!this.connections.has(namespace)) {
            return false;
        }

        const { type, instance } = this.connections.get(namespace)!;

        switch (type) {
            case ProviderType.WEBSOCKET:
                if (instance && instance.readyState < 2) { // Not closing or closed
                    instance.close();
                }
                break;
            case ProviderType.SOCKETIO:
                if (instance && instance.connected) {
                    instance.disconnect();
                }
                break;
        }

        this.connections.delete(namespace);
        return true;
    }

    /**
     * Get all currently active connections
     * @returns Array of connection IDs
     */
    getActiveConnections(): string[] {
        return Array.from(this.connections.keys());
    }

    /**
     * Clean up all connections
     */
    cleanup(): void {
        for (const namespace of this.connections.keys()) {
            this.removeConnection(namespace);
        }
        this.connections.clear();
    }
}

export default NetworkApi.getInstance();