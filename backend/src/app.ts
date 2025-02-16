import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import setupPassport from './config/passport';
import { router as oauthRoutes } from './feature/oauth';
import { router as accountRoutes } from "./feature/account";
import db from './config/db';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Setup Passport
setupPassport();

// Initialize database
const initializeDb = async () => {
    await db.read();
    if (!db.data) {
        db.data = { oauthAccounts: [], oauthStates: [], signInStates: [], signUpStates: [] };
        await db.write();
    }
};
initializeDb();

// Routes
app.use('/api/oauth', oauthRoutes);
app.use('/api/account', accountRoutes);

// Error handling
app.use((req: express.Request, res: express.Response) => {
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});