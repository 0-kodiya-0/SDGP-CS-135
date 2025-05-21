import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiErrorCode } from '../../types/response.types';
import { AccountType } from '../../feature/account/Account.types';
import { createLocalJwtToken, getTokenExpiration, verifyRefreshToken } from './session.jwt';
import { refreshAccessToken as refreshGoogleToken } from '../../feature/google/services/token';
import { getAccountTypeById } from '../../feature/account/Account.utils';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

export interface SessionError {
    error: boolean;
    message: string;
    code: ApiErrorCode;
}

/**
 * Verify a session token
 * For OAuth tokens - simply verifies the JWT
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
        maxAge: expiresIn, // Convert seconds to milliseconds
        path: `/${accountId}`, // Path-specific cookie
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
        maxAge: COOKIE_MAX_AGE, // Very long expiration
        path: `/${accountId}/account/refreshToken`, // Path-specific for refresh token endpoint
        sameSite: 'lax'
    });
};

/**
 * Extract access token from cookies or authorization header for a specific account
 */
export const extractAccessToken = (req: Request, accountId: string): string | null => {
    // Try to get from cookies first
    const cookieToken = req.cookies[`access_token_${accountId}`];
    if (cookieToken) return cookieToken;
    
    // If not in cookies, try to get from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    return null;
};

/**
 * Extract refresh token from cookies for a specific account
 */
export const extractRefreshToken = (req: Request, accountId: string): string | null => {
    return req.cookies[`refresh_token_${accountId}`];
};

/**
 * Clear all session cookies for a list of account IDs
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
 * Works for both OAuth and local accounts
 */
export const refreshAccessToken = async (accountId: string, refreshToken: string): Promise<{ accessToken: string, expiresIn: number }> => {
    try {
        const accountType = await getAccountTypeById(accountId);
        
        if (!accountType) {
            throw new Error('Account not found');
        }
        
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
                
                // Check if token is for the correct account
                if (decoded.accountId !== accountId) {
                    throw new Error('Invalid refresh token');
                }
                
                // Create new access token
                const newAccessToken = await createLocalJwtToken(accountId);
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