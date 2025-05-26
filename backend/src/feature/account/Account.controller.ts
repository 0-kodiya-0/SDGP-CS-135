import { NextFunction, Request, Response } from 'express';
import { JsonSuccess, RedirectSuccess } from '../../types/response.types';
import { AccountDocument } from './Account.model';
import { asyncHandler } from '../../utils/response';
import * as AccountService from './Account.service';

/**
 * Search for an account by email
 */
export const searchAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const email = req.query.email as string;
    
    const result = await AccountService.searchAccountByEmail(email);
    
    next(new JsonSuccess({ accountId: result?.id }, 200));
});

/**
 * Logout all accounts (clear entire session)
 */
export const logoutAll = (req: Request, res: Response, next: NextFunction) => {
    const { accountIds } = req.query;
    
    const accountIdArray = AccountService.validateAccountIds(accountIds);
    AccountService.clearAllAccountSessions(res, accountIdArray);
    
    next(new RedirectSuccess(null, "/"));
};

/**
 * Logout single account
 */
export const logout = (req: Request, res: Response, next: NextFunction) => {
    const { accountId } = req.query;
    
    const validatedAccountId = AccountService.validateSingleAccountId(accountId);
    AccountService.clearSingleAccountSession(res, validatedAccountId);
    
    next(new RedirectSuccess(null, "/", undefined));
};

/**
 * Get account details
 */
export const getAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const account = req.account as AccountDocument;
    const safeAccount = AccountService.convertToSafeAccount(account);

    next(new JsonSuccess(safeAccount, 200));
});

/**
 * Update account
 */
export const updateAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const account = req.account as AccountDocument;
    const updates = req.body;

    const updatedAccount = await AccountService.updateAccount(account, updates);
    
    next(new JsonSuccess(updatedAccount, 200));
});

/**
 * Get email address for a specific account
 */
export const getAccountEmail = (req: Request, res: Response, next: NextFunction) => {
    const account = req.account as AccountDocument;
    const email = AccountService.getAccountEmail(account);

    next(new JsonSuccess({ email }, 200));
};

/**
 * Update account security settings
 */
export const updateAccountSecurity = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const securityUpdates = req.body;
    const account = req.account as AccountDocument;

    const updatedAccount = await AccountService.updateAccountSecurity(account, securityUpdates);
    
    next(new JsonSuccess(updatedAccount, 200));
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId as string;
    const account = req.account as AccountDocument;
    const refreshToken = req.refreshToken as string;
    const { redirectUrl } = req.query;

    const finalRedirectUrl = AccountService.validateRedirectUrl(redirectUrl);
    
    await AccountService.refreshAccountToken(res, accountId, account, refreshToken);
    
    next(new RedirectSuccess(null, finalRedirectUrl, undefined, undefined, undefined, false));
});

/**
 * Revoke refresh token
 */
export const revokeToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId as string;
    const account = req.account as AccountDocument;
    const accessToken = req.accessToken as string;
    const refreshToken = req.refreshToken as string;

    const result = await AccountService.revokeAccountTokens(res, accountId, account, accessToken, refreshToken);
    
    next(new JsonSuccess(result, undefined, "Token revoked"));
});