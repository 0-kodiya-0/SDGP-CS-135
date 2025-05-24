import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode, BadRequestError, NotFoundError, RedirectError, ServerError } from '../../types/response.types';
import db from '../../config/db';
import { asyncHandler } from '../../utils/response';
import { validateOAuthAccount, validateLocalAccount } from '../../feature/account/Account.validation';
import { extractAccessToken, extractRefreshToken, verifySession } from './session.manager';
import { removeRootUrl } from '../../utils/url';
import mongoose from 'mongoose';
import { AccountType } from '../../feature/account/Account.types';
import { getAccountTypeById } from '../../feature/account/Account.utils';
import { verifyJwtToken } from './session.jwt';
import { LocalAccountDocument, OAuthAccountDocument } from '../../feature/account/Account.model';

/**
 * Middleware to verify token from cookies and add accountId to request
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    if (!accountId) {
        throw new BadRequestError('Account ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
        throw new BadRequestError('Invalid Account ID format');
    }

    next();
};

/**
 * Middleware to validate access to a specific account
 * Handles both OAuth and Local accounts
 */
export const validateAccountAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    const models = await db.getModels();

    // Determine account type (OAuth or Local)
    const accountType = await getAccountTypeById(accountId);

    if (!accountType) {
        throw new NotFoundError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }

    // Load the appropriate account type
    let account;
    if (accountType === AccountType.OAuth) {
        account = await models.accounts.OAuthAccount.findOne({ _id: accountId });
        
        if (!account) {
            throw new NotFoundError('OAuth account not found', 404, ApiErrorCode.USER_NOT_FOUND);
        }
        
        try {
            validateOAuthAccount(account);
        } catch {
            throw new ServerError('Invalid OAuth account object. Please contact system admins.');
        }
    } else {
        account = await models.accounts.LocalAccount.findOne({ _id: accountId });
        
        if (!account) {
            throw new NotFoundError('Local account not found', 404, ApiErrorCode.USER_NOT_FOUND);
        }
        
        try {
            validateLocalAccount(account);
        } catch {
            throw new ServerError('Invalid local account object. Please contact system admins.');
        }
    }

    // Attach the account to the request for downstream middleware/handlers
    req.oauthAccount = accountType === AccountType.OAuth ? account as OAuthAccountDocument : undefined;
    req.localAccount = accountType === AccountType.Local ? account as LocalAccountDocument : undefined;

    next();
});

/**
 * Middleware to validate token access
 * Handles both OAuth and Local auth tokens
 */
export const validateTokenAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    const accessToken = extractAccessToken(req, accountId);
    const refreshToken = extractRefreshToken(req, accountId);
    const isRefreshTokenPath = req.path === "/account/refreshToken";

    console.log(req.cookies, req.params, req.path);

    const token: string | null = isRefreshTokenPath ? refreshToken : accessToken;

    try {
        if (!token) {
            if (isRefreshTokenPath) {
                return next(new BadRequestError("Missing refresh token"));
            } else {
                throw new Error("Token not found");
            }
        }

        // For JWT tokens (used in local auth), we need to verify differently
        const accountType = await getAccountTypeById(accountId);
        
        if (accountType === AccountType.Local) {
            // For local auth, verify JWT token
            try {
                const { accountId: tokenAccountId } = verifyJwtToken(token);
                
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
        } else {
            // For OAuth, use the existing flow
            const tokenPayload = verifySession(token);

            if (typeof tokenPayload !== "string") {
                throw new BadRequestError("Invalid payload format");
            }

            if (isRefreshTokenPath) {
                req.refreshToken = tokenPayload;
            } else {
                req.accessToken = tokenPayload;
            }
        }

        next();
    } catch {
        const accountPath = req.oauthAccount?.id || req.localAccount?.id || 
                          req.oauthAccount?._id?.toHexString?.() || 
                          req.localAccount?._id?.toHexString?.() || 
                          accountId;

        if (isRefreshTokenPath) {
            throw new RedirectError(
                ApiErrorCode.TOKEN_INVALID,
                `/api/v1/account/logout?accountId=${accountPath}`,
                "Access token expired",
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