import express, { Request, Response } from 'express';
import db from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';
import { toOAuthAccount } from './Account.utils';
import { SessionManager, validateAccountAccess } from '../../services/session';

export const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    if (!req.session) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    res.json({ accounts: req.session.accounts });
});

// Logout all accounts (clear entire session)
router.get('/logout/all', (req: Request, res: Response) => {
    res.clearCookie('session_token', { path: '/' });
    res.redirect('/');
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

// Remove account from session and revoke tokens
router.delete('/:accountId', async (req: Request, res: Response) => {
    const { accountId } = req.params;

    try {
        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);

        if (!session) {
            sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'No active session');
            return;
        }

        // Remove account from session
        const updatedAccounts = session.accounts.filter(acc => acc.accountId !== accountId);

        // If no accounts left, clear the session
        if (updatedAccounts.length === 0) {
            res.clearCookie('session_token', { path: '/' });
            sendSuccess(res, 200, { message: 'Account removed and session cleared' });
            return;
        }

        // Update selected account if necessary
        if (session.selectedAccountId === accountId) {
            session.selectedAccountId = updatedAccounts[0].accountId;
        }

        // Update the session
        const updatedSession = {
            ...session,
            accounts: updatedAccounts
        };

        sessionManager.createSessionToken(res, updatedSession);
        sendSuccess(res, 200, { message: 'Account removed from session' });
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to remove account');
    }
});

/**
 * GET endpoint to retrieve email address for a specific account
 * This route requires authentication and account access validation
 */
router.get('/:accountId/email', async (req: Request, res: Response) => {
    const { accountId } = req.params;

    try {
        const models = await db.getModels();

        // Find the account in the database
        const account = await models.accounts.OAuthAccount.findOne({ id: accountId });

        if (!account) {
            return sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
        }

        // Only return the email, not the entire account details
        sendSuccess(res, 200, {
            email: account.userDetails.email
        });
    } catch (error) {
        console.error('Error retrieving account email:', error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to retrieve account data');
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

// Logout a specific account
router.get('/:accountId/logout', (req: Request, res: Response) => {
    const { accountId } = req.params;

    try {
        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);

        if (!session) {
            res.redirect('/');
            return;
        }

        // Remove account from session
        const updatedAccounts = session.accounts.filter(acc => acc.accountId !== accountId);

        // If no accounts left, clear the session
        if (updatedAccounts.length === 0) {
            res.clearCookie('session_token', { path: '/' });
            res.redirect('/');
            return;
        }

        // Update selected account if necessary
        if (session.selectedAccountId === accountId) {
            session.selectedAccountId = updatedAccounts[0].accountId;
        }

        // Update the session
        const updatedSession = {
            ...session,
            accounts: updatedAccounts
        };

        sessionManager.createSessionToken(res, updatedSession);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        sendError(res, 400, ApiErrorCode.AUTH_FAILED, 'Failed to logout account');
    }
});

// Switch active account
router.post('/:accountId/switch', (req: Request, res: Response) => {
    const { accountId } = req.params;

    try {
        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);

        if (!session) {
            sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'No active session');
            return;
        }

        // Check if account is in session
        const accountExists = session.accounts.some(acc => acc.accountId === accountId);
        if (!accountExists) {
            sendError(res, 403, ApiErrorCode.AUTH_FAILED, 'Account not found in session');
            return;
        }

        // Update selected account
        session.selectedAccountId = accountId;

        // Update the session
        sessionManager.createSessionToken(res, session);

        sendSuccess(res, 200, {
            message: 'Active account switched successfully',
            selectedAccountId: accountId
        });
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to switch account');
    }
});