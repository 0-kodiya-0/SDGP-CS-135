import { Response } from "express";
import { OAuthProviders } from "../account/Account.types";
import { OAuthState, PermissionState, SignInState, SignUpState } from "./OAuth.types";
import { getOAuthState, getSignInState, getSignUpState, getPermissionState } from "./OAuth.cache";
import { BadRequestError, ApiErrorCode } from "../../types/response.types";
import { StateDetails } from "./OAuth.dto";

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