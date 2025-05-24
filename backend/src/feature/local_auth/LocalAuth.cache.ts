import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Cache options with TTL (time to live)
const options = {
    max: 1000, // Maximum number of items in cache
    ttl: 1000 * 60 * 10, // 10 minutes in milliseconds for password reset
    updateAgeOnGet: false, // Don't reset TTL when reading an item
    allowStale: false, // Don't allow expired items to be returned
}

const verificationOptions = {
    max: 1000, // Maximum number of items in cache
    ttl: 1000 * 60 * 60 * 24, // 24 hours in milliseconds for email verification
    updateAgeOnGet: false,
    allowStale: false,
}

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

// Cache for temporary 2FA tokens (5 minutes)
const twoFactorTempOptions = {
    max: 1000,
    ttl: 1000 * 60 * 5, // 5 minutes
    updateAgeOnGet: false,
    allowStale: false,
}

// Create separate caches for each token type
const twoFactorTempCache = new LRUCache<string, TwoFactorTempToken>(twoFactorTempOptions);
const passwordResetCache = new LRUCache<string, PasswordResetToken>(options);
const emailVerificationCache = new LRUCache<string, EmailVerificationToken>(verificationOptions);

// Password Reset Token methods
export const savePasswordResetToken = (accountId: string, email: string): string => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + options.ttl);

    const tokenData: PasswordResetToken = {
        token,
        accountId,
        email,
        expiresAt: expiresAt.toISOString(),
    };

    passwordResetCache.set(token, tokenData);
    return token;
};

export const getPasswordResetToken = (token: string): PasswordResetToken | null => {
    const tokenData = passwordResetCache.get(token);

    if (!tokenData) {
        return null;
    }

    // Check if token has expired
    if (new Date(tokenData.expiresAt) < new Date()) {
        passwordResetCache.delete(token);
        return null;
    }

    return tokenData;
};

export const removePasswordResetToken = (token: string): void => {
    passwordResetCache.delete(token);
};

// Email Verification Token methods
export const saveEmailVerificationToken = (accountId: string, email: string): string => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + verificationOptions.ttl);

    const tokenData: EmailVerificationToken = {
        token,
        accountId,
        email,
        expiresAt: expiresAt.toISOString(),
    };

    emailVerificationCache.set(token, tokenData);
    return token;
};

export const getEmailVerificationToken = (token: string): EmailVerificationToken | null => {
    const tokenData = emailVerificationCache.get(token);

    if (!tokenData) {
        return null;
    }

    // Check if token has expired
    if (new Date(tokenData.expiresAt) < new Date()) {
        emailVerificationCache.delete(token);
        return null;
    }

    return tokenData;
};

export const removeEmailVerificationToken = (token: string): void => {
    emailVerificationCache.delete(token);
};

// Helper method to clean up all tokens for a specific account
export const removeAllTokensForAccount = (accountId: string): void => {
    // Clean password reset tokens
    for (const [token, data] of passwordResetCache.entries()) {
        if (data.accountId === accountId) {
            passwordResetCache.delete(token);
        }
    }

    // Clean verification tokens
    for (const [token, data] of emailVerificationCache.entries()) {
        if (data.accountId === accountId) {
            emailVerificationCache.delete(token);
        }
    }
};

// Temporary 2FA Token methods
export const saveTwoFactorTempToken = (accountId: string, email: string): string => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + twoFactorTempOptions.ttl);

    const tokenData: TwoFactorTempToken = {
        token,
        accountId,
        email,
        expiresAt: expiresAt.toISOString(),
        isUsed: false
    };

    twoFactorTempCache.set(token, tokenData);
    return token;
};

export const getTwoFactorTempToken = (token: string): TwoFactorTempToken | null => {
    const tokenData = twoFactorTempCache.get(token);

    if (!tokenData) {
        return null;
    }

    // Check if token has expired
    if (new Date(tokenData.expiresAt) < new Date()) {
        twoFactorTempCache.delete(token);
        return null;
    }

    // Check if token was already used
    if (tokenData.isUsed) {
        return null;
    }

    return tokenData;
};

export const markTwoFactorTempTokenAsUsed = (token: string): void => {
    const tokenData = twoFactorTempCache.get(token);
    if (tokenData) {
        tokenData.isUsed = true;
        twoFactorTempCache.set(token, tokenData);
    }
};

export const removeTwoFactorTempToken = (token: string): void => {
    twoFactorTempCache.delete(token);
};

// Clear all tokens (useful for testing)
export const clearAllTokens = (): void => {
    passwordResetCache.clear();
    emailVerificationCache.clear();
};

// Get cache stats (useful for monitoring)
export const getCacheStats = () => {
    return {
        passwordReset: {
            size: passwordResetCache.size,
            max: passwordResetCache.max,
        },
        emailVerification: {
            size: emailVerificationCache.size,
            max: emailVerificationCache.max,
        }
    };
};