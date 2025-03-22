import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import setupPassport from './config/passport';
import { router as oauthRoutes } from './feature/oauth';
import { router as accountRoutes } from './feature/account';
import { router as googleRoutes } from './feature/google'; // Import Google API routes
import db from './config/db';
import { authenticateSession } from './services/session';

dotenv.config();

const app = express();

app.set('trust proxy', true);

// Middleware
app.use(express.json());
app.use(cookieParser());

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

// Logging middleware
app.use((req, res, next) => {
    console.log(`[BACKEND] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/oauth', oauthRoutes);
app.use('/account', authenticateSession, accountRoutes);
app.use('/google', authenticateSession, googleRoutes); // Add Google API routes

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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});