import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SessionPayload } from '../../types/session.types';
import db from '../../config/db';
import { ApiErrorCode, BadRequestError, ServerError, SessionValidationError } from '../../types/response.types';
import { OAuthProviders } from '../../feature/account/Account.types';
import { getTokenInfo } from '../../feature/google/services/token';

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

/**
 * Creates or updates a session with a new account and token information
 */
export const createOrUpdateSession = async (res: Response, accountId: string, req: Request) => {
    const currentSession = extractSession(req);

    let sessionPayload: SessionPayload;
    // let isNewSession = false;

    if (currentSession) {
        // Check if this account is already in the session
        const existingAccountIndex = currentSession.accounts.findIndex(id => id === accountId);

        if (existingAccountIndex >= 0) {
            // Account already exists in session, no change needed
            sessionPayload = currentSession;
        } else {
            // Check if we've reached the maximum number of accounts
            if (currentSession.accounts.length >= MAX_ACCOUNTS_PER_SESSION) {
                throw new SessionValidationError("Maximum number of accounts reached");
            }

            // Add the new account ID to the existing session
            sessionPayload = {
                ...currentSession,
                accounts: [...currentSession.accounts, accountId]
            };
        }
    } else {
        // Create a new session
        const sessionId = crypto.randomBytes(16).toString('hex');

        sessionPayload = {
            sessionId: sessionId,
            accounts: [accountId],
            createdAt: Date.now(),
            // Set expiry far in the future (matches cookie expiration)
            expiresAt: Date.now() + COOKIE_MAX_AGE
        };
    }

    // Create the session token
    createSessionToken(res, sessionPayload);
};

/**
 * Updates a user's token details in the database
 */
export const updateDbUserTokens = async (
    accountId: string,
    provider: OAuthProviders,
    accessToken: string,
    refreshToken?: string
): Promise<void> => {
    const models = await db.getModels();

    let accessTokenInfo;
    if (provider === OAuthProviders.Google) {
        accessTokenInfo = await getTokenInfo(accessToken);
    } else {
        throw new BadRequestError("Invalid provider found");
    }

    if (!accessTokenInfo.expires_in) {
        throw new ServerError("Error getting token detail from provider");
    }

    // Create update object with required fields
    const updateFields: Record<string, any> = {
        'tokenDetails.accessToken': accessToken,
        'tokenDetails.tokenCreatedAt': Date.now(),
        "tokenDetails.expireAt": accessTokenInfo.expires_in,
        'updated': new Date().toISOString()
    };

    // Only add refreshToken to update if provided
    if (refreshToken && refreshToken.length !== 0) {
        updateFields['tokenDetails.refreshToken'] = refreshToken;
    }

    // Find and update token details
    await models.accounts.OAuthAccount.updateOne(
        { _id: accountId },
        { $set: updateFields }
    );
};