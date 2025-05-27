import { Request, Response } from 'express';
import { ApiErrorCode } from '../../types/response.types';
import { AccountType } from '../../feature/account/Account.types';
import { refreshGoogleToken, revokeTokens } from '../../feature/google/services/token';
import { createLocalJwtToken } from '../../feature/local_auth';
import { createOAuthJwtToken } from '../../feature/oauth/OAuth.jwt';
import { getNodeEnv } from '../../config/env.config';

// Environment variables
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

export interface SessionError {
    error: boolean;
    message: string;
    code: ApiErrorCode;
}

/**
 * Sets the access token as a cookie for a specific account
 * No longer signs the token - just stores it directly
 */
export const setAccessTokenCookie = (res: Response, accountId: string, accessToken: string, expiresIn: number): void => {
    res.cookie(`access_token_${accountId}`, accessToken, {
        httpOnly: true,
        secure: getNodeEnv() === 'production',
        maxAge: expiresIn,
        path: `/${accountId}`,
        sameSite: 'lax'
    });
};

/**
 * Sets the refresh token as a cookie for a specific account
 * No longer signs the token - just stores it directly
 */
export const setRefreshTokenCookie = (res: Response, accountId: string, refreshToken: string): void => {
    res.cookie(`refresh_token_${accountId}`, refreshToken, {
        httpOnly: true,
        secure: getNodeEnv() === 'production',
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
 * Note: oauthRefreshToken is already extracted by session middleware for OAuth accounts
 */
export const refreshAccessToken = async (
    accountId: string,
    oauthRefreshToken: string, // For OAuth: the actual OAuth refresh token, For Local: the JWT refresh token
    accountType: AccountType
): Promise<{ accessToken: string, expiresIn: number }> => {
    if (accountType === AccountType.OAuth) {
        // Use the OAuth refresh token to get new tokens from Google
        const tokens = await refreshGoogleToken(oauthRefreshToken);

        if (!tokens.access_token || !tokens.expiry_date) {
            throw new Error('Failed to refresh Google access token');
        }

        // Create a new JWT token that wraps the OAuth access token
        const newJwtToken = await createOAuthJwtToken(
            accountId, 
            tokens.access_token, 
            Math.floor(((tokens.expiry_date as number) - Date.now()) / 1000)
        );

        return {
            accessToken: newJwtToken,
            expiresIn: (tokens.expiry_date as number) - Date.now()
        };
    } else {
        // Local account - create new access token
        const newAccessToken = await createLocalJwtToken(accountId);
        const expiresIn = 3600 * 1000; // 1 hour in milliseconds

        return {
            accessToken: newAccessToken,
            expiresIn
        };
    }
};

/**
 * Handle token refresh for any account type
 */
export const handleTokenRefresh = async (
    accountId: string,
    extractedRefreshToken: string, // Already extracted by middleware
    accountType: AccountType,
    res: Response
): Promise<void> => {
    const newTokenInfo = await refreshAccessToken(accountId, extractedRefreshToken, accountType);

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
 * Note: OAuth tokens are already extracted by session middleware
 */
export const revokeAuthTokens = async (
    accountId: string,
    accountType: AccountType,
    extractedAccessToken: string, // For OAuth: actual OAuth access token, For Local: JWT access token
    extractedRefreshToken: string, // For OAuth: actual OAuth refresh token, For Local: JWT refresh token
    res: Response
): Promise<any> => {
    if (accountType === AccountType.OAuth) {
        // Use the already extracted OAuth tokens
        const result = await revokeTokens(extractedAccessToken, extractedRefreshToken);

        // Clear session cookies
        clearSession(res, accountId);

        return result;
    } else {
        // For local accounts, just clear the cookies (JWT tokens are stateless)
        clearSession(res, accountId);

        return { accessTokenRevoked: true, refreshTokenRevoked: true };
    }
};