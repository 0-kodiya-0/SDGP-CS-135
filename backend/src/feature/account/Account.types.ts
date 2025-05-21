export enum AccountStatus {
    Active = 'active',
    Inactive = 'inactive',
    Unverified = 'unverified',  // New status for accounts pending email verification
    Suspended = 'suspended'     // New status for suspended accounts
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

export interface BaseSecuritySettings {
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;    // For TOTP secret storage
    twoFactorBackupCodes?: string[];  // Backup codes for 2FA recovery
    sessionTimeout: number;
    autoLock: boolean;
}

// Enhanced security settings for local accounts
export interface LocalSecuritySettings extends BaseSecuritySettings {
    password: string;  // Hashed password
    passwordSalt?: string;  // Salt used for password hashing
    passwordResetToken?: string;  // For password reset flow
    passwordResetExpires?: Date;  // Expiration of password reset token
    lastPasswordChange?: Date;    // Track when password was last changed
    previousPasswords?: string[]; // Store previous password hashes to prevent reuse
    failedLoginAttempts?: number; // Track failed login attempts
    lockoutUntil?: Date;          // Account lockout time if too many failed attempts
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OAuthSecuritySettings extends BaseSecuritySettings { }

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
    firstName?: string;  // Split name into first and last name for local accounts
    lastName?: string;
    name: string;        // Full name (firstName + lastName or from OAuth)
    email?: string;
    imageUrl?: string;
    birthdate?: string;  // For local accounts
    username?: string;   // For local accounts
    emailVerified?: boolean; // Track if email has been verified
}

export interface TokenDetails {
    accessToken: string;
    refreshToken: string;
    expireAt: number,
    tokenCreatedAt: number
}

// OAuth scope info
export interface OAuthScopeInfo {
    scopes: string[];
    lastUpdated: string;
}

export interface BaseAccount {
    id: string;
    created: string;
    updated: string;
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
    oauthScopes?: OAuthScopeInfo;
}

export type Account = LocalAccount | OAuthAccount;
export type OAuthAccountDTO = OAuthAccount;
export type LocalAccountDTO = LocalAccount;

export type Rename<T, K extends keyof T, NewKey extends string> =
    Omit<T, K> & { [P in NewKey]: T[K] };

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