import { Response } from 'express';
import { ApiErrorCode, BadRequestError, ServerError } from '../../types/response.types';
import { toOAuthAccount } from './Account.utils';
import { clearAllSessions, clearSession, setAccessTokenCookie } from '../../services/session';
import { OAuthAccountDocument } from './Account.model';
import { refreshAccessToken, revokeTokens as revokeGoogleTokens } from '../google/services/token';
import { OAuthProviders } from './Account.types';
import db from '../../config/db';
import { ValidationUtils } from '../../utils/validation';

/**
 * Search for an account by email
 */
export async function searchAccountByEmail(email: string) {
    // Use centralized email validation
    ValidationUtils.validateEmail(email);

    const models = await db.getModels();
    const account = await models.accounts.OAuthAccount.findOne({ 'userDetails.email': email });

    if (!account) {
        throw new BadRequestError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }

    return toOAuthAccount(account);
}

/**
 * Validate account IDs array
 */
export function validateAccountIds(accountIds: any): string[] {
    if (!Array.isArray(accountIds)) {
        throw new BadRequestError("Invalid format or undefined account ids");
    }
    return accountIds as string[];
}

/**
 * Validate single account ID
 */
export function validateSingleAccountId(accountId: any): string {
    if (!accountId) {
        throw new BadRequestError("Missing accountId");
    }
    return accountId as string;
}

/**
 * Clear all account sessions
 */
export function clearAllAccountSessions(res: Response, accountIds: string[]): void {
    clearAllSessions(res, accountIds);
}

/**
 * Clear single account session
 */
export function clearSingleAccountSession(res: Response, accountId: string): void {
    clearSession(res, accountId);
}

/**
 * Convert account document to safe account object
 */
export function convertToSafeAccount(account: OAuthAccountDocument) {
    return toOAuthAccount(account);
}

/**
 * Update OAuth account
 */
export async function updateOAuthAccount(account: OAuthAccountDocument, updates: any) {
    // Apply updates to the account
    Object.assign(account, {
        ...updates,
        updated: new Date().toISOString()
    });

    await account.save();

    // Convert to safe account type
    return toOAuthAccount(account);
}

/**
 * Get account email
 */
export function getAccountEmail(account: OAuthAccountDocument): string {
    return account.userDetails.email;
}

/**
 * Update account security settings
 */
export async function updateAccountSecurity(account: OAuthAccountDocument, securityUpdates: any) {
    // Update security settings
    account.security = {
        ...account.security,
        ...securityUpdates
    };
    account.updated = new Date().toISOString();

    await account.save();

    // Convert to safe account type
    return toOAuthAccount(account);
}

/**
 * Validate redirect URL
 */
export function validateRedirectUrl(redirectUrl: any): string {
    if (!redirectUrl) {
        throw new BadRequestError("Missing redirectUrl query parameter");
    }
    return redirectUrl as string;
}

/**
 * Refresh account token
 */
export async function refreshAccountToken(
    res: Response, 
    accountId: string, 
    account: OAuthAccountDocument, 
    refreshToken: string
): Promise<void> {
    if (account.provider === OAuthProviders.Google) {
        const newTokenInfo = await refreshAccessToken(refreshToken);

        // Update the token in the database
        setAccessTokenCookie(
            res, 
            accountId, 
            newTokenInfo.access_token as string, 
            newTokenInfo.expiry_date as number - Date.now()
        );
    } else {
        throw new ServerError("Invalid account provider type found");
    }
}

/**
 * Revoke account tokens
 */
export async function revokeAccountTokens(
    res: Response,
    accountId: string,
    account: OAuthAccountDocument,
    accessToken: string,
    refreshToken: string
) {
    let result;

    if (account.provider === OAuthProviders.Google) {
        result = await revokeGoogleTokens(accessToken, refreshToken);

        // Update the token in the database
        clearSession(res, accountId);
    } else {
        throw new ServerError("Invalid account provider type found");
    }

    return result;
}