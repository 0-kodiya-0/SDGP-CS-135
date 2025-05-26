import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiErrorCode } from '../../types/response.types';
import { AccountType } from '../../feature/account/Account.types';
import { createLocalJwtToken, getTokenExpiration, verifyRefreshToken } from './session.jwt';
import { refreshGoogleToken } from '../../feature/google/services/token';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

export interface SessionError {
    error: boolean;
    message: string;
    code: ApiErrorCode;
}

/**
 * Verify a session token (unchanged)
 */
export const verifySession = (session: string) => {
    return jwt.verify(session, JWT_SECRET);
}

/**
 * Sets the access token as a cookie for a specific account (unchanged)
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
 * Sets the refresh token as a cookie for a specific account (unchanged)
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
 * Extract access token from cookies or authorization header (unchanged)
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
 * Extract refresh token from cookies (unchanged)
 */
export const extractRefreshToken = (req: Request, accountId: string): string | null => {
    return req.cookies[`refresh_token_${accountId}`];
};

/**
 * Clear all session cookies (unchanged)
 */
export const clearAllSessions = (res: Response, accountIds: string[]) => {
    accountIds.forEach(accountId => {
        res.clearCookie(`access_token_${accountId}`, { path: `/${accountId}` });
        res.clearCookie(`refresh_token_${accountId}`, { path: `/${accountId}/account/refreshToken` });
    });
}

/**
 * Clear session cookies for a specific account (unchanged)
 */
export const clearSession = (res: Response, accountId: string) => {
    res.clearCookie(`access_token_${accountId}`, { path: `/${accountId}` });
    res.clearCookie(`refresh_token_${accountId}`, { path: `/${accountId}/account/refreshToken` });
}

/**
 * OPTIMIZED: Refresh an access token using a refresh token
 * Accept accountType as parameter instead of querying database
 * @param accountId Account ID
 * @param refreshToken Refresh token
 * @param accountType Account type (passed from caller who already knows it)
 */
export const refreshAccessToken = async (
    accountId: string, 
    refreshToken: string,
    accountType: AccountType // Accept as parameter instead of querying DB
): Promise<{ accessToken: string, expiresIn: number }> => {
    try {
        // No need to call getAccountTypeById - use provided accountType
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
            // For local accounts, verify refresh token and create a new access token
            try {
                const decoded = verifyRefreshToken(refreshToken);
                
                if (decoded.accountId !== accountId) {
                    throw new Error('Invalid refresh token');
                }
                
                // Create new access token - pass accountType instead of querying
                const newAccessToken = await createLocalJwtToken(accountId, accountType);
                const expiresIn = getTokenExpiration(newAccessToken) - Date.now();
                
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
}