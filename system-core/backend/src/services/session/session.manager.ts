import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SessionPayload } from '../../types/session.types';
import { OAuthAccount, TokenDetails } from '../../feature/account/Account.types';
import { GoogleTokenService, TokenInfo } from '../../feature/google/services/token';
import db from '../../config/db';
import { ApiErrorCode } from '../../types/response.types';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
const MAX_ACCOUNTS_PER_SESSION = 20;

export interface SessionError {
    error: boolean;
    message: string;
    code: ApiErrorCode;
}

/**
 * Extract session from request cookies
 */
export const extractSession = (req: Request): SessionPayload | null => {
    const token = req.cookies?.session_token;

    if (!token) {
        return null;
    }

    try {
        return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch {
        return null;
    }
};

/**
 * Creates a JWT session token and sets it as a cookie
 */
export const createSessionToken = (res: Response, sessionPayload: SessionPayload): string => {
    // Sign the JWT token
    const token = jwt.sign(sessionPayload, JWT_SECRET);

    // Set the token as a cookie that doesn't expire
    res.cookie('session_token', token, {
        httpOnly: false, // Allow JavaScript access
        secure: process.env.NODE_ENV === 'production', // Only set secure in production
        maxAge: COOKIE_MAX_AGE, // Very long expiration
        sameSite: 'lax',
        path: '/' // Make cookie available for all paths
    });

    return token;
};

// /**
//  * Record a new session in the database for tracking purposes
//  */
// export const recordSessionInDatabase = async (
//     sessionId: string,
//     accountId: string,
//     req: Request
// ): Promise<void> => {
//     try {
//         const models = await db.getModels();

//         // Create the session tracking record
//         await models.auth.SessionTracking.create({
//             sessionId: sessionId,
//             userId: accountId,
//             userAgent: req.headers['user-agent'],
//             ipAddress: req.ip || req.socket.remoteAddress,
//             createdAt: new Date().toISOString(),
//             lastActivity: new Date().toISOString(),
//             isActive: true
//         });
//     } catch (error) {
//         console.error('Failed to record session in database:', error);
//         // Don't throw - this shouldn't block authentication
//     }
// };

// /**
//  * Update the last activity timestamp for a session
//  */
// export const updateSessionActivity = async (sessionId: string): Promise<void> => {
//     try {
//         const models = await db.getModels();

//         // Find and update the session record
//         const session = await models.auth.SessionTracking.findOne({ sessionId });
//         if (session) {
//             await session.updateActivity();
//         }
//     } catch (error) {
//         console.error('Failed to update session activity:', error);
//     }
// };

/**
 * Creates or updates a session with a new account and token information
 */
export const createOrUpdateSession = async (res: Response, account: OAuthAccount, req: Request): Promise<
    | {
        authenticated: boolean;
        sessionId: string;
        accountId: string;
        name: string;
    }
    | SessionError
> => {
    const currentSession = extractSession(req);
    const googleTokenService = GoogleTokenService.getInstance();

    // Get detailed token info from Google
    let tokenInfo: TokenInfo;
    try {
        tokenInfo = await googleTokenService.tokenDetailsToInfo(account.tokenDetails);
    } catch (error) {
        console.error('Error getting token info:', error);
        tokenInfo = {
            accessToken: account.tokenDetails.accessToken,
            expiresAt: Date.now() + (3600 * 1000), // Default 1 hour expiration
            scope: ''
        };
    }

    // Store account details in database instead of session
    const models = await db.getModels();

    // Store or update the account session data in database
    await models.accounts.OAuthAccount.updateOne(
        { id: account.id },
        {
            $set: {
                id: account.id,
                accountType: account.accountType,
                provider: account.provider,
                tokenInfo: {
                    accessToken: tokenInfo.accessToken,
                    expiresAt: tokenInfo.expiresAt,
                    scope: tokenInfo.scope
                },
                updatedAt: new Date().toISOString()
            }
        },
        { upsert: true }
    );

    let sessionPayload: SessionPayload;
    // let isNewSession = false;

    if (currentSession) {
        // Check if this account is already in the session
        const existingAccountIndex = currentSession.accounts.findIndex(id => id === account.id);

        if (existingAccountIndex >= 0) {
            // Account already exists in session, no change needed
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

            // Add the new account ID to the existing session
            sessionPayload = {
                ...currentSession,
                accounts: [...currentSession.accounts, account.id]
            };
        }
    } else {
        // Create a new session
        const sessionId = crypto.randomBytes(16).toString('hex');

        sessionPayload = {
            sessionId: sessionId,
            accounts: [account.id],
            createdAt: Date.now(),
            // Set expiry far in the future (matches cookie expiration)
            expiresAt: Date.now() + COOKIE_MAX_AGE
        };

        // isNewSession = true;
    }

    // Create the session token
    createSessionToken(res, sessionPayload);

    // // If this is a new session, record it in the database
    // if (isNewSession) {
    //     recordSessionInDatabase(sessionPayload.sessionId, account.id, req)
    //         .catch(err => console.error('Failed to record session:', err));
    // }

    // Return success with minimal information
    return {
        authenticated: true,
        sessionId: sessionPayload.sessionId,
        accountId: account.id,
        name: account.userDetails.name,
    };
};

/**
 * Check if a token is expired or close to expiring
 */
export const isTokenExpired = (tokenInfo: TokenDetails): boolean => {
    if (!tokenInfo.expiresAt) {
        return false;
    }
    // Allow a 5-minute buffer before actual expiration
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() > (parseInt(tokenInfo.expiresAt) - bufferTime);
};

/**
 * Updates a user's token details in the database
 */
export const updateUserTokens = async (
    accountId: string,
    tokenDetails: {
        accessToken: string;
        refreshToken?: string;
        tokenCreatedAt: string;
    }
): Promise<void> => {
    try {
        const models = await db.getModels();

        // Find and update token details
        await models.accounts.OAuthAccount.updateOne(
            { id: accountId },
            {
                $set: {
                    tokenDetails,
                    updated: new Date().toISOString()
                }
            }
        );
    } catch (error) {
        console.error('Failed to update user tokens:', error);
        throw error;
    }
};

/**
 * Get a valid access token for an account, refreshing if necessary
 */
export const getValidAccessToken = async (
    session: SessionPayload,
    accountId?: string
): Promise<string> => {
    if (!accountId) {
        throw new Error('Account ID is required');
    }

    // Check if the account ID is in the session
    if (!session.accounts.includes(accountId)) {
        throw new Error('Account not found in session');
    }

    // Get the account session from the database
    const models = await db.getModels();
    const accountSession = await models.accounts.OAuthAccount.findOne({ id: accountId });

    if (!accountSession || !accountSession.tokenDetails) {
        throw new Error('Account session not found');
    }

    // If token is expired, refresh it
    if (isTokenExpired(accountSession.tokenDetails)) {
        // Get the account from the database to access the refresh token
        const dbAccount = await models.accounts.OAuthAccount.findOne({ id: accountId });

        if (!dbAccount || !dbAccount.tokenDetails.refreshToken) {
            throw new Error('No refresh token available');
        }

        // Refresh the token
        const googleTokenService = GoogleTokenService.getInstance();
        const newTokenInfo = await googleTokenService.refreshAccessToken(dbAccount.tokenDetails.refreshToken);

        // Update the token in the database
        await updateUserTokens(accountId, {
            accessToken: newTokenInfo.accessToken,
            refreshToken: newTokenInfo.refreshToken || dbAccount.tokenDetails.refreshToken,
            tokenCreatedAt: new Date().toISOString()
        });

        // Update the account session
        await models.accounts.OAuthAccount.updateOne(
            { accountId },
            {
                $set: {
                    tokenInfo: {
                        accessToken: newTokenInfo.accessToken,
                        expiresAt: newTokenInfo.expiresAt,
                        scope: newTokenInfo.scope
                    },
                    updatedAt: new Date().toISOString()
                }
            }
        );

        // Return the new access token
        return newTokenInfo.accessToken;
    }

    // Return the existing access token
    return accountSession.tokenDetails.accessToken;
};

// /**
//  * Get session information for a user
//  * Can be used to show all active sessions in a user profile
//  */
// export const getUserActiveSessions = async (userId: string): Promise<any[]> => {
//     try {
//         const models = await db.getModels();

//         // Find all active sessions for this user
//         const sessions = await models.auth.SessionTracking.find({
//             userId: userId,
//             isActive: true
//         }).sort({ lastActivity: -1 }); // Most recent first

//         return sessions;
//     } catch (error) {
//         console.error('Failed to get user sessions:', error);
//         return [];
//     }
// };

// /**
//  * Deactivate all sessions for a user except the current one
//  * Useful for "log me out of all other devices" feature
//  */
// export const deactivateOtherSessions = async (userId: string, currentSessionId: string): Promise<number> => {
//     try {
//         const models = await db.getModels();

//         // Find and update all sessions except the current one
//         const result = await models.auth.SessionTracking.updateMany(
//             {
//                 userId: userId,
//                 isActive: true,
//                 sessionId: { $ne: currentSessionId }
//             },
//             {
//                 $set: { isActive: false }
//             }
//         );

//         return result.modifiedCount;
//     } catch (error) {
//         console.error('Failed to deactivate other sessions:', error);
//         return 0;
//     }
// };