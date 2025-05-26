export enum AccountStatus {
    Active = 'active',
    Inactive = 'inactive',
    Unverified = 'unverified',
    Suspended = 'suspended'
}

export enum OAuthProviders {
    Google = 'google',
    Microsoft = 'microsoft',
    Facebook = 'facebook'
}

export enum AccountType {
    Local = 'local',
    OAuth = 'oauth'
}

export interface SecuritySettings {
    password?: string;  // Only for local accounts
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    sessionTimeout: number;
    autoLock: boolean;
    // Local account specific fields
    passwordSalt?: string;
    lastPasswordChange?: Date;
    previousPasswords?: string[];
    failedLoginAttempts?: number;
    lockoutUntil?: Date;
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
    firstName?: string;
    lastName?: string;
    name: string;
    email?: string;
    imageUrl?: string;
    birthdate?: string;
    username?: string;
    emailVerified?: boolean;
}

export interface Account {
    id: string;
    created: string;
    updated: string;
    accountType: AccountType;
    status: AccountStatus;
    userDetails: UserDetails;
    security: SecuritySettings;
    // OAuth specific fields
    provider?: OAuthProviders; // Required when accountType === 'oauth'
}

export type AccountDTO = Account;

// Auth request interfaces
export interface LocalAuthRequest {
    email?: string;
    username?: string;
    password: string;
    rememberMe?: boolean;
}

export interface SignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    password: string;
    confirmPassword: string;
    birthdate?: string;
    agreeToTerms: boolean;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordChangeRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface SetupTwoFactorRequest {
    password: string;
    enableTwoFactor: boolean;
}

export interface VerifyTwoFactorRequest {
    token: string;
}

export interface VerifyEmailRequest {
    token: string;
}