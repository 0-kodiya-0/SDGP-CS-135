export enum AccountStatus {
    Active = 'active',
    Inactive = 'inactive'
}

export enum AccountType {
    Local = 'local',
    OAuth = 'oauth'
}

export enum OAuthProviders {
    Google = 'google',
    Microsoft = 'microsoft',
    Facebook = 'facebook'
}

export interface BaseSecuritySettings {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    autoLock: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OAuthSecuritySettings extends BaseSecuritySettings { }

export interface LocalSecuritySettings {
    password: string;
}

export interface DevicePreferences {
    theme: string;
    language: string;
    notifications: boolean;
}

export interface Device {
    id: string;
    installationDate: string;
    name: string;
    os: string;
    version: string;
    uniqueIdentifier: string;
    preferences: DevicePreferences;
}

export interface UserDetails {
    name: string;
    email?: string;
    imageUrl?: string;
}

export interface TokenDetails {
    accessToken: string;
    refreshToken: string;
}

export interface BaseAccount {
    id: string;
    created: string;
    updated: string;
    device: Device
    accountType: AccountType;
    status: AccountStatus;
    userDetails: UserDetails;
}

export interface LocalAccount extends BaseAccount {
    accountType: AccountType.Local;
    security: LocalSecuritySettings;
}

export interface OAuthAccount extends BaseAccount {
    accountType: AccountType.OAuth;
    provider: OAuthProviders;
    security: OAuthSecuritySettings;
    tokenDetails: TokenDetails;
}

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

export interface OAuthUserData {
    provider: OAuthProviders;
    userDetails: {
        name: string;
        email: string;
        imageUrl?: string;
    };
    tokenDetails: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface ProviderResponse {
    provider: OAuthProviders;
    name: string;
    email: string | undefined;
    imageUrl: string | undefined;
    tokenDetails: TokenDetails
}