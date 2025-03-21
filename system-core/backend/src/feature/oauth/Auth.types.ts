import { OAuthAccount, OAuthProviders, TokenDetails } from "../account/Account.types";

export enum AuthType {
    SIGN_UP = 'signup',
    SIGN_IN = 'signin',
    PERMISSION = 'permission'
}

export interface OAuthState {
    state: string;
    provider: OAuthProviders;
    authType: AuthType;
    expiresAt: string;
    redirectUrl?: string; // New field to store redirection URL
}

// Add a new type for permission requests
export interface PermissionState extends OAuthState {
    redirect: string;
    accountId: string;
    service: string;
    scopeLevel: string;
}

export interface SignUpState {
    state: string;
    oAuthResponse: ProviderResponse;
    accountDetails: Partial<OAuthAccount>;
    expiresAt: string;
    redirectUrl?: string; // New field to store redirection URL
}

export type SignUpDetails = 'device' | undefined | null;

export interface SignInState {
    state: string;
    oAuthResponse: ProviderResponse;
    expiresAt: string;
    redirectUrl?: string; // New field to store redirection URL
}

export interface AuthUrls {
    [OAuthProviders.Google]: string;
    [OAuthProviders.Microsoft]: string;
    [OAuthProviders.Facebook]: string;
}

export interface ProviderResponse {
    provider: OAuthProviders;
    name: string;
    email?: string;
    imageUrl?: string;
    tokenDetails: TokenDetails;
    permissionState?: PermissionState | null;
}