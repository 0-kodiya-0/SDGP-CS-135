/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/network/network-api.ts
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
    HttpProvider,
    NetworkApiOptions,
    SocketIOConnection,
    SocketIOProvider,
    WebSocketConnection,
    WebSocketProvider
} from './types';
import {
    AxiosHttpProvider,
    BrowserWebSocketProvider,
    SocketIOClientProvider
} from './providers';

/**
 * Network API for handling HTTP and WebSocket communications
 */
export class NetworkApi {
    private httpProvider: HttpProvider;
    private webSocketProvider: WebSocketProvider;
    private socketIOProvider: SocketIOProvider;

    /**
     * Create a new NetworkApi instance
     * @param options Configuration options
     */
    constructor(options: NetworkApiOptions = {}) {
        this.httpProvider = new AxiosHttpProvider(options);
        this.webSocketProvider = new BrowserWebSocketProvider();
        this.socketIOProvider = new SocketIOClientProvider();
    }

    /**
     * Register a custom axios instance with a unique identifier
     * @param id Unique identifier for the axios instance
     * @param instance Custom axios instance
     * @returns true if registration was successful
     */
    registerAxiosInstance(id: string, instance: AxiosInstance): boolean {
        return this.httpProvider.registerInstance(id, instance);
    }

    /**
     * Get an axios instance by its id, or the default instance if no id is provided
     * @param id Unique identifier for the axios instance
     * @returns The requested axios instance
     */
    getAxiosInstance(id?: string): AxiosInstance {
        return this.httpProvider.getInstance(id);
    }

    /**
     * Remove a custom axios instance
     * @param id Unique identifier for the axios instance
     * @returns true if removal was successful
     */
    unregisterAxiosInstance(id: string): boolean {
        return this.httpProvider.unregisterInstance(id);
    }

    /**
     * Perform a GET request
     * @param url URL to request
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        return this.httpProvider.get<T>(url, config, instanceId);
    }

    /**
     * Perform a POST request
     * @param url URL to request
     * @param data Data to send
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        return this.httpProvider.post<T>(url, data, config, instanceId);
    }

    /**
     * Perform a PUT request
     * @param url URL to request
     * @param data Data to send
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        return this.httpProvider.put<T>(url, data, config, instanceId);
    }

    /**
     * Perform a PATCH request
     * @param url URL to request
     * @param data Data to send
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        return this.httpProvider.patch<T>(url, data, config, instanceId);
    }

    /**
     * Perform a DELETE request
     * @param url URL to request
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        return this.httpProvider.delete<T>(url, config, instanceId);
    }

    /**
     * Generic method to perform any HTTP request
     * @param config Axios request configuration
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async request<T = any>(config: AxiosRequestConfig, instanceId?: string): Promise<T> {
        return this.httpProvider.request<T>(config, instanceId);
    }

    /**
     * Create a WebSocket connection
     * @param url WebSocket URL
     * @param id Optional unique identifier for the WebSocket connection
     * @returns WebSocket connection
     */
    createWebSocket(url: string, id?: string): WebSocketConnection {
        return this.webSocketProvider.createConnection(url, id);
    }

    /**
     * Get a WebSocket connection by its ID
     * @param id Unique identifier for the WebSocket connection
     * @returns WebSocket connection or undefined if not found
     */
    getWebSocket(id: string): WebSocketConnection | undefined {
        return this.webSocketProvider.getConnection(id);
    }

    /**
     * Remove a WebSocket connection
     * @param id Unique identifier for the WebSocket connection
     * @returns true if removal was successful
     */
    removeWebSocket(id: string): boolean {
        return this.webSocketProvider.removeConnection(id);
    }

    /**
     * Create a Socket.IO connection
     * @param url Socket.IO URL
     * @param options Socket.IO options
     * @param id Optional unique identifier for the Socket.IO connection
     * @returns Socket.IO connection
     */
    createSocketIO(url: string, options: any = {}, id?: string): SocketIOConnection {
        return this.socketIOProvider.createConnection(url, options, id);
    }

    /**
     * Get a Socket.IO connection by its ID
     * @param id Unique identifier for the Socket.IO connection
     * @returns Socket.IO connection or undefined if not found
     */
    getSocketIO(id: string): SocketIOConnection | undefined {
        return this.socketIOProvider.getConnection(id);
    }

    /**
     * Remove a Socket.IO connection
     * @param id Unique identifier for the Socket.IO connection
     * @returns true if removal was successful
     */
    removeSocketIO(id: string): boolean {
        return this.socketIOProvider.removeConnection(id);
    }

    /**
     * Set default headers for all requests in the default axios instance
     * @param headers Headers to set
     */
    setDefaultHeaders(headers: Record<string, string>): void {
        this.httpProvider.setDefaultHeaders(headers);
    }

    /**
     * Set up authentication for requests in the default axios instance
     * @param token Authentication token
     * @param scheme Authentication scheme (default: 'Bearer')
     */
    setAuthToken(token: string, scheme: string = 'Bearer'): void {
        this.httpProvider.setAuthToken(token, scheme);
    }

    /**
     * Clear authentication token from the default axios instance
     */
    clearAuthToken(): void {
        this.httpProvider.clearAuthToken();
    }
}