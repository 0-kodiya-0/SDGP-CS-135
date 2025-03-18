import { LRUCache } from 'lru-cache';
import { AuthType, OAuthState, PermissionState, ProviderResponse, SignInState, SignUpState } from './Auth.types';
import { OAuthAccount, OAuthProviders } from '../account/Account.types';

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
const permissionStateCache = new LRUCache<string, PermissionState>(options); // New cache for permission states

// OAuthState methods
export const saveOAuthState = (state: string, provider: OAuthProviders, authType: AuthType): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: OAuthState = {
        state,
        provider,
        authType,
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
export const saveSignInState = (state: string, providerResponse: ProviderResponse): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: SignInState = {
        state,
        oAuthResponse: providerResponse,
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
export const saveSignUpState = (state: string, providerResponse: ProviderResponse): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: SignUpState = {
        state,
        oAuthResponse: providerResponse,
        accountDetails: {},
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

// Add method to update sign up state with account details
export const updateSignUpStateDetails = (state: string, accountDetails: Partial<OAuthAccount>): boolean => {
    const stateData = signUpStateCache.get(state);

    if (!stateData) {
        return false;
    }

    stateData.accountDetails = {
        ...stateData.accountDetails,
        ...accountDetails
    };

    signUpStateCache.set(state, stateData);
    return true;
};

// New methods for permission state
export const savePermissionState = (
    state: string, 
    provider: OAuthProviders, 
    redirectUrl: string, 
    accountId: string,
    service: string,
    scopeLevel: string
): void => {
    const expiresAt = new Date(Date.now() + options.ttl);

    const stateData: PermissionState = {
        state,
        provider,
        authType: AuthType.PERMISSION,
        redirect: redirectUrl,
        accountId,
        service,
        scopeLevel,
        expiresAt: expiresAt.toISOString(),
    };

    permissionStateCache.set(state, stateData);
};

export const getPermissionState = (state: string): PermissionState | null => {
    const stateData = permissionStateCache.get(state);

    if (!stateData) {
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