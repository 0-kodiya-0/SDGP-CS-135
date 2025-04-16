import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode, AuthError, BadRequestError, NotFoundError, RedirectError, ServerError } from '../../types/response.types';
import { extractSession } from './session.manager';
import db from '../../config/db';
import { asyncHandler } from '../../utils/response';
import { isAccessTokenExpired } from '../../feature/google/services/token';
import { OAuthAccount } from '../../feature/account/Account.types';
import { validateOAuthAccount } from '../../feature/account/Account.validation';
import { removeRootUrl } from '../../utils/url';

/**
 * Middleware to verify JWT token from cookies and add session to request
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const session = extractSession(req);

    if (!session) {
        throw new AuthError('Authentication required');
    }

    // Add session data to request object
    req.session = session;
    next();
};

/**
 * Middleware to validate access to a specific account
 */
export const validateAccountAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const session = req.session;

    if (!session) {
        throw new AuthError('Authentication required');
    }

    const accountId = req.params.accountId;

    if (!accountId) {
        throw new BadRequestError('Account ID is required');
    }

    // Check if requested account ID is in the session
    if (!session.accounts.includes(accountId)) {
        throw new AuthError('No access to this account', 403);
    }

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

    const account = req.oauthAccount as OAuthAccount;

    if (isAccessTokenExpired(account.tokenDetails.expireAt, account.tokenDetails.tokenCreatedAt)) {
        const root = req.originalUrl.split('/')[1];

        throw new RedirectError(
            ApiErrorCode.TOKEN_INVALID,
            `../account/${req.oauthAccount?._id.toHexString()}/refreshToken`,
            "Access token expired",
            302, {}, root === "account" ? `..${removeRootUrl(req.originalUrl as string)}` : `..${req.originalUrl}`);
    }

    next();
});