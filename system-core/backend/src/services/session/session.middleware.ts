import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode, AuthError, BadRequestError, NotFoundError, RedirectError, ServerError } from '../../types/response.types';
import db from '../../config/db';
import { asyncHandler } from '../../utils/response';
import { validateOAuthAccount } from '../../feature/account/Account.validation';
import { extractAccessToken, verifySession } from './session.manager';
import { removeRootUrl } from '../../utils/url';

/**
 * Middleware to verify JWT token from cookies and add accessToken to request
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    if (!accountId) {
        throw new BadRequestError('Account ID is required');
    }

    const accessToken = extractAccessToken(req, accountId);

    if (!accessToken) {
        throw new AuthError('Authentication required');
    }

    // Add accessToken data to request object
    req.accessToken = accessToken;
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

    let token: string;

    if (req.url === "/refreshToken") {
        token = req.refreshToken as string;
    } else {
        token = req.accessToken as string;
    }

    let tokenPayload;

    try {
        tokenPayload = verifySession(token) as string;
    } catch {
        if (req.url === "/refreshToken") {
            throw new RedirectError(
                ApiErrorCode.TOKEN_INVALID,
                `../account/logout?accountId=${req.oauthAccount?.id || req.oauthAccount?._id.toHexString()}`,
                "Access token expired",
                302);
        } else {
            throw new RedirectError(
                ApiErrorCode.TOKEN_INVALID,
                `../${req.oauthAccount?.id || req.oauthAccount?._id.toHexString()}/account/refreshToken`,
                "Access token expired",
                302, undefined, `..${removeRootUrl(req.originalUrl as string)}`);
        }
    }

    if (tokenPayload && typeof tokenPayload === "string") {
        if (req.url === "/refreshToken") {
            req.refreshToken = tokenPayload;
        } else {
            req.accessToken = tokenPayload;
        }
        next();
    } else {
        throw new BadRequestError("Invalid payload format");
    }
});