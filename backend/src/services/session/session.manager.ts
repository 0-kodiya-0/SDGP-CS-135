import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiErrorCode } from '../../types/response.types';
import { AccountType } from '../../feature/account/Account.types';
import { refreshGoogleToken, revokeTokens } from '../../feature/google/services/token';
import { createLocalJwtToken, verifyLocalRefreshToken } from '../../feature/local_auth';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

export interface SessionError {
    error: boolean;
    message: string;
    code: ApiErrorCode;
}

/**
 * Verify a session token (for OAuth tokens)
 */
export const verifySession = (session: string) => {
    return jwt.verify(session, JWT_SECRET);
}

/**
 * Sets the access token as a cookie for a specific account
 */
export const setAccessTokenCookie = (res: Response, accountId: string, accessToken: string, expiresIn: number): void => {
    res.cookie(`access_token_${accountId}`, jwt.sign(accessToken, JWT_SECRET), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expiresIn,
        path: `/${accountId}`,
        sameSite: 'lax'
    });
};

/**
 * Sets the refresh token as a cookie for a specific account
 */
export const setRefreshTokenCookie = (res: Response, accountId: string, refreshToken: string): void => {
    res.cookie(`refresh_token_${accountId}`, jwt.sign(refreshToken, JWT_SECRET), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_MAX_AGE,
        path: `/${accountId}/account/refreshToken`,
        sameSite: 'lax'
    });
};

/**
 * Extract access token from cookies or authorization header
 */
export const extractAccessToken = (req: Request, accountId: string): string | null => {
    const cookieToken = req.cookies[`access_token_${accountId}`];
    if (cookieToken) return cookieToken;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return null;
};

/**
 * Extract refresh token from cookies
 */
export const extractRefreshToken = (req: Request, accountId: string): string | null => {
    return req.cookies[`refresh_token_${accountId}`];
};

/**
 * Clear all session cookies
 */
export const clearAllSessions = (res: Response, accountIds: string[]) => {
    accountIds.forEach(accountId => {
        res.clearCookie(`access_token_${accountId}`, { path: `/${accountId}` });
        res.clearCookie(`refresh_token_${accountId}`, { path: `/${accountId}/account/refreshToken` });
    });
}

/**
 * Clear session cookies for a specific account
 */
export const clearSession = (res: Response, accountId: string) => {
    res.clearCookie(`access_token_${accountId}`, { path: `/${accountId}` });
    res.clearCookie(`refresh_token_${accountId}`, { path: `/${accountId}/account/refreshToken` });
}

/**
 * Refresh an access token using a refresh token
 * Delegates to appropriate feature based on account type
 */
export const refreshAccessToken = async (
    accountId: string,
    refreshToken: string,
    accountType: AccountType
): Promise<{ accessToken: string, expiresIn: number }> => {
    try {
        if (accountType === AccountType.OAuth) {
            // For OAuth accounts, use Google refresh flow
            const tokens = await refreshGoogleToken(refreshToken);

            if (!tokens.access_token || !tokens.expiry_date) {
                throw new Error('Failed to refresh Google access token');
            }

            return {
                accessToken: tokens.access_token,
                expiresIn: (tokens.expiry_date as number) - Date.now()
            };
        } else {

            try {
                const decoded = verifyLocalRefreshToken(refreshToken);

                if (decoded.accountId !== accountId) {
                    throw new Error('Invalid refresh token');
                }

                // Create new access token
                const newAccessToken = await createLocalJwtToken(accountId);
                const expiresIn = 3600 * 1000; // 1 hour in milliseconds

                return {
                    accessToken: newAccessToken,
                    expiresIn
                };
            } catch {
                throw new Error('Invalid or expired refresh token');
            }
        }
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw new Error('Failed to refresh access token');
    }
};

/**
 * Handle token refresh for any account type
 */
export const handleTokenRefresh = async (
    accountId: string,
    refreshToken: string,
    accountType: AccountType,
    res: Response
): Promise<void> => {
    const newTokenInfo = await refreshAccessToken(accountId, refreshToken, accountType);

    // Update the access token cookie
    setAccessTokenCookie(
        res,
        accountId,
        newTokenInfo.accessToken,
        newTokenInfo.expiresIn
    );
};

/**
 * Revoke tokens based on account type
 */
export const revokeAuthTokens = async (
    accountId: string,
    accountType: AccountType,
    accessToken: string,
    refreshToken: string,
    res: Response
): Promise<any> => {
    if (accountType === AccountType.OAuth) {
        const result = await revokeTokens(accessToken, refreshToken);

        // Clear session cookies
        clearSession(res, accountId);

        return result;
    } else {
        // For local accounts, just clear the cookies (JWT tokens are stateless)
        clearSession(res, accountId);

        // Could also add to a blacklist if needed for security
        return { accessTokenRevoked: true, refreshTokenRevoked: true };
    }
};