import db from '../../config/db';
import { OAuthAccount, AccountType, AccountStatus, OAuthProviders } from '../account/Account.types';
import { ApiErrorCode, AuthError, BadRequestError, RedirectError } from '../../types/response.types';
import { AuthType, OAuthState, ProviderResponse, SignInState } from './Auth.types';
import {
    generateSignInState,
    generateSignupState
} from './Auth.utils';
import { validateOAuthAccount } from '../account/Account.validation';
import {
    checkForAdditionalScopes,
    getAccountScopes as fetchAccountScopes,
    getTokenInfo,
    updateAccountScopes
} from '../google/services/token';
import { findUserByEmail, findUserById } from '../account';

/**
 * Process sign up with OAuth provider
 */
export async function processSignup(
    stateDetails: SignInState,
    provider: OAuthProviders,
    redirectUrl: string
) {
    if (!stateDetails || !stateDetails.oAuthResponse.email) {
        throw new BadRequestError('Invalid or missing state details', 400, ApiErrorCode.INVALID_STATE);
    }

    const models = await db.getModels();

    const newAccount: Omit<OAuthAccount, "id"> = {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        accountType: AccountType.OAuth,
        status: AccountStatus.Active,
        provider,
        userDetails: {
            name: stateDetails.oAuthResponse.name,
            email: stateDetails.oAuthResponse.email,
            imageUrl: stateDetails.oAuthResponse.imageUrl
        },
        security: {
            twoFactorEnabled: false,
            sessionTimeout: 3600,
            autoLock: false
        }
    };

    const success = validateOAuthAccount(newAccount);
    if (!success) {
        throw new BadRequestError('Missing required account data', 400, ApiErrorCode.MISSING_DATA);
    }

    const newAccountDoc = await models.accounts.OAuthAccount.create(newAccount);
    const accountId = newAccountDoc.id || newAccountDoc._id.toHexString();

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

    const accessToken = stateDetails.oAuthResponse.tokenDetails.accessToken;
    const refreshToken = stateDetails.oAuthResponse.tokenDetails.refreshToken;
    const accessTokenInfo = await getTokenInfo(accessToken);

    // Check if user has additional scopes we should request
    const shouldRequestAdditionalScopes = await checkForAdditionalScopes(
        user.id,
        accessToken
    );

    // Update account scopes if no additional scopes needed
    if (!shouldRequestAdditionalScopes.needsAdditionalScopes) {
        await updateAccountScopes(user.id, accessToken);
    }

    return {
        userId: user.id,
        userName: user.userDetails.name,
        accessToken,
        refreshToken,
        accessTokenInfo,
        needsAdditionalScopes: shouldRequestAdditionalScopes.needsAdditionalScopes,
        missingScopes: shouldRequestAdditionalScopes.missingScopes
    };
}

/**
 * Process callback from OAuth provider
 */
export async function processCallback(
    userData: ProviderResponse,
    stateDetails: OAuthState,
    redirectUrl: string
) {
    const userEmail = userData.email;
    if (!userEmail) {
        throw new AuthError('Missing email parameter', 400, ApiErrorCode.MISSING_EMAIL);
    }

    const models = await db.getModels();
    const oauthExists = await models.accounts.OAuthAccount.exists({ 'userDetails.email': userEmail });
    const localExists = await models.accounts.LocalAccount.exists({ 'userDetails.email': userEmail });
    const exists = oauthExists || localExists;
    let state: string;

    if (stateDetails.authType === AuthType.SIGN_UP) {
        if (exists) {
            throw new RedirectError(ApiErrorCode.USER_EXISTS, redirectUrl);
        }
        state = await generateSignupState(userData, redirectUrl);
    } else {
        if (!exists) {
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
    const models = await db.getModels();

    // Check in OAuth accounts
    try {
        const oauthExists = await models.accounts.OAuthAccount.exists({ _id: id });
        if (oauthExists) return true;
    } catch {
        // ID might not be valid for OAuth accounts
    }

    // Check in Local accounts
    try {
        const localExists = await models.accounts.LocalAccount.exists({ _id: id });
        return localExists ? true : false;
    } catch {
        // ID might not be valid
        return false;
    }
}

/**
 * Get user account by ID
 */
export async function getUserAccount(id: string) {
    return await findUserById(id);
}

/**
 * Update tokens and scopes for a user
 */
export async function updateTokensAndScopes(
    accountId: string,
    accessToken: string,
    refreshToken: string
) {
    // Update the account's scopes in the database
    await updateAccountScopes(accountId, accessToken);
}

/**
 * Get all scopes for an account
 */
export async function getAccountScopes(accountId: string): Promise<string[]> {
    return await fetchAccountScopes(accountId);
}