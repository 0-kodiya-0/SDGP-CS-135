import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';

import setupPassport from './config/passport';
import db from './config/db';
import socketConfig from './config/socket.config';
import { router as oauthRoutes } from './feature/oauth';
import { router as accountRoutes } from './feature/account';
import { router as googleRoutes } from './feature/google';
import { authenticateSession } from './services/session';
import { ChatSocketHandler, chatRoutes } from './feature/chat';

// Load environment variables
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with proxy support
const io = socketConfig.initializeSocketIO(httpServer);

// Trust proxies (important when running behind a proxy)
app.set('trust proxy', true);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[BACKEND] ${req.method} ${req.url}`);
  next();
});

// Initialize Passport
app.use(passport.initialize());
setupPassport();

// Initialize database connections
(async () => {
  try {
    await db.initializeDB();
    console.log('Database connections established and models initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
    process.exit(1);
  }
})();

// Initialize Socket.IO handler
new ChatSocketHandler(io);

// API Routes
app.use('/oauth', oauthRoutes);
app.use('/account', authenticateSession, accountRoutes);
app.use('/google', authenticateSession, googleRoutes);
app.use('/api/chat', authenticateSession, chatRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Application error:', err);
  res.status(500).json({ 
    success: false, 
    error: { 
      code: 'SERVER_ERROR', 
      message: 'Something went wrong!' 
    } 
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: { 
      code: 'NOT_FOUND', 
      message: 'Resource not found' 
    } 
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO is configured and ready`);
});