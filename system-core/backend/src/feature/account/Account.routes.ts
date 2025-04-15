import express, { NextFunction, Request, Response } from 'express';
import { ApiErrorCode, BadRequestError, NotFoundError, JsonSuccess, RedirectSuccess, AuthError, ServerError } from '../../types/response.types';
import { toOAuthAccount } from './Account.utils';
import { createSessionToken, updateDbUserTokens, validateAccountAccess, validateTokenAccess } from '../../services/session';
import { OAuthAccountDocument } from './Account.model';
import { SessionPayload } from '../../types/session.types';
import db from '../../config/db';
import { asyncHandler } from '../../utils/response';
import { refreshAccessToken } from '../google/services/token';
import { OAuthProviders } from './Account.types';

export const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
        throw new AuthError('Not authenticated');
    }
    next(new JsonSuccess({ accounts: req.session.accounts }, 200));
});

router.get('/search', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/logout/all', (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie('session_token', { path: '/' });
    next(new RedirectSuccess(null, "/"));
});

router.get('/logout/:accountId', (req: Request, res: Response, next: NextFunction) => {
    const { accountId } = req.params;
    const session = req.session;

    if (!session) {
        next(new RedirectSuccess(null, "/"));
        return;
    }

    // Remove account from session
    const updatedAccounts = session.accounts.filter(id => id !== accountId);

    // If no accounts left, clear the session
    if (updatedAccounts.length === 0) {
        res.clearCookie('session_token', { path: '/' });
        next(new RedirectSuccess(null, "/"));
        return;
    }

    // Update the session
    const updatedSession = {
        ...session,
        accounts: updatedAccounts
    };

    createSessionToken(res, updatedSession);
    next(new RedirectSuccess(null, "/"));
});

router.get('/:accountId/refreshToken', validateAccountAccess, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const account = req.oauthAccount as OAuthAccountDocument;

    const { redirectUrl } = req.query;

    if (!redirectUrl) {
        throw new BadRequestError("Missing redirectUrl query parameter");
    }

    if (account.provider === OAuthProviders.Google) {
        const newTokenInfo = await refreshAccessToken(account.tokenDetails.refreshToken);

        // Update the token in the database
        await updateDbUserTokens(account._id.toHexString(), account.provider, newTokenInfo.accessToken);

    } else {
        throw new ServerError("Invalid account provider type found");
    }

    next(new RedirectSuccess(null, redirectUrl as string));
}));

router.use('/:accountId', validateAccountAccess, validateTokenAccess);

// Get account details
router.get('/:accountId', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const account = req.oauthAccount as OAuthAccountDocument;
    const safeAccount = toOAuthAccount(account);

    next(new JsonSuccess(safeAccount, 200));
}));

// Update OAuth account
router.patch('/:accountId', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
router.delete('/:accountId', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { accountId } = req.params;
    const session = req.session as SessionPayload;

    // Remove account from session
    const updatedAccounts = session.accounts.filter(id => id !== accountId);

    // If no accounts left, clear the session
    if (updatedAccounts.length === 0) {
        res.clearCookie('session_token', { path: '/' });
        next(new JsonSuccess({ message: 'Account removed and session cleared' }, 200));
        return;
    }

    // Update the session
    const updatedSession = {
        ...session,
        accounts: updatedAccounts
    };

    createSessionToken(res, updatedSession);
    next(new JsonSuccess({ message: 'Account removed from session' }, 200));
}));

/**
 * GET endpoint to retrieve email address for a specific account
 * This route requires authentication and account access validation
 */
router.get('/:accountId/email', (req: Request, res: Response, next: NextFunction) => {
    const account = req.oauthAccount as OAuthAccountDocument;

    next(new JsonSuccess({ email: account.userDetails.email }, 200));
});

// Update OAuth account security settings
router.patch('/:accountId/security', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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