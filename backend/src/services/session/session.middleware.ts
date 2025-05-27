import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode, BadRequestError, NotFoundError, RedirectError, ServerError } from '../../types/response.types';
import db from '../../config/db';
import { asyncHandler } from '../../utils/response';
import { validateAccount } from '../../feature/account/Account.validation';
import { extractAccessToken, extractRefreshToken } from './session.manager';
import { removeRootUrl } from '../../utils/url';
import { AccountType } from '../../feature/account/Account.types';
import { AccountDocument } from '../../feature/account/Account.model';
import { ValidationUtils } from '../../utils/validation';
import { verifyLocalJwtToken } from '../../feature/local_auth';
import { verifyOAuthJwtToken, verifyOAuthRefreshToken } from '../../feature/oauth/OAuth.jwt';

/**
 * Middleware to verify token from cookies and add accountId to request
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    // Use centralized validation instead of duplicate logic
    ValidationUtils.validateObjectId(accountId, 'Account ID');

    next();
};

/**
 * Middleware to validate access to a specific account
 * Now works with unified Account model
 */
export const validateAccountAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    const models = await db.getModels();
    const account = await models.accounts.Account.findOne({ _id: accountId });

    if (!account) {
        throw new NotFoundError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }

    try {
        validateAccount(account);
    } catch {
        throw new ServerError('Invalid account object. Please contact system admins.');
    }

    // Attach the account to the request for downstream middleware/handlers
    // We'll use a unified property name
    req.account = account as AccountDocument;
    
    // Keep legacy properties for backward compatibility during transition
    if (account.accountType === AccountType.OAuth) {
        req.oauthAccount = account as AccountDocument;
    } else {
        req.localAccount = account as AccountDocument;
    }

    next();
});

/**
 * Middleware to validate token access
 * Now properly handles both OAuth and Local auth tokens with security verification
 */
export const validateTokenAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const account = req.account as AccountDocument;

    if (!account) {
        throw new ServerError('Account not loaded in middleware chain');
    }

    const accessToken = extractAccessToken(req, accountId);
    const refreshToken = extractRefreshToken(req, accountId);
    const isRefreshTokenPath = req.path === "/account/refreshToken";

    const token: string | null = isRefreshTokenPath ? refreshToken : accessToken;

    try {
        if (!token) {
            if (isRefreshTokenPath) {
                return next(new BadRequestError("Missing refresh token"));
            } else {
                throw new Error("Token not found");
            }
        }

        if (account.accountType === AccountType.Local) {
            // For local auth, verify JWT token
            try {
                const { accountId: tokenAccountId } = verifyLocalJwtToken(token);

                // Check if token belongs to the right account
                if (tokenAccountId !== accountId) {
                    throw new Error('Invalid token for this account');
                }

                if (isRefreshTokenPath) {
                    req.refreshToken = token;
                } else {
                    req.accessToken = token;
                }
            } catch {
                throw new Error('Invalid or expired token');
            }
        } else if (account.accountType === AccountType.OAuth) {
            // For OAuth, verify our JWT wrapper and extract OAuth token
            try {
                if (isRefreshTokenPath) {
                    // For refresh token path, we expect a refresh token
                    const { accountId: tokenAccountId, oauthRefreshToken } = verifyOAuthRefreshToken(token);

                    // Check if token belongs to the right account
                    if (tokenAccountId !== accountId) {
                        throw new Error('Invalid refresh token for this account');
                    }

                    req.refreshToken = token;
                    req.oauthRefreshToken = oauthRefreshToken;
                } else {
                    // For access token, verify and extract OAuth access token
                    const { accountId: tokenAccountId, oauthAccessToken } = verifyOAuthJwtToken(token);

                    // Check if token belongs to the right account
                    if (tokenAccountId !== accountId) {
                        throw new Error('Invalid access token for this account');
                    }

                    // Store both our JWT and the extracted OAuth token
                    req.accessToken = token; // Our JWT wrapper
                    // We'll need the OAuth access token for Google API calls
                    req.oauthAccessToken = oauthAccessToken;
                }
            } catch {
                throw new Error('Invalid or expired OAuth token');
            }
        } else {
            throw new Error('Unsupported account type');
        }

        next();
    } catch {
        const accountPath = account.id || account._id?.toHexString?.() || accountId;

        if (isRefreshTokenPath) {
            throw new RedirectError(
                ApiErrorCode.TOKEN_INVALID,
                `/api/v1/account/logout?accountId=${accountPath}`,
                "Refresh token expired",
                302
            );
        } else {
            throw new RedirectError(
                ApiErrorCode.TOKEN_INVALID,
                `../${accountPath}/account/refreshToken`,
                "Access token expired",
                302,
                undefined,
                `..${removeRootUrl(req.originalUrl)}`
            );
        }
    }
});