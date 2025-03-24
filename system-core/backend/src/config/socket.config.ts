import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO with the HTTP server
 * @param httpServer HTTP server to attach Socket.IO to
 * @returns Socket.IO server instance
 */
export const initializeSocketIO = (httpServer: HttpServer): SocketIOServer => {
    if (io) {
        return io;
    }

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:8080',
            methods: ['GET', 'POST'],
            credentials: true
        },
        // Configure for proxy support
        path: '/socket.io',
        // Allow for connecting behind proxies
        allowEIO3: true,
        transports: ['websocket', 'polling'],
        // Important for sticky sessions in a load balanced environment
        cookie: {
            name: 'io',
            path: '/',
            httpOnly: true,
            sameSite: 'lax'
        },
        // Prevent disconnections through proxies
        pingTimeout: 60000,
        // Handle middleware timeouts
        connectTimeout: 45000
    });

    console.log('Socket.IO initialized');
    return io;
};

/**
 * Get the Socket.IO server instance
 * @returns Socket.IO server instance
 */
export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Call initializeSocketIO first.');
    }
    return io;
};

export default {
    initializeSocketIO,
    getIO
};