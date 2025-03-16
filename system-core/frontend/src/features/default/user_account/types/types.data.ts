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
}

export interface BaseAccount {
    id: number;
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

export type ActiveAccount = LocalAccount | OAuthAccount