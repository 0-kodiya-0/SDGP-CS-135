import { Response } from "express";
import { OAuthProviders } from "../account/Account.types";
import { OAuthState, PermissionState, SignInState, SignUpState } from "./Auth.types";
import { getOAuthState, getSignInState, getSignUpState, getPermissionState } from "./Auth.cache";
import db from "../../config/db";
import { google } from "googleapis";
import { BadRequestError, ApiErrorCode } from "../../types/response.types";
import { StateDetails } from "./Auth.dto";

type ValidateState = (
    state: string | undefined,
    validate: (state: string) => Promise<StateDetails>,
    res: Response
) => Promise<StateDetails | undefined>;

// validate state parameter
export const validateState: ValidateState = async (state, validate) => {
    if (!state || typeof state !== 'string') {
        throw new BadRequestError('Missing state parameter', 400, ApiErrorCode.INVALID_STATE);
    }

    const stateDetails = await validate(state);

    if (!stateDetails) {
        throw new BadRequestError('Invalid or expired state parameter', 400, ApiErrorCode.INVALID_STATE);
    }

    return stateDetails;
};

type ValidateProvider = (provider: string | undefined, res: Response) => boolean

//  to validate provider parameter
export const validateProvider: ValidateProvider = (provider) => {
    if (!provider || typeof provider !== 'string') {
        throw new BadRequestError('Missing or invalid provider parameter', 400, ApiErrorCode.INVALID_PROVIDER);
    }

    if (!Object.values(OAuthProviders).includes(provider as OAuthProviders)) {
        throw new BadRequestError('Invalid provider', 400, ApiErrorCode.INVALID_PROVIDER);
    }

    return true;
};

/**
 * Validates an OAuth state for a specific provider
 */
export const validateOAuthState = async (state: string, provider: OAuthProviders): Promise<OAuthState | null> => {
    if (!state) return null;

    const oauthState = getOAuthState(state, provider);

    if (!oauthState) {
        return null;
    }

    // Check if state has expired
    if (new Date(oauthState.expiresAt) < new Date()) {
        return null;
    }

    return oauthState;
};

/**
 * Validates a permission state
 */
export const validatePermissionState = async (state: string, provider: OAuthProviders): Promise<PermissionState | null> => {
    if (!state) return null;

    const permissionState = getPermissionState(state, provider);

    if (!permissionState) {
        return null;
    }

    // Check if state has expired
    if (new Date(permissionState.expiresAt) < new Date()) {
        return null;
    }

    return permissionState;
};

/**
 * Validates a sign-in state
 */
export const validateSignInState = async (state: string): Promise<SignInState | null> => {
    if (!state) return null;

    const signInState = getSignInState(state);

    if (!signInState) {
        return null;
    }

    // Check if state has expired
    if (new Date(signInState.expiresAt) < new Date()) {
        return null;
    }

    return signInState;
};

/**
 * Validates a sign-up state
 */
export const validateSignUpState = async (state: string): Promise<SignUpState | null> => {
    if (!state) return null;

    const signUpState = getSignUpState(state);

    if (!signUpState) {
        return null;
    }

    // Check if state has expired
    if (new Date(signUpState.expiresAt) < new Date()) {
        return null;
    }

    return signUpState;
};

/**
 * Verifies that the token belongs to the correct user account
 * 
 * @param accessToken The access token to verify
 * @param accountId The account ID that should own this token
 * @returns Object indicating if the token is valid and reason if not
 */
export async function verifyTokenOwnership(
    accessToken: string,
    accountId: string
): Promise<{ isValid: boolean; reason?: string }> {
    try {
        // Get the models
        const models = await db.getModels();

        // Get the account that should own this token
        const account = await models.accounts.OAuthAccount.findOne({ _id: accountId });

        if (!account) {
            return { isValid: false, reason: 'Account not found' };
        }

        // Get the email from the account
        const expectedEmail = account.userDetails.email;

        if (!expectedEmail) {
            return { isValid: false, reason: 'Account missing email' };
        }

        // Get user information from the token
        const googleAuth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        googleAuth.setCredentials({ access_token: accessToken });

        // Get the user info using the oauth2 API
        const oauth2 = google.oauth2({
            auth: googleAuth,
            version: 'v2'
        });

        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            return { isValid: false, reason: 'Could not get email from token' };
        }

        // Compare emails
        if (userInfo.data.email.toLowerCase() !== expectedEmail.toLowerCase()) {
            return {
                isValid: false,
                reason: `Token email (${userInfo.data.email}) does not match account email (${expectedEmail})`
            };
        }

        return { isValid: true };
    } catch (error) {
        console.error('Error verifying token ownership:', error);
        return { isValid: false, reason: 'Error verifying token ownership' };
    }
}