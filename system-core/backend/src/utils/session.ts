import { Response, Request, NextFunction } from 'express';
import { OAuthAccount, OAuthProviders, TokenDetails } from '../feature/account/Account.types';
import { ApiErrorCode } from '../types/response.types';
import { sendError } from './response';
import { AccountSession, SessionPayload } from '../types/session.types';
import refresh from 'passport-oauth2-refresh';
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
        provider: account.provider
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

    // Create the session token
    createSessionToken(res, sessionPayload);

    // Return success with minimal information
    return {
        authenticated: true,
        sessionId: sessionPayload.sessionId,
        accountId: account.id,
        name: account.userDetails.name,
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
 * Checks if an OAuth access token is expired or close to expiring
 * 
 * Note: Google tokens typically don't include expiration in the token itself
 * We'll use a combination of token age and a buffer time to determine if refresh is needed
 * 
 * @param tokenDetails The token details to check
 * @returns True if the token needs to be refreshed
 */
export const isTokenExpired = (tokenDetails: TokenDetails): boolean => {
    if (!tokenDetails.tokenCreatedAt) {
        // If we don't know when the token was created, assume it needs refresh
        return true;
    }

    const tokenCreatedAt = new Date(tokenDetails.tokenCreatedAt).getTime();
    const now = Date.now();

    // Google's access tokens typically expire after 1 hour (3600 seconds)
    // We'll use a conservative approach and refresh after 50 minutes (3000 seconds)
    const tokenLifespan = 3000 * 1000; // 50 minutes in milliseconds

    return now - tokenCreatedAt > tokenLifespan;
};

/**
 * Refreshes an OAuth access token using the refresh token
 * 
 * @param provider The OAuth provider
 * @param refreshToken The refresh token to use
 * @returns A promise that resolves to the new token details
 */
export const refreshAccessToken = async (
    provider: OAuthProviders,
    refreshToken: string
): Promise<TokenDetails> => {
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    return new Promise((resolve, reject) => {
        refresh.requestNewAccessToken(
            provider,
            refreshToken,
            (err, accessToken, refreshToken) => {
                if (err) {
                    return reject(err);
                }

                const tokenDetails: TokenDetails = {
                    accessToken: accessToken || '',
                    refreshToken: refreshToken || '',
                    tokenCreatedAt: new Date().toISOString()
                };

                resolve(tokenDetails);
            }
        );
    });
};

/**
 * Updates a user's token details in the database
 * 
 * @param accountId The account ID
 * @param tokenDetails The new token details
 */
export const updateUserTokens = async (
    accountId: string,
    tokenDetails: TokenDetails
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
 * Validates and refreshes token if needed
 * 
 * @param accountId The account ID
 * @param provider The OAuth provider
 * @returns A promise that resolves to the validated token details
 */
export const validateAndRefreshToken = async (
    accountId: string,
    provider: OAuthProviders
): Promise<TokenDetails> => {
    try {
        const models = await db.getModels();

        // Find the user account
        const account = await models.accounts.OAuthAccount.findOne({ id: accountId });

        if (!account) {
            throw new Error('Account not found');
        }

        const { tokenDetails } = account;

        // Check if token needs refresh
        if (isTokenExpired(tokenDetails)) {
            console.log(`Token expired for account ${accountId}, refreshing...`);

            try {
                // Refresh the token
                const newTokenDetails = await refreshAccessToken(provider, tokenDetails.refreshToken);

                // Update the database with new tokens
                await updateUserTokens(accountId, { ...newTokenDetails, refreshToken: tokenDetails.refreshToken });

                return newTokenDetails;
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                // Token refresh failed, return the original token
                // The API request might still work, or it might fail with auth errors
                return tokenDetails;
            }
        }

        // Token is still valid
        return tokenDetails;
    } catch (error) {
        console.error('Token validation error:', error);
        throw error;
    }
};