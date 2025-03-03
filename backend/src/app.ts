import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import setupPassport from "./config/passport";
import connectDB from "./config/db";

// Import Routes
import accountRoutes  from "./feature/account/Account.routes";
import oauthRoutes from "./feature/oauth/Auth.routes";

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Setup Passport authentication strategies
setupPassport();

// Initialize database connection
connectDB();

// Register Routes
app.use("/account", accountRoutes);
app.use("/oauth", oauthRoutes);

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
