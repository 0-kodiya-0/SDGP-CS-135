import { AccountType } from "../account";

// Password reset token interface
export interface PasswordResetToken {
    token: string;
    accountId: string;
    email: string;
    expiresAt: string;
}

// Email verification token interface
export interface EmailVerificationToken {
    token: string;
    accountId: string;
    email: string;
    expiresAt: string;
}

// Temporary 2FA token interface
export interface TwoFactorTempToken {
    token: string;
    accountId: string;
    email: string;
    expiresAt: string;
    isUsed: boolean; // Prevent token reuse
}

/**
 * JWT payload interface for local auth tokens
 */
export interface LocalAuthTokenPayload {
    sub: string; // accountId
    type: AccountType.Local;
    iat: number;
    exp?: number;
    isRefreshToken?: boolean;
}