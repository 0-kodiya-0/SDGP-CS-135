import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class NotificationSocketHandler {
    private io: Server;
    
    constructor(io: Server) {
        this.io = io;
        this.init();
    }
    
    private init(): void {
        // Notification namespace
        const notificationNamespace = this.io.of('/notifications');
        
        // Authentication middleware for Socket.IO
        notificationNamespace.use((socket, next) => {
            try {
                // Extract authentication token from cookies or headers
                let token: string | null = null;
                const cookies = socket.handshake.headers.cookie;
                
                if (cookies) {
                    // Parse cookies
                    const cookieObj = cookies.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        acc[key] = value;
                        return acc;
                    }, {} as Record<string, string>);
                    
                    // Find account ID from query params or headers
                    const accountId = socket.handshake.auth.accountId || 
                                     socket.handshake.query.accountId as string;
                    
                    if (accountId) {
                        // Get token from cookies
                        token = cookieObj[`access_token_${accountId}`];
                    }
                }
                
                // If no token in cookies, check auth header
                if (!token && socket.handshake.auth.token) {
                    token = socket.handshake.auth.token;
                }
                
                // If still no token, check query params
                if (!token && socket.handshake.query.token) {
                    token = socket.handshake.query.token as string;
                }
                
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }
                
                // Verify token
                const decoded = jwt.verify(token, JWT_SECRET);
                
                // Store user info in socket
                (socket as any).accountId = decoded;
                
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });
        
        // Connection event
        notificationNamespace.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    
    private handleConnection(socket: Socket): void {
        const accountId = (socket as any).accountId;
        
        console.log(`Notification socket connected: ${socket.id} for account ${accountId}`);
        
        // Join account-specific room
        socket.join(`account-${accountId}`);
        
        // Listen for events
        socket.on('notification:subscribe', () => {
            // Already subscribed on connection
            socket.emit('notification:subscribed', { accountId });
        });
        
        socket.on('notification:unsubscribe', () => {
            socket.leave(`account-${accountId}`);
            socket.emit('notification:unsubscribed', { accountId });
        });
        
        // Disconnect event
        socket.on('disconnect', () => {
            console.log(`Notification socket disconnected: ${socket.id}`);
        });
    }
}

export default NotificationSocketHandler;