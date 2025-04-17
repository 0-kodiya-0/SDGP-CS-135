import express, { NextFunction, Request, Response } from 'express';
import { ApiErrorCode, BadRequestError, NotFoundError, JsonSuccess, RedirectSuccess, ServerError } from '../../types/response.types';
import { toOAuthAccount } from './Account.utils';
import { clearAllSessions, clearSession, setAccessTokenCookie, setRefreshTokenCookie, validateTokenAccess } from '../../services/session';
import { OAuthAccountDocument } from './Account.model';
import db from '../../config/db';
import { asyncHandler } from '../../utils/response';
import { refreshAccessToken } from '../google/services/token';
import { OAuthProviders } from './Account.types';

export const authenticatedNeedRouter = express.Router();
export const authenticationNotNeedRouter = express.Router();

authenticationNotNeedRouter.get('/search', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const email = req.query.email as string;

    if (!email) {
        throw new BadRequestError('Email is required', 400, ApiErrorCode.MISSING_EMAIL);
    }

    const models = await db.getModels();

    const account = await models.accounts.OAuthAccount.findOne({ 'userDetails.email': email });

    if (!account) {
        throw new NotFoundError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }

    const accountDto = toOAuthAccount(account);
    next(new JsonSuccess({ accountId: accountDto?.id }, 200));
}));

// Logout all accounts (clear entire session)
authenticationNotNeedRouter.get('/logout/all', (req: Request, res: Response, next: NextFunction) => {
    const { accountIds, ...rest } = req.query;

    if (!Array.isArray(accountIds)) {
        throw new BadRequestError("Invalid format or undefine account ids");
    }

    clearAllSessions(res, accountIds as (string)[]);
    next(new RedirectSuccess(rest, "/"));
});

authenticationNotNeedRouter.get('/logout', (req: Request, res: Response, next: NextFunction) => {
    const { accountId, ...rest } = req.query;

    if (!accountId) {
        throw new BadRequestError("Missing accountId");
    }

    clearSession(res, accountId as string);
    next(new RedirectSuccess(rest, "/", undefined));
});

authenticatedNeedRouter.use('/', validateTokenAccess);

authenticatedNeedRouter.get('/refreshToken', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.query.accountId as string;

    const account = req.oauthAccount as OAuthAccountDocument;

    const refreshToken = req.refreshToken as string;

    const { redirectUrl } = req.query;

    if (!redirectUrl) {
        throw new BadRequestError("Missing redirectUrl query parameter");
    }

    if (account.provider === OAuthProviders.Google) {
        const newTokenInfo = await refreshAccessToken(refreshToken);

        // Update the token in the database
        setAccessTokenCookie(res, accountId, newTokenInfo.access_token as string, newTokenInfo.expiry_date as number);

        // If a new refresh token was provided, update that as well
        if (newTokenInfo.refresh_token) {
            setRefreshTokenCookie(res, accountId, newTokenInfo.refresh_token);
        }

    } else {
        throw new ServerError("Invalid account provider type found");
    }

    next(new RedirectSuccess(null, redirectUrl as string, undefined, undefined, undefined, false));
}));

// Get account details
authenticatedNeedRouter.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const account = req.oauthAccount as OAuthAccountDocument;
    const safeAccount = toOAuthAccount(account);

    next(new JsonSuccess(safeAccount, 200));
}));

// Update OAuth account
authenticatedNeedRouter.patch('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const account = req.oauthAccount as OAuthAccountDocument;
    const updates = req.body;

    // Apply updates to the account
    Object.assign(account, {
        ...updates,
        updated: new Date().toISOString()
    });

    await account.save();

    // Convert to safe account type
    const updatedAccount = toOAuthAccount(account);
    next(new JsonSuccess(updatedAccount, 200));
}));

// Remove account from session and revoke tokens
// authenticatedNeedRouter.delete('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const { accountId } = req.params;
//     const session = req.session as SessionPayload;

//     // Remove account from session
//     const updatedAccounts = session.accounts.filter(id => id !== accountId);

//     // If no accounts left, clear the session
//     if (updatedAccounts.length === 0) {
//         res.clearCookie('session_token', { path: '/' });
//         next(new JsonSuccess({ message: 'Account removed and session cleared' }, 200));
//         return;
//     }

//     // Update the session
//     const updatedSession = {
//         ...session,
//         accounts: updatedAccounts
//     };

//     createSessionToken(res, updatedSession);
//     next(new JsonSuccess({ message: 'Account removed from session' }, 200));
// }));

/**
 * GET endpoint to retrieve email address for a specific account
 * This route requires authentication and account access validation
 */
authenticatedNeedRouter.get('/email', (req: Request, res: Response, next: NextFunction) => {
    const account = req.oauthAccount as OAuthAccountDocument;

    next(new JsonSuccess({ email: account.userDetails.email }, 200));
});

// Update OAuth account security settings
authenticatedNeedRouter.patch('/security', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const securityUpdates = req.body;
    const account = req.oauthAccount as OAuthAccountDocument;

    // Update security settings
    account.security = {
        ...account.security,
        ...securityUpdates
    };
    account.updated = new Date().toISOString();

    await account.save();

    // Convert to safe account type
    const updatedAccount = toOAuthAccount(account);
    next(new JsonSuccess(updatedAccount, 200));
}));