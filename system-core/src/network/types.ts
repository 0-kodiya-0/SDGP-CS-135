/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/network/types.ts
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Socket } from 'socket.io-client';

/**
 * Configuration options for the NetworkApi
 */
export interface NetworkApiOptions {
    /**
     * Base URL for all requests
     */
    baseUrl?: string;

    /**
     * Default timeout in milliseconds
     */
    timeout?: number;

    /**
     * Default headers to include with all requests
     */
    headers?: Record<string, string>;

    /**
     * Whether to include credentials (cookies) with requests
     */
    withCredentials?: boolean;
}

/**
 * WebSocket connection interface
 */
export interface WebSocketConnection {
    /**
     * Send a message through the WebSocket
     */
    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;

    /**
     * Close the WebSocket connection
     */
    close: () => void;

    /**
     * Subscribe to WebSocket events
     */
    on: (event: 'message' | 'close' | 'error', callback: (data: any) => void) => void;

    /**
     * Unsubscribe from WebSocket events
     */
    off: (event: 'message' | 'close' | 'error', callback: (data: any) => void) => void;

    /**
     * Check if the connection is currently open
     */
    isConnected: () => boolean;
}

/**
 * Socket.IO connection interface
 */
export interface SocketIOConnection {
    /**
     * Emit an event to the server
     */
    emit: (event: string, ...args: any[]) => Socket;

    /**
     * Subscribe to an event
     */
    on: (event: string, callback: (...args: any[]) => void) => Socket;

    /**
     * Subscribe to an event once
     */
    once: (event: string, callback: (...args: any[]) => void) => Socket;

    /**
     * Unsubscribe from an event
     */
    off: (event: string, callback?: (...args: any[]) => void) => Socket;

    /**
     * Connect to the server
     */
    connect: () => Socket;

    /**
     * Disconnect from the server
     */
    disconnect: () => Socket;

    /**
     * Check if the socket is connected
     */
    isConnected: () => boolean;

    /**
     * Get the underlying Socket.IO socket instance
     */
    getSocket: () => Socket;
}

/**
 * HTTP Provider interface
 */
export interface HttpProvider {
    /**
     * Register a custom axios instance with a unique identifier
     */
    registerInstance(id: string, instance: AxiosInstance): boolean;

    /**
     * Get an axios instance by its id, or the default instance if no id is provided
     */
    getInstance(id?: string): AxiosInstance;

    /**
     * Remove a custom axios instance
     */
    unregisterInstance(id: string): boolean;

    /**
     * Perform a GET request
     */
    get<T = any>(url: string, config?: AxiosRequestConfig, instanceId?: string): Promise<T>;

    /**
     * Perform a POST request
     */
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T>;

    /**
     * Perform a PUT request
     */
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T>;

    /**
     * Perform a PATCH request
     */
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T>;

    /**
     * Perform a DELETE request
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig, instanceId?: string): Promise<T>;

    /**
     * Generic method to perform any HTTP request
     */
    request<T = any>(config: AxiosRequestConfig, instanceId?: string): Promise<T>;

    /**
     * Set default headers for all requests
     */
    setDefaultHeaders(headers: Record<string, string>): void;

    /**
     * Set up authentication for requests
     */
    setAuthToken(token: string, scheme?: string): void;

    /**
     * Clear authentication token
     */
    clearAuthToken(): void;
}

/**
 * WebSocket Provider interface
 */
export interface WebSocketProvider {
    /**
     * Create a WebSocket connection
     */
    createConnection(url: string, id?: string): WebSocketConnection;

    /**
     * Get a WebSocket connection by its ID
     */
    getConnection(id: string): WebSocketConnection | undefined;

    /**
     * Remove a WebSocket connection
     */
    removeConnection(id: string): boolean;
}

/**
 * Socket.IO Provider interface
 */
export interface SocketIOProvider {
    /**
     * Create a Socket.IO connection
     */
    createConnection(url: string, options?: any, id?: string): SocketIOConnection;

    /**
     * Get a Socket.IO connection by its ID
     */
    getConnection(id: string): SocketIOConnection | undefined;

    /**
     * Remove a Socket.IO connection
     */
    removeConnection(id: string): boolean;
}