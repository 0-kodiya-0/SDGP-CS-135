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

    // Define allowed origins - adjust based on your environment
    const allowedOrigins = [
        'http://localhost:5173', // Frontend direct
        'http://localhost:8080', // Proxy
        process.env.FRONTEND_URL as string,
        process.env.PROXY_URL as string
    ].filter(Boolean); // Remove any undefined values

    console.log('Socket.IO initializing with allowed origins:', allowedOrigins);

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true
        },
        // Configure for proxy support
        path: '/socket.io',
        // Support all transports but prefer websocket
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
        pingInterval: 25000,
        // Handle middleware timeouts
        connectTimeout: 45000,
        // Allow upgrades to websocket
        allowUpgrades: true
    });

    // Enhanced connection error logging
    io.engine.on("connection_error", (err) => {
        console.log(`Socket.IO connection error: ${err.code} - ${err.message}`);
        console.log("Error context:", err.context);
    });

    // Listen for connections
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}, transport: ${socket.conn.transport.name}`);
        console.log(`Client handshake: ${socket.handshake.address} from origin: ${socket.handshake.headers.origin}`);
        
        socket.on('disconnect', (reason) => {
            console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        });
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