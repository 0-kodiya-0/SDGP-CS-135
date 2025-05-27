import { LRUCache } from 'lru-cache';
import { AuthType, OAuthState, PermissionState, ProviderResponse, SignInState, SignUpState } from './OAuth.types';
import { OAuthProviders } from '../account/Account.types';

// Cache options with TTL (time to live) of 10 minutes (600,000 ms)
const options = {
    max: 500, // Maximum number of items in cache
    ttl: 1000 * 60 * 10, // 10 minutes in milliseconds
    updateAgeOnGet: false, // Don't reset TTL when reading an item
    allowStale: false, // Don't allow expired items to be returned
}

// Create separate caches for each state type
const oAuthStateCache = new LRUCache<string, OAuthState>(options);
const signInStateCache = new LRUCache<string, SignInState>(options);
const signUpStateCache = new LRUCache<string, SignUpState>(options);
const permissionStateCache = new LRUCache<string, PermissionState>(options);

// OAuthState methods
export const saveOAuthState = (
    state: string,
    provider: OAuthProviders,
    authType: AuthType,
    redirectUrl?: string
): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: OAuthState = {
        state,
        provider,
        authType,
        redirectUrl,
        expiresAt: expiresAt.toISOString(),
    };

    oAuthStateCache.set(state, stateData);
};

export const getOAuthState = (state: string, provider: OAuthProviders): OAuthState | null => {
    const stateData = oAuthStateCache.get(state);

    if (!stateData || stateData.provider !== provider) {
        return null;
    }

    // Check if state is expired
    if (new Date(stateData.expiresAt) < new Date()) {
        oAuthStateCache.delete(state);
        return null;
    }

    return stateData;
};

export const removeOAuthState = (state: string): void => {
    oAuthStateCache.delete(state);
};

// SignInState methods
export const saveSignInState = (
    state: string,
    providerResponse: ProviderResponse,
    redirectUrl?: string
): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: SignInState = {
        state,
        oAuthResponse: providerResponse,
        redirectUrl,
        expiresAt: expiresAt.toISOString(),
    };

    signInStateCache.set(state, stateData);
};

export const getSignInState = (state: string): SignInState | null => {
    const stateData = signInStateCache.get(state);

    if (!stateData) {
        return null;
    }

    // Check if state is expired
    if (new Date(stateData.expiresAt) < new Date()) {
        signInStateCache.delete(state);
        return null;
    }

    return stateData;
};

export const removeSignInState = (state: string): void => {
    signInStateCache.delete(state);
};

// SignUpState methods
export const saveSignUpState = (
    state: string,
    providerResponse: ProviderResponse,
    redirectUrl?: string
): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: SignUpState = {
        state,
        oAuthResponse: providerResponse,
        redirectUrl,
        expiresAt: expiresAt.toISOString(),
    };

    signUpStateCache.set(state, stateData);
};

export const getSignUpState = (state: string): SignUpState | null => {
    const stateData = signUpStateCache.get(state);

    if (!stateData) {
        return null;
    }

    // Check if state is expired
    if (new Date(stateData.expiresAt) < new Date()) {
        signUpStateCache.delete(state);
        return null;
    }

    return stateData;
};

export const removeSignUpState = (state: string): void => {
    signUpStateCache.delete(state);
};

// Methods for permission state
export const savePermissionState = (
    state: string,
    provider: OAuthProviders,
    accountId: string,
    service: string,
    scopeLevel: string,
    redirectUrl: string
): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: PermissionState = {
        state,
        provider,
        authType: AuthType.PERMISSION,
        accountId,
        service,
        scopeLevel,
        redirectUrl,
        expiresAt: expiresAt.toISOString(),
    };

    permissionStateCache.set(state, stateData);
};

export const getPermissionState = (state: string, provider: OAuthProviders): PermissionState | null => {
    const stateData = permissionStateCache.get(state);

    if (!stateData || stateData.provider !== provider) {
        return null;
    }

    // Check if state is expired
    if (new Date(stateData.expiresAt) < new Date()) {
        permissionStateCache.delete(state);
        return null;
    }

    return stateData;
};

export const removePermissionState = (state: string): void => {
    permissionStateCache.delete(state);
};