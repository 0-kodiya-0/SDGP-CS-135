import { OAuthProviders } from "../account/Account.types";
import { AuthType, ProviderResponse } from "./Auth.types";
import crypto from "crypto";
import { saveOAuthState, saveSignInState, saveSignUpState, removeOAuthState, removeSignInState, removeSignUpState, savePermissionState, removePermissionState, } from "./Auth.cache";

export const generateOAuthState = async (
    provider: OAuthProviders,
    authType: AuthType,
    redirectUrl?: string
): Promise<string> => {
    const state = crypto.randomBytes(32).toString('hex');

    // Save state in cache with redirect URL
    saveOAuthState(state, provider, authType, redirectUrl);

    return state;
};

export const generateSignupState = async (
    providerResponse: ProviderResponse,
    redirectUrl?: string
): Promise<string> => {
    const state = crypto.randomBytes(32).toString('hex');

    // Save state in cache with redirect URL
    saveSignUpState(state, providerResponse, redirectUrl);

    return state;
};

export const generateSignInState = async (
    providerResponse: ProviderResponse,
    redirectUrl?: string
): Promise<string> => {
    const state = crypto.randomBytes(32).toString('hex');

    // Save state in cache with redirect URL
    saveSignInState(state, providerResponse, redirectUrl);

    return state;
};

export const generatePermissionState = async (
    provider: OAuthProviders,
    redirect: string,
    accountId: string,
    service: string,
    scopeLevel: string
): Promise<string> => {
    const state = crypto.randomBytes(32).toString('hex');

    // Save state in cache
    savePermissionState(
        state,
        provider,
        accountId,
        service,
        scopeLevel,
        redirect
    );

    return state;
};

export const clearOAuthState = async (state: string): Promise<void> => {
    removeOAuthState(state);
};

export const clearSignUpState = async (state: string): Promise<void> => {
    removeSignUpState(state);
};

export const clearSignInState = async (state: string): Promise<void> => {
    removeSignInState(state);
};

export const clearPermissionState = async (state: string): Promise<void> => {
    removePermissionState(state);
};