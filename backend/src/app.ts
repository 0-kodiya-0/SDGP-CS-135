// backend/src/app.ts
import dotenv from 'dotenv';
import { createServer } from 'http';
import cors from 'cors';
import express, { Request, Response } from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import setupPassport from './config/passport';
import { router as oauthRoutes } from './feature/oauth';
import { authenticatedNeedRouter as authNeedAccountRouter, authenticationNotNeedRouter as authNotNeedAccountRouter } from './feature/account';
import { router as googleRoutes } from './feature/google';
import environmentRoutes from './feature/environment';
import db from './config/db';
import { authenticateSession, validateAccountAccess, validateTokenAccess } from './services/session';
import socketConfig from './config/socket.config';
import { chatRoutes, ChatSocketHandler } from './feature/chat';
import { applyErrorHandlers } from './utils/response';

dotenv.config();

const app = express();
// Create HTTP server using the Express app
const httpServer = createServer(app);

app.set('trust proxy', true);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        process.env.PROXY_URL || 'http://localhost:8080'
    ].filter(Boolean), // Remove any empty strings
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Initialize Passport
app.use(passport.initialize());
setupPassport();

// Initialize Socket.IO with the HTTP server
const io = socketConfig.initializeSocketIO(httpServer);
// Initialize chat socket handler

// Initialize database connections and models
db.initializeDB().then(() => {
    console.log('Database connections established and models initialized');
}).catch(err => {
    console.error('Database initialization error:', err);
    process.exit(1);
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`[BACKEND] ${req.method} ${req.url}`);
    next();
});

new ChatSocketHandler(io);

// Routes - Using API paths that match the proxy configuration
app.use('/oauth', oauthRoutes);
app.use('/account', authNotNeedAccountRouter);

app.use("/:accountId", authenticateSession, validateAccountAccess, validateTokenAccess);

app.use('/:accountId/account', authNeedAccountRouter);
app.use('/:accountId/google', googleRoutes);
app.use('/:accountId/chat', chatRoutes);
app.use('/:accountId/environments', environmentRoutes); // Add environment routes

applyErrorHandlers(app);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
});

// IMPORTANT: Use httpServer.listen instead of app.listen to support Socket.IO
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO is listening on the same port`);
});