// src/api/network/providers/websocket-provider.ts
import { WebSocketConnection, WebSocketProvider } from '../types';

/**
 * Implementation of the WebSocket provider
 */
export class BrowserWebSocketProvider implements WebSocketProvider {
    private activeConnections: Map<string, WebSocket> = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private eventHandlers: Map<string, Map<string, Set<(data: any) => void>>> = new Map();

    /**
     * Create a WebSocket connection
     * @param url WebSocket URL
     * @param id Optional unique identifier for the WebSocket connection
     * @returns WebSocket connection
     */
    createConnection(url: string, id?: string): WebSocketConnection {
        const connectionId = id || url;

        // Close existing connection if it exists
        if (this.activeConnections.has(connectionId)) {
            console.warn(`WebSocket with id "${connectionId}" already exists. It will be overwritten.`);
            // Close the existing connection
            this.activeConnections.get(connectionId)!.close();
            this.activeConnections.delete(connectionId);
            this.eventHandlers.delete(connectionId);
        }

        const ws = new WebSocket(url);
        this.activeConnections.set(connectionId, ws);
        this.eventHandlers.set(connectionId, new Map([
            ['message', new Set()],
            ['close', new Set()],
            ['error', new Set()]
        ]));

        // Set up default event handlers
        ws.addEventListener('message', (event) => {
            const handlers = this.eventHandlers.get(connectionId)?.get('message');
            if (handlers) {
                handlers.forEach(callback => {
                    try {
                        callback(event.data);
                    } catch (error) {
                        console.error('Error in WebSocket message handler:', error);
                    }
                });
            }
        });

        ws.addEventListener('close', (event) => {
            const handlers = this.eventHandlers.get(connectionId)?.get('close');
            if (handlers) {
                handlers.forEach(callback => {
                    try {
                        callback(event);
                    } catch (error) {
                        console.error('Error in WebSocket close handler:', error);
                    }
                });
            }
            this.activeConnections.delete(connectionId);
            this.eventHandlers.delete(connectionId);
        });

        ws.addEventListener('error', (event) => {
            const handlers = this.eventHandlers.get(connectionId)?.get('error');
            if (handlers) {
                handlers.forEach(callback => {
                    try {
                        callback(event);
                    } catch (error) {
                        console.error('Error in WebSocket error handler:', error);
                    }
                });
            }
        });

        return this.createConnectionInterface(connectionId);
    }

    /**
     * Get a WebSocket connection by its ID
     * @param id Unique identifier for the WebSocket connection
     * @returns WebSocket connection or undefined if not found
     */
    getConnection(id: string): WebSocketConnection | undefined {
        if (!this.activeConnections.has(id)) {
            return undefined;
        }

        return this.createConnectionInterface(id);
    }

    /**
     * Remove a WebSocket connection
     * @param id Unique identifier for the WebSocket connection
     * @returns true if removal was successful
     */
    removeConnection(id: string): boolean {
        if (!this.activeConnections.has(id)) {
            return false;
        }

        const ws = this.activeConnections.get(id)!;
        ws.close();
        this.activeConnections.delete(id);
        this.eventHandlers.delete(id);
        return true;
    }

    /**
     * Create a WebSocket connection interface
     * @param id Connection ID
     * @returns WebSocket connection interface
     * @private
     */
    private createConnectionInterface(id: string): WebSocketConnection {
        const ws = this.activeConnections.get(id)!;

        return {
            send: (data) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                } else {
                    throw new Error('WebSocket is not connected');
                }
            },

            close: () => {
                ws.close();
                this.activeConnections.delete(id);
                this.eventHandlers.delete(id);
            },

            on: (event, callback) => {
                const eventHandlers = this.eventHandlers.get(id)?.get(event);
                if (eventHandlers) {
                    eventHandlers.add(callback);
                }
            },

            off: (event, callback) => {
                const eventHandlers = this.eventHandlers.get(id)?.get(event);
                if (eventHandlers) {
                    eventHandlers.delete(callback);
                }
            },

            isConnected: () => {
                return ws.readyState === WebSocket.OPEN;
            }
        };
    }
}