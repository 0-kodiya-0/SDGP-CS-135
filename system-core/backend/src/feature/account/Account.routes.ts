import express, { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';
import { toOAuthAccount } from './Account.utils';
import { createSessionToken, validateAccountAccess } from '../../services/session';
import { OAuthAccountDocument } from './Account.model';
import { SessionPayload } from '../../types/session.types';
import db from '../../config/db';

export const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    if (!req.session) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    res.json({ accounts: req.session.accounts });
});

router.get('/search', async (req: Request, res: Response) => {
    const email = req.query.email as string;

    if (!email) {
        sendError(res, 400, ApiErrorCode.MISSING_EMAIL, 'Email is required');
        return;
    }

    try {
        const models = await db.getModels();

        const account = await models.accounts.OAuthAccount.findOne({ 'userDetails.email': email });

        if (!account) {
            sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found');
            return;
        }

        const accountDto = toOAuthAccount(account);

        sendSuccess(res, 200, { accountId : accountDto?.id });
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Database operation failed');
    }
});

// Logout all accounts (clear entire session)
router.get('/logout/all', (req: Request, res: Response) => {
    res.clearCookie('session_token', { path: '/' });
    res.redirect('/');
});

router.get('/logout/:accountId', (req: Request, res: Response) => {
    const { accountId } = req.params;
    const session = req.session;

    if (!session) {
        res.redirect('/');
        return;
    }

    // Remove account from session
    const updatedAccounts = session.accounts.filter(id => id !== accountId);

    // If no accounts left, clear the session
    if (updatedAccounts.length === 0) {
        res.clearCookie('session_token', { path: '/' });
        res.redirect('/');
        return;
    }

    // Update the session
    const updatedSession = {
        ...session,
        accounts: updatedAccounts
    };

    createSessionToken(res, updatedSession);
    res.redirect('/');
});

// Middleware to validate account access
router.use('/:accountId', validateAccountAccess);

// Get account details
router.get('/:accountId', async (req: Request, res: Response) => {
    const account = req.oauthAccount as OAuthAccountDocument;

    const safeAccount = toOAuthAccount(account);

    sendSuccess(res, 200, safeAccount);
});

// Update OAuth account
router.patch('/:accountId', async (req: Request, res: Response) => {
    const account = req.oauthAccount as OAuthAccountDocument;;
    const updates = req.body;

    try {
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
    const session = req.session as SessionPayload;

    // Remove account from session
    const updatedAccounts = session.accounts.filter(id => id !== accountId);

    // If no accounts left, clear the session
    if (updatedAccounts.length === 0) {
        res.clearCookie('session_token', { path: '/' });
        sendSuccess(res, 200, { message: 'Account removed and session cleared' });
        return;
    }

    // Update the session
    const updatedSession = {
        ...session,
        accounts: updatedAccounts
    };

    createSessionToken(res, updatedSession);
    sendSuccess(res, 200, { message: 'Account removed from session' });
});

/**
 * GET endpoint to retrieve email address for a specific account
 * This route requires authentication and account access validation
 */
router.get('/:accountId/email', async (req: Request, res: Response) => {
    const account = req.oauthAccount as OAuthAccountDocument;

    sendSuccess(res, 200, {
        email: account.userDetails.email
    });
});

// Update OAuth account security settings
router.patch('/:accountId/security', async (req: Request, res: Response) => {
    const securityUpdates = req.body;
    const account = req.oauthAccount as OAuthAccountDocument;

    try {
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

// // Switch active account
// router.post('/:accountId/switch', (req: Request, res: Response) => {
//     const { accountId } = req.params;

//     try {
//
//         const session = extractSession(req);

//         if (!session) {
//             sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'No active session');
//             return;
//         }

//         // Check if account is in session
//         const accountExists = session.accounts.some(acc => acc.accountId === accountId);
//         if (!accountExists) {
//             sendError(res, 403, ApiErrorCode.AUTH_FAILED, 'Account not found in session');
//             return;
//         }

//         // Update selected account
//         session.selectedAccountId = accountId;

//         // Update the session
//         createSessionToken(res, session);

//         sendSuccess(res, 200, {
//             message: 'Active account switched successfully',
//             selectedAccountId: accountId
//         });
//     } catch (error) {
//         console.error(error);
//         sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to switch account');
//     }
// });