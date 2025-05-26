import db from '../../config/db';
import { Account, AccountType, AccountStatus, OAuthProviders } from '../account/Account.types';
import { ApiErrorCode, BadRequestError, RedirectError } from '../../types/response.types';
import { AuthType, OAuthState, ProviderResponse, SignInState } from './Auth.types';
import {
    generateSignInState,
    generateSignupState
} from './Auth.utils';
import { validateAccount } from '../account/Account.validation';
import { getTokenInfo } from '../google/services/token';
import { findUserByEmail, findUserById } from '../account';

/**
 * Process sign up with OAuth provider
 */
export async function processSignup(
    stateDetails: SignInState,
    provider: OAuthProviders
) {
    if (!stateDetails || !stateDetails.oAuthResponse.email) {
        throw new BadRequestError('Invalid or missing state details', 400, ApiErrorCode.INVALID_STATE);
    }

    const models = await db.getModels();

    const newAccount: Omit<Account, "id"> = {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        accountType: AccountType.OAuth,
        status: AccountStatus.Active,
        provider,
        userDetails: {
            name: stateDetails.oAuthResponse.name,
            email: stateDetails.oAuthResponse.email,
            imageUrl: stateDetails.oAuthResponse.imageUrl,
            emailVerified: true // OAuth emails are pre-verified
        },
        security: {
            twoFactorEnabled: false,
            sessionTimeout: 3600,
            autoLock: false
        }
    };

    const success = validateAccount(newAccount);
    if (!success) {
        throw new BadRequestError('Missing required account data', 400, ApiErrorCode.MISSING_DATA);
    }

    const newAccountDoc = await models.accounts.Account.create(newAccount);
    const accountId = newAccountDoc.id || newAccountDoc._id.toHexString();

    // Update Google permissions if provider is Google
    if (provider === OAuthProviders.Google) {
        const accessToken = stateDetails.oAuthResponse.tokenDetails.accessToken;
        await updateGooglePermissions(accountId, accessToken);
    }

    const accessToken = stateDetails.oAuthResponse.tokenDetails.accessToken;
    const refreshToken = stateDetails.oAuthResponse.tokenDetails.refreshToken;
    const accessTokenInfo = await getTokenInfo(accessToken);

    return {
        accountId,
        name: newAccount.userDetails.name,
        accessToken,
        refreshToken,
        accessTokenInfo
    };
}

/**
 * Process sign in with OAuth provider
 */
export async function processSignIn(stateDetails: SignInState, redirectUrl: string) {
    if (!stateDetails || !stateDetails.oAuthResponse.email) {
        throw new BadRequestError('Invalid or missing state details', 400, ApiErrorCode.INVALID_STATE);
    }

    const user = await findUserByEmail(stateDetails.oAuthResponse.email);

    if (!user) {
        throw new RedirectError(ApiErrorCode.USER_NOT_FOUND, redirectUrl, 'User details not found');
    }

    // Ensure this is an OAuth account
    if (user.accountType !== AccountType.OAuth) {
        throw new RedirectError(ApiErrorCode.AUTH_FAILED, redirectUrl, 'Account exists but is not an OAuth account');
    }

    const accessToken = stateDetails.oAuthResponse.tokenDetails.accessToken;
    const refreshToken = stateDetails.oAuthResponse.tokenDetails.refreshToken;

    // Update Google permissions if provider is Google
    if (user.provider === OAuthProviders.Google) {
        await updateGooglePermissions(user.id, accessToken);
    }

    const accessTokenInfo = await getTokenInfo(accessToken);

    // Check for additional scopes from GooglePermissions
    const needsAdditionalScopes = await checkForAdditionalScopes(user.id, accessToken);

    return {
        userId: user.id,
        userName: user.userDetails.name,
        accessToken,
        refreshToken,
        accessTokenInfo,
        needsAdditionalScopes: needsAdditionalScopes.needsAdditionalScopes,
        missingScopes: needsAdditionalScopes.missingScopes
    };
}

/**
 * Process callback from OAuth provider
 */
export async function processSignInSignupCallback(
    userData: ProviderResponse,
    stateDetails: OAuthState,
    redirectUrl: string
) {
    const userEmail = userData.email;
    if (!userEmail) {
        throw new BadRequestError('Missing email parameter', 400, ApiErrorCode.MISSING_EMAIL);
    }

    const user = await findUserByEmail(userEmail);
    let state: string;

    if (stateDetails.authType === AuthType.SIGN_UP) {
        if (user) {
            throw new RedirectError(ApiErrorCode.USER_EXISTS, redirectUrl);
        }
        state = await generateSignupState(userData, redirectUrl);
    } else {
        if (!user) {
            throw new RedirectError(ApiErrorCode.USER_NOT_FOUND, redirectUrl);
        }
        state = await generateSignInState(userData, redirectUrl);
    }

    return {
        state,
        authType: stateDetails.authType
    };
}

/**
 * Check if user exists
 */
export async function checkUserExists(id: string): Promise<boolean> {
    const user = await findUserById(id);
    return user !== null;
}

/**
 * Get user account by ID
 */
export async function getUserAccount(id: string) {
    return await findUserById(id);
}

/**
 * Update Google permissions for an account
 */
async function updateGooglePermissions(accountId: string, accessToken: string): Promise<void> {
    try {
        // Get token info for scopes
        const tokenInfo = await getTokenInfo(accessToken);
        const grantedScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
        
        if (grantedScopes.length === 0) {
            return;
        }

        // Get database models
        const models = await db.getModels();
        
        // Check if permissions already exist
        const existingPermissions = await models.google.GooglePermissions.findOne({ accountId });
        
        if (existingPermissions) {
            // Check if there are new scopes to add
            const existingScopeSet = new Set(existingPermissions.scopes);
            const newScopes = grantedScopes.filter(scope => !existingScopeSet.has(scope));
            
            if (newScopes.length > 0) {
                // Update with new scopes
                (existingPermissions as any).addScopes(newScopes);
                await existingPermissions.save();
            }
        } else {
            // Create new permissions record
            await models.google.GooglePermissions.create({
                accountId,
                scopes: grantedScopes,
                lastUpdated: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error updating Google permissions:', error);
        // Don't throw error here to avoid breaking auth flow
    }
}

/**
 * Check for additional scopes that user previously granted but aren't in current token
 */
async function checkForAdditionalScopes(accountId: string, accessToken: string): Promise<{
    needsAdditionalScopes: boolean,
    missingScopes: string[]
}> {
    try {
        // Get scopes from the current token
        const tokenInfo = await getTokenInfo(accessToken);
        const currentScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
        
        // Get previously granted scopes from GooglePermissions
        const storedScopes = await getAccountScopes(accountId);
        
        // Only care about missing scopes that aren't the basic profile and email
        const filteredStoredScopes = storedScopes.filter(scope => 
            !scope.includes('auth/userinfo.email') && 
            !scope.includes('auth/userinfo.profile')
        );
        
        // Find scopes that are in GooglePermissions but not in the current token
        const missingScopes = filteredStoredScopes.filter(scope => !currentScopes.includes(scope));
        
        return {
            needsAdditionalScopes: missingScopes.length > 0,
            missingScopes
        };
    } catch (error) {
        console.error('Error checking for additional scopes:', error);
        return {
            needsAdditionalScopes: false,
            missingScopes: []
        };
    }
}

/**
 * Get all scopes for an account from GooglePermissions
 */
export async function getAccountScopes(accountId: string): Promise<string[]> {
    try {
        const models = await db.getModels();
        const permissions = await models.google.GooglePermissions.findOne({ accountId });
        
        return permissions ? permissions.scopes : [];
    } catch (error) {
        console.error('Error getting account scopes:', error);
        return [];
    }
}

/**
 * Update tokens and scopes for a user (now only updates permissions, no token storage)
 */
export async function updateTokensAndScopes(
    accountId: string,
    accessToken: string
) {
    // Only update permissions, don't store tokens
    await updateGooglePermissions(accountId, accessToken);
}