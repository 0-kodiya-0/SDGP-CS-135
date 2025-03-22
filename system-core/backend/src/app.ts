import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import setupPassport from './config/passport';
import { router as oauthRoutes } from './feature/oauth';
import { router as accountRoutes } from './feature/account';
import { router as googleRoutes } from './feature/google'; // Import Google API routes
import { authenticateSession } from './utils/session';
import db from './config/db';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import chatRoutes from './routes/chatRoutes';
import { ChatSocketHandler } from './socket/ChatSocket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('trust proxy', true);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Initialize Passport (using JWT instead of session)
app.use(passport.initialize());

// Setup Passport with JWT strategy
setupPassport();

// Initialize database connections and models
db.initializeDB().then(() => {
    console.log('Database connections established and models initialized');
}).catch(err => {
    console.error('Database initialization error:', err);
    process.exit(1);
});

// Initialize Socket.IO handler
new ChatSocketHandler(io);

// Routes
app.use('/oauth', oauthRoutes);
app.use('/account', authenticateSession, accountRoutes);
app.use('/google', authenticateSession, googleRoutes); // Add Google API routes
app.use('/api/chat', authenticateSession, chatRoutes);

// Logging middleware
app.use((req, res, next) => {
    console.log(`[BACKEND] ${req.method} ${req.url}`);
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat_db', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong!' } });
    next();
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});