// utils/session.ts
import { Response, Request, NextFunction } from 'express';
import { OAuthAccount } from '../feature/account/Account.types';
import { SignInState } from '../feature/oauth/Auth.types';
import { ApiErrorCode } from '../types/response.types';
import { sendError } from './response';
import { AccountSession, SessionPayload, RefreshTokenData } from '../types/session.types';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db';

// Environment variables
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // 1 day
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'; // 30 days
const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE || '86400000'); // 1 day in milliseconds
const MAX_ACCOUNTS_PER_SESSION = 20;

// Helper to extract session from request
export const extractSession = (req: Request): SessionPayload | null => {
    const token = req.cookies?.session_token;

    if (!token) {
        return null;
    }

    try {
        return jwt.verify(token, process.env.JWT_SECRET) as SessionPayload;
    } catch {
        return null;
    }
};

/**
 * Creates a JWT session token and sets it as an HTTP-only cookie
 */
export const createSessionToken = (res: Response, sessionPayload: SessionPayload): string => {
    // Sign the JWT token
    const token = jwt.sign(sessionPayload, process.env.JWT_SECRET!);

    // Set the token as an HTTP-only cookie
    res.cookie('session_token', token, {
        httpOnly: false,
        secure: false, // Only use secure in production
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        path: '/' // Make cookie available for all paths
    });

    return token;
};

/**
 * Creates or updates a refresh token for an account
 */
export const createRefreshToken = async (accountId: string): Promise<string> => {
    const models = await db.getModels();
    
    const token = crypto.randomBytes(64).toString('hex');
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

    const refreshTokenData: RefreshTokenData = {
        id: crypto.randomBytes(16).toString('hex'),
        accountId,
        token,
        createdAt: now.toISOString(),
        expiresAt: expiryDate.toISOString(),
        isRevoked: false
    };

    // Revoke any existing refresh tokens for this account
    await models.auth.RefreshToken.updateMany(
        { accountId }, 
        { isRevoked: true }
    );

    // Create the new refresh token
    await models.auth.RefreshToken.create({
        ...refreshTokenData,
        createdAt: now,
        expiresAt: expiryDate,
    });

    return token;
};

/**
 * Verifies a refresh token and returns the associated account
 */
export const verifyRefreshToken = async (accountId: string, token: string): Promise<boolean> => {
    const models = await db.getModels();
    
    const refreshToken = await models.auth.RefreshToken.findOne({
        accountId,
        token,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
    });

    return !!refreshToken;
};

/**
 * Middleware to verify JWT token from cookies
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const session = extractSession(req);

    if (!session) {
        return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Authentication required');
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
        res.clearCookie('session_token');
        return sendError(res, 403, ApiErrorCode.AUTH_FAILED, 'Session expired');
    }

    // Add session data to request object
    req.session = session;
    next();
};

/**
 * Middleware to verify account access based on path parameter
 */
export const validateAccountAccess = (req: Request, res: Response, next: NextFunction) => {
    const session = req.session as SessionPayload;
    const accountId = req.params.accountId;

    if (!accountId) {
        return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Account ID is required');
    }

    // Check if requested account is in the session
    const accountExists = session.accounts.some(acc => acc.accountId === accountId);

    if (!accountExists) {
        return sendError(res, 403, ApiErrorCode.AUTH_FAILED, 'No access to this account');
    }

    next();
};

/**
 * Creates or updates a session with a new account
 */
export const createOrUpdateSession = async (res: Response, account: OAuthAccount, req: Request) => {
    const currentSession = extractSession(req);
    
    const accountSession: AccountSession = {
        accountId: account.id,
        accountType: account.accountType,
        provider: account.provider,
        email: account.userDetails.email
    };

    let sessionPayload: SessionPayload;

    if (currentSession && currentSession.expiresAt > Date.now()) {
        // Check if this account is already in the session
        const existingAccountIndex = currentSession.accounts.findIndex(acc => acc.accountId === account.id);

        if (existingAccountIndex >= 0) {
            // Update the existing account
            currentSession.accounts[existingAccountIndex] = accountSession;
            sessionPayload = currentSession;
        } else {
            // Check if we've reached the maximum number of accounts
            if (currentSession.accounts.length >= MAX_ACCOUNTS_PER_SESSION) {
                return {
                    error: true,
                    message: 'Maximum number of accounts reached',
                    code: ApiErrorCode.MISSING_DATA
                };
            }

            // Add the new account to the existing session
            sessionPayload = {
                ...currentSession,
                accounts: [...currentSession.accounts, accountSession]
            };
        }
    } else {
        // Create a new session
        const now = Date.now();
        sessionPayload = {
            sessionId: crypto.randomBytes(16).toString('hex'),
            accounts: [accountSession],
            createdAt: now,
            expiresAt: now + COOKIE_MAX_AGE
        };
    }

    // Create a refresh token for this account
    const refreshToken = await createRefreshToken(account.id);

    // Create the session token
    createSessionToken(res, sessionPayload);

    // Return success with minimal information
    return {
        authenticated: true,
        sessionId: sessionPayload.sessionId,
        accountId: account.id,
        name: account.userDetails.name,
        refreshToken
    };
};

/**
 * Creates session after successful sign-in
 */
export const createSignInSession = (res: Response, user: OAuthAccount, req: Request) => {
    return createOrUpdateSession(res, user, req);
};

/**
 * Creates session after successful sign-up
 */
export const createSignUpSession = (res: Response, account: OAuthAccount, req: Request) => {
    return createOrUpdateSession(res, account, req);
};

/**
 * Removes an account from the session
 */
export const removeAccountFromSession = (res: Response, req: Request, accountId: string) => {
    const session = extractSession(req);

    if (!session) {
        return false;
    }

    // Filter out the specified account
    const updatedAccounts = session.accounts.filter(acc => acc.accountId !== accountId);

    // If no accounts left, clear the session
    if (updatedAccounts.length === 0) {
        clearSession(res);
        return true;
    }

    // Update the session with the remaining accounts
    const updatedSession: SessionPayload = {
        ...session,
        accounts: updatedAccounts
    };

    createSessionToken(res, updatedSession);
    return true;
};

/**
 * Logout function to clear the session cookie
 */
export const clearSession = (res: Response) => {
    res.clearCookie('session_token', { path: '/' });
};

/**
 * Revoke a refresh token
 */
export const revokeRefreshToken = async (accountId: string): Promise<void> => {
    const models = await db.getModels();
    
    // Mark all refresh tokens for this account as revoked
    await models.auth.RefreshToken.updateMany(
        { accountId }, 
        { isRevoked: true }
    );
};

/**
 * Clean up expired refresh tokens (can be run periodically)
 */
export const cleanupExpiredRefreshTokens = async (): Promise<void> => {
    const models = await db.getModels();
    const now = new Date();
    
    const result = await models.auth.RefreshToken.deleteMany({
        $or: [
            { isRevoked: true },
            { expiresAt: { $lt: now } }
        ]
    });
    
    console.log(`Cleaned up expired refresh tokens: ${result.deletedCount} removed`);
};