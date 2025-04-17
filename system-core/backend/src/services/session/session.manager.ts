import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
// import crypto from 'crypto';
// import { SessionPayload } from '../../types/session.types';
// import db from '../../config/db';
import { ApiErrorCode } from '../../types/response.types';
// import { OAuthProviders } from '../../feature/account/Account.types';
// import { getTokenInfo } from '../../feature/google/services/token';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
// const MAX_ACCOUNTS_PER_SESSION = 20;

export interface SessionError {
    error: boolean;
    message: string;
    code: ApiErrorCode;
}

export const verifySession = (session: string) => {
    return jwt.verify(session, JWT_SECRET);
}

/**
 * Sets the access token as a cookie for a specific account
 */
export const setAccessTokenCookie = (res: Response, accountId: string, accessToken: string, expiresIn: number): void => {
    res.cookie(`access_token_${accountId}`, jwt.sign(accessToken, JWT_SECRET), {
        httpOnly: true,
        secure: true,
        maxAge: expiresIn * 1000, // Convert seconds to milliseconds
        path: `/${accountId}` // Path-specific cookie
    });
};

/**
 * Sets the refresh token as a cookie for a specific account
 */
export const setRefreshTokenCookie = (res: Response, accountId: string, refreshToken: string): void => {
    res.cookie(`refresh_token_${accountId}`, jwt.sign(refreshToken, JWT_SECRET), {
        httpOnly: true,
        secure: true,
        maxAge: COOKIE_MAX_AGE, // Very long expiration
        path: `/${accountId}/refreshToken` // Path-specific for refresh token endpoint
    });
};

/**
 * Extract access token from cookies for a specific account
 */
export const extractAccessToken = (req: Request, accountId: string): string | null => {
    return req.cookies[`access_token_${accountId}`] || null;
};

/**
 * Extract refresh token from cookies for a specific account
 */
export const extractRefreshToken = (req: Request, accountId: string): string | null => {
    return req.cookies[`refresh_token_${accountId}`] || null;
};

export const clearAllSessions = (res: Response, accountIds: (string)[]) => {
    accountIds.forEach(accountId => {
        res.clearCookie(`access_token_${accountId}`, { path: `/${accountId}` });
        res.clearCookie(`refresh_token_${accountId}`, { path: `/${accountId}/refreshToken` });
    });
}

export const clearSession = (res: Response, accountId: string) => {
    res.clearCookie(`access_token_${accountId}`, { path: `/${accountId}` });
    res.clearCookie(`refresh_token_${accountId}`, { path: `/${accountId}/refreshToken` });
}

/**
 * Creates or updates a session with a new account and token information
 */
// export const createOrUpdateSession = async (res: Response, accountId: string, req: Request) => {
//     const currentSession = extractSession(req);

//     let sessionPayload: SessionPayload;
//     // let isNewSession = false;

//     if (currentSession) {
//         // Check if this account is already in the session
//         const existingAccountIndex = currentSession.accounts.findIndex(id => id === accountId);

//         if (existingAccountIndex >= 0) {
//             // Account already exists in session, no change needed
//             sessionPayload = currentSession;
//         } else {
//             // Check if we've reached the maximum number of accounts
//             if (currentSession.accounts.length >= MAX_ACCOUNTS_PER_SESSION) {
//                 throw new SessionValidationError("Maximum number of accounts reached");
//             }

//             // Add the new account ID to the existing session
//             sessionPayload = {
//                 ...currentSession,
//                 accounts: [...currentSession.accounts, accountId]
//             };
//         }
//     } else {
//         // Create a new session
//         const sessionId = crypto.randomBytes(16).toString('hex');

//         sessionPayload = {
//             sessionId: sessionId,
//             accounts: [accountId],
//             createdAt: Date.now(),
//             // Set expiry far in the future (matches cookie expiration)
//             expiresAt: Date.now() + COOKIE_MAX_AGE
//         };
//     }

//     // Create the session token
//     createSessionToken(res, sessionPayload);
// };

/**
 * Updates a user's token details in the database
 */
// export const updateDbUserTokens = async (
//     accountId: string,
//     provider: OAuthProviders,
//     accessToken: string,
//     refreshToken?: string
// ): Promise<void> => {
//     const models = await db.getModels();

//     let accessTokenInfo;
//     if (provider === OAuthProviders.Google) {
//         accessTokenInfo = await getTokenInfo(accessToken);
//     } else {
//         throw new BadRequestError("Invalid provider found");
//     }

//     if (!accessTokenInfo.expires_in) {
//         throw new ServerError("Error getting token detail from provider");
//     }

//     // Create update object with required fields
//     const updateFields: Record<string, any> = {
//         'tokenDetails.accessToken': accessToken,
//         'tokenDetails.tokenCreatedAt': Date.now(),
//         "tokenDetails.expireAt": accessTokenInfo.expires_in,
//         'updated': new Date().toISOString()
//     };

//     // Only add refreshToken to update if provided
//     if (refreshToken && refreshToken.length !== 0) {
//         updateFields['tokenDetails.refreshToken'] = refreshToken;
//     }

//     // Find and update token details
//     await models.accounts.OAuthAccount.updateOne(
//         { _id: accountId },
//         { $set: updateFields }
//     );
// };