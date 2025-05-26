// Types for local auth requests
export interface LocalSignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    password: string;
    confirmPassword: string;
    birthdate?: string;
    agreeToTerms: boolean;
}

export interface LocalLoginRequest {
    email?: string;
    username?: string;
    password: string;
    rememberMe?: boolean;
}

export interface PasswordResetRequest {
    email: string;
}

export interface ResetPasswordRequest {
    password: string;
    confirmPassword: string;
}

export interface PasswordChangeRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface TwoFactorVerifyRequest {
    token: string;
    tempToken: string;
}

export interface TwoFactorSetupRequest {
    password: string;
    enableTwoFactor: boolean;
}

export interface TwoFactorVerifySetupRequest {
    token: string;
}

export interface GenerateBackupCodesRequest {
    password: string;
}

// API Response types
export interface LocalAuthResponse {
    success: boolean;
    data?: {
        accountId?: string;
        name?: string;
        message?: string;
        requiresTwoFactor?: boolean;
        tempToken?: string;
        qrCode?: string;
        secret?: string;
        backupCodes?: string[];
    };
    error?: {
        code: string;
        message: string;
    };
}