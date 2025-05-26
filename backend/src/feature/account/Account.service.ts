import { Response } from 'express';
import { ApiErrorCode, BadRequestError, ServerError } from '../../types/response.types';
import { toOAuthAccount } from './Account.utils';
import { 
    clearAllSessions, 
    clearSession, 
    handleTokenRefresh, 
    revokeAuthTokens 
} from '../../services/session';
import { OAuthAccountDocument } from './Account.model';
import { LocalAccount, OAuthAccount, OAuthProviders } from './Account.types';
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
 * Clear all account sessions (delegates to session manager)
 */
export function clearAllAccountSessions(res: Response, accountIds: string[]): void {
    clearAllSessions(res, accountIds);
}

/**
 * Clear single account session (delegates to session manager)
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
 * Refresh account token (delegates to session manager)
 */
export async function refreshAccountToken(
    res: Response, 
    accountId: string, 
    account: OAuthAccountDocument, 
    refreshToken: string
): Promise<void> {
    if (account.provider === OAuthProviders.Google) {
        await handleTokenRefresh(accountId, refreshToken, account.accountType, res);
    } else {
        throw new ServerError("Invalid account provider type found");
    }
}

/**
 * Revoke account tokens (delegates to session manager)
 */
export async function revokeAccountTokens(
    res: Response,
    accountId: string,
    account: OAuthAccountDocument,
    accessToken: string,
    refreshToken: string
) {
    if (account.provider === OAuthProviders.Google) {
        return await revokeAuthTokens(
            accountId, 
            account.accountType, 
            accessToken, 
            refreshToken, 
            res
        );
    } else {
        throw new ServerError("Invalid account provider type found");
    }
}


/**
 * Find user by email (checks both OAuth and Local accounts)
 * Used across multiple features for authentication and account lookup
 */
export const findUserByEmail = async (email: string): Promise<OAuthAccount | LocalAccount | null> => {
  const models = await db.getModels();

  // Try to find in OAuth accounts first
  const oauthDoc = await models.accounts.OAuthAccount.findOne({
    'userDetails.email': email
  });

  if (oauthDoc) {
    return { id: oauthDoc._id.toHexString(), ...oauthDoc.toObject() };
  }
  
  // Try to find in Local accounts
  const localDoc = await models.accounts.LocalAccount.findOne({
    'userDetails.email': email
  });
  
  if (localDoc) {
    return { id: localDoc._id.toHexString(), ...localDoc.toObject() };
  }

  return null;
};

/**
 * Find user by ID (checks both OAuth and Local accounts)
 * Used across multiple features for account lookup
 */
export const findUserById = async (id: string): Promise<OAuthAccount | LocalAccount | null> => {
  const models = await db.getModels();

  // Try to find in OAuth accounts first
  try {
    const oauthDoc = await models.accounts.OAuthAccount.findById(id);
    
    if (oauthDoc) {
      return { id: oauthDoc._id.toHexString(), ...oauthDoc.toObject() };
    }
  } catch {
    // ID might not be in OAuth accounts, try Local accounts
  }
  
  // Try to find in Local accounts
  try {
    const localDoc = await models.accounts.LocalAccount.findById(id);
    
    if (localDoc) {
      return { id: localDoc._id.toHexString(), ...localDoc.toObject() };
    }
  } catch {
    // ID might not be valid or not in Local accounts either
  }

  return null;
};