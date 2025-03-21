/* eslint-disable @typescript-eslint/no-explicit-any */
import { OAuthProviders } from '../account/Account.types';
import { AuthType, OAuthState, ProviderResponse, SignInState, SignUpState } from './Auth.types';

/**
 * Safely converts a Date object to an ISO string
 */
export const toISOString = (date: Date | string): string => {
    if (date instanceof Date) {
        return date.toISOString();
    }
    return date;
};

/**
 * Safely converts a provider string to OAuthProviders enum
 */
export const toProvider = (provider: string): OAuthProviders => {
    return provider as OAuthProviders;
};

/**
 * Safely converts a auth type string to AuthType enum
 */
export const toAuthType = (authType: string): AuthType => {
    return authType as AuthType;
};

/**
 * Converts a MongoDB document to an OAuthState
 */
export const toOAuthState = (doc: any): OAuthState | null => {
    if (!doc) return null;

    return {
        state: doc.state,
        provider: toProvider(doc.provider),
        authType: toAuthType(doc.authType),
        expiresAt: toISOString(doc.expiresAt)
    };
};

/**
 * Converts a MongoDB document to a SignInState
 */
export const toSignInState = (doc: any): SignInState | null => {
    if (!doc) return null;

    return {
        state: doc.state,
        oAuthResponse: {
            ...doc.oAuthResponse,
            provider: toProvider(doc.oAuthResponse.provider)
        },
        expiresAt: toISOString(doc.expiresAt)
    };
};

/**
 * Converts a MongoDB document to a SignUpState
 */
export const toSignUpState = (doc: any): SignUpState | null => {
    if (!doc) return null;

    return {
        state: doc.state,
        oAuthResponse: {
            ...doc.oAuthResponse,
            provider: toProvider(doc.oAuthResponse.provider)
        },
        accountDetails: doc.accountDetails || {},
        expiresAt: toISOString(doc.expiresAt)
    };
};

/**
 * Converts a document to a ProviderResponse
 */
export const toProviderResponse = (doc: any): ProviderResponse | null => {
    if (!doc) return null;

    return {
        provider: toProvider(doc.provider),
        name: doc.name,
        email: doc.email,
        imageUrl: doc.imageUrl,
        tokenDetails: doc.tokenDetails
    };
};