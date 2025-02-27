import { ManagerOptions, Socket, SocketOptions, io } from 'socket.io-client';
import { SocketIOConnection, SocketIOProvider } from '../types';

/**
 * Implementation of the Socket.IO provider
 */
export class SocketIOClientProvider implements SocketIOProvider {
    private activeConnections: Map<string, Socket> = new Map();

    /**
     * Create a Socket.IO connection
     * @param url Socket.IO URL
     * @param options Socket.IO options
     * @param id Optional unique identifier for the Socket.IO connection
     * @returns Socket.IO connection
     */
    createConnection(url: string, options: Partial<ManagerOptions & SocketOptions> = {}, id?: string): SocketIOConnection {
        const connectionId = id || url;

        // Close existing connection if it exists
        if (this.activeConnections.has(connectionId)) {
            console.warn(`Socket.IO connection with id "${connectionId}" already exists. It will be overwritten.`);
            this.activeConnections.get(connectionId)!.disconnect();
            this.activeConnections.delete(connectionId);
        }

        const socket = io(url, options);
        this.activeConnections.set(connectionId, socket);

        return this.createConnectionInterface(connectionId);
    }

    /**
     * Get a Socket.IO connection by its ID
     * @param id Unique identifier for the Socket.IO connection
     * @returns Socket.IO connection or undefined if not found
     */
    getConnection(id: string): SocketIOConnection | undefined {
        if (!this.activeConnections.has(id)) {
            return undefined;
        }

        return this.createConnectionInterface(id);
    }

    /**
     * Remove a Socket.IO connection
     * @param id Unique identifier for the Socket.IO connection
     * @returns true if removal was successful
     */
    removeConnection(id: string): boolean {
        if (!this.activeConnections.has(id)) {
            return false;
        }

        const socket = this.activeConnections.get(id)!;
        socket.disconnect();
        this.activeConnections.delete(id);
        return true;
    }

    /**
     * Create a Socket.IO connection interface
     * @param id Connection ID
     * @returns Socket.IO connection interface
     * @private
     */
    private createConnectionInterface(id: string): SocketIOConnection {
        const socket = this.activeConnections.get(id)!;

        return {
            emit: (event, ...args) => {
                return socket.emit(event, ...args);
            },

            on: (event, callback) => {
                return socket.on(event, callback);
            },

            once: (event, callback) => {
                return socket.once(event, callback);
            },

            off: (event, callback) => {
                return socket.off(event, callback);
            },

            connect: () => {
                return socket.connect();
            },

            disconnect: () => {
                socket.disconnect();
                this.activeConnections.delete(id);
                return socket;
            },

            isConnected: () => {
                return socket.connected;
            },

            getSocket: () => {
                return socket;
            }
        };
    }
}