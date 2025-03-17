import express, { Request, Response } from 'express';
import { AccountType } from './Account.types';
import crypto from 'crypto';
import db from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';
import { validateAccountAccess, createRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../../utils/session';
import { toOAuthAccount } from './Account.utils';

export const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    if (!req.session) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    res.json({ accounts: req.session.accounts });
});

// Middleware to validate account access
router.use('/:accountId', validateAccountAccess);

// Get account details
router.get('/:accountId', async (req: Request, res: Response) => {
    const { accountId } = req.params;

    try {
        const models = await db.getModels();

        const account = await models.accounts.OAuthAccount.findOne({ id: accountId });

        if (!account) {
            sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
            return;
        }

        // Convert to OAuthAccount type safely
        const safeAccount = toOAuthAccount(account);

        sendSuccess(res, 200, safeAccount);
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Database operation failed');
    }
});

// Update OAuth account
router.patch('/:accountId', async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const updates = req.body;

    try {
        const models = await db.getModels();

        const account = await models.accounts.OAuthAccount.findOne({ id: accountId });

        if (!account) {
            sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
            return;
        }

        // Apply updates to the account
        Object.assign(account, {
            ...updates,
            updated: new Date().toISOString()
        });

        await account.save();

        // Convert to safe account type
        const updatedAccount = toOAuthAccount(account);
        sendSuccess(res, 200, updatedAccount);
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Database operation failed');
    }
});

// Refresh OAuth token for a specific account
router.post('/:accountId/refresh', async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const { refreshToken } = req.body;

    if (!refreshToken) {
        sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Refresh token is required');
        return;
    }

    // Verify the refresh token
    const isValid = await verifyRefreshToken(accountId, refreshToken);

    if (!isValid) {
        sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Invalid or expired refresh token');
        return;
    }

    try {
        const models = await db.getModels();

        const account = await models.accounts.OAuthAccount.findOne({ id: accountId });

        if (!account) {
            sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
            return;
        }

        // Generate new access token
        const tokenDetails = {
            accessToken: crypto.randomBytes(32).toString('hex'),
            refreshToken: account.tokenDetails.refreshToken
        };

        // Update account with new token
        account.tokenDetails = tokenDetails;
        account.updated = new Date().toISOString();
        account.accountType = AccountType.OAuth;

        await account.save();

        // Generate a new refresh token
        const newRefreshToken = await createRefreshToken(accountId);

        sendSuccess(res, 200, {
            accessToken: tokenDetails.accessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Token refresh failed');
    }
});

// Remove account from session and revoke tokens
router.delete('/:accountId', async (req: Request, res: Response) => {
    const { accountId } = req.params;

    try {
        // Revoke refresh tokens for this account
        await revokeRefreshToken(accountId);

        sendSuccess(res, 200, { message: 'Account removed from session' });
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to remove account');
    }
});

// Update OAuth account security settings
router.patch('/:accountId/security', async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const securityUpdates = req.body;

    try {
        const models = await db.getModels();

        const account = await models.accounts.OAuthAccount.findOne({ id: accountId });

        if (!account) {
            sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
            return;
        }

        // Update security settings
        account.security = {
            ...account.security,
            ...securityUpdates
        };
        account.updated = new Date().toISOString();

        await account.save();

        // Convert to safe account type
        const updatedAccount = toOAuthAccount(account);
        sendSuccess(res, 200, updatedAccount);
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Database operation failed');
    }
});