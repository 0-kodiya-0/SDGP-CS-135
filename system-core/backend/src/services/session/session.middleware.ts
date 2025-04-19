import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode, BadRequestError, NotFoundError, RedirectError, ServerError } from '../../types/response.types';
import db from '../../config/db';
import { asyncHandler } from '../../utils/response';
import { validateOAuthAccount } from '../../feature/account/Account.validation';
import { extractAccessToken, extractRefreshToken, verifySession } from './session.manager';
import { removeRootUrl } from '../../utils/url';
import mongoose from 'mongoose';

/**
 * Middleware to verify JWT token from cookies and add accessToken to request
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
 */
export const validateAccountAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    const models = await db.getModels();

    const account = await models.accounts.OAuthAccount.findOne({ _id: accountId });

    if (!account) {
        throw new NotFoundError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }

    try {
        validateOAuthAccount(account);
    } catch {
        throw new ServerError('Invalid user object. Please contact system admins.');
    }

    req.oauthAccount = account;

    next();
});

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

        const tokenPayload = verifySession(token);

        if (typeof tokenPayload !== "string") {
            throw new BadRequestError("Invalid payload format");
        }

        if (isRefreshTokenPath) {
            req.refreshToken = tokenPayload;
        } else {
            req.accessToken = tokenPayload;
        }

        next();
    } catch {
        const accountPath = req.oauthAccount?.id || req.oauthAccount?._id?.toHexString?.() || accountId;

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