import express, { Request, Response } from 'express';
import { AccountType, OAuthAccount } from './Account.types';
import crypto from 'crypto';
import db from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';

export const router = express.Router();

// Get OAuth accounts
router.get('/', (req: Request, res: Response) => {
    sendSuccess(res, 200, db.data.oauthAccounts);
});

// Update OAuth account
router.patch('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const accountIndex = db.data.oauthAccounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
        sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
        return;
    }

    const updatedAccount: OAuthAccount = {
        ...db.data.oauthAccounts[accountIndex],
        ...updates,
        updated: new Date().toISOString(),
    };

    db.data.oauthAccounts[accountIndex] = updatedAccount;
    await db.write();

    sendSuccess(res, 200, updatedAccount);
});

// Remove OAuth account
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    db.data.oauthAccounts = db.data.oauthAccounts.filter(acc => acc.id !== id);
    await db.write();

    res.status(204).send();
});

// Refresh OAuth token
router.post('/:id/refresh', async (req: Request, res: Response) => {
    const { id } = req.params;
    const account = db.data.oauthAccounts.find(acc => acc.id === id);

    if (!account) {
        sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
        return;
    }

    try {
        const tokenDetails = {
            accessToken: crypto.randomBytes(32).toString('hex'),
            refreshToken: account.tokenDetails.refreshToken,
        };

        const accountIndex = db.data.oauthAccounts.findIndex(acc => acc.id === id);
        const updatedAccount: OAuthAccount = {
            ...account,
            tokenDetails,
            updated: new Date().toISOString(),
            accountType: AccountType.OAuth,
        };

        db.data.oauthAccounts[accountIndex] = updatedAccount;
        await db.write();
        sendSuccess(res, 200, tokenDetails);
    } catch {
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Token refresh failed');
    }
});

// Update OAuth account security settings
router.patch('/:id/security', async (req: Request, res: Response) => {
    const { id } = req.params;
    const securityUpdates = req.body;

    const accountIndex = db.data.oauthAccounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
        sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
        return;
    }

    const updatedAccount: OAuthAccount = {
        ...db.data.oauthAccounts[accountIndex],
        security: {
            ...db.data.oauthAccounts[accountIndex].security,
            ...securityUpdates,
        },
        updated: new Date().toISOString(),
    };

    db.data.oauthAccounts[accountIndex] = updatedAccount;
    await db.write();

    sendSuccess(res, 200, updatedAccount);
});