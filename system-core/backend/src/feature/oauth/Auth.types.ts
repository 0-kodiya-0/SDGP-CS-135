import { OAuthAccount, OAuthProviders, TokenDetails } from "../account/Account.types";

export enum AuthType {
    SIGN_UP = 'signup',
    SIGN_IN = 'signin'
}

export interface OAuthState {
    state: string;
    provider: OAuthProviders;
    authType: AuthType;
    expiresAt: string;
}

export interface SignUpState {
    state: string;
    oAuthResponse: ProviderResponse;
    accountDetails: Partial<OAuthAccount>;
    expiresAt: string;
}

export type SignUpDetails = 'device' | undefined | null;

export interface SignInState {
    state: string;
    oAuthResponse: ProviderResponse;
    expiresAt: string;
}

export interface AuthUrls {
    [OAuthProviders.Google]: string;
    [OAuthProviders.Microsoft]: string;
    [OAuthProviders.Facebook]: string;
}

export interface ProviderResponse {
    provider: OAuthProviders;
    name: string;
    email: string | undefined;
    imageUrl: string | undefined;
    tokenDetails: TokenDetails
}