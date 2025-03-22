// types.data.ts
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
    sessionTimeout: number;
    autoLock: boolean;
}

export interface OAuthSecuritySettings extends BaseSecuritySettings {
    twoFactorEnabled: boolean;
}

export interface LocalSecuritySettings extends BaseSecuritySettings {
    password: string;
}

export enum DeviceType {
    Web = 'web',
    Desktop = 'desktop',
    Mobile = 'mobile'
}

export enum OsType {
    Windows = 'windows',
    MacOS = 'macos',
    Android = 'android',
    iOS = 'ios',
    Linux = 'linux',
    Other = 'other'
}

export interface DeviceOsInformation {
    type: OsType,
    version: string
}

export interface Device {
    id: string;
    os: OsType;
    deviceType: DeviceType;
}

export interface UserDetails {
    name: string;
    email: string;
    imageUrl?: string;
}

export interface TokenDetails {
    accessToken: string;
    refreshToken: string;
    expiresAt?: string;
    scope?: string;
    tokenCreatedAt?: string;
}

export interface AccountDetails {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
    provider?: string;
    status: string;
    created: string;
    updated: string;
    security?: {
        twoFactorEnabled?: boolean;
        sessionTimeout?: number;
        autoLock?: boolean;
    };
    tokenDetails?: TokenDetails; // Optional token details for the account
}

export interface Account {
    accountId: string;
    accountType: string;
    provider: string;
    name?: string;
    email?: string;
    imageUrl?: string;
    tokenInfo?: {  // Add token info to the account interface
        accessToken: string;
        expiresAt: number;
        scope?: string;
    };
}

export interface Session {
    sessionId: string;
    accounts: Account[];
    selectedAccountId?: string; // Add selectedAccountId to track active account
    createdAt?: number;
    expiresAt?: number;
    iat?: number;
}