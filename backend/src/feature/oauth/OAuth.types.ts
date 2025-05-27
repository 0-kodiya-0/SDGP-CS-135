import { OAuthProviders } from "../account/Account.types";

export interface TokenDetails {
    accessToken: string;
    refreshToken: string;
}

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
    redirectUrl?: string;
}

// Add a new type for permission requests
export interface PermissionState extends OAuthState {
    redirectUrl: string;
    accountId: string;
    service: string;
    scopeLevel: string;
}

export interface SignUpState {
    state: string;
    oAuthResponse: ProviderResponse;
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