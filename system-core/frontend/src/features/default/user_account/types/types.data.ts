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

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}