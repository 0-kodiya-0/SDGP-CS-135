import jwt from 'jsonwebtoken';
import { AccountType } from '../account/Account.types';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET as string;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

/**
 * JWT payload interface for local auth tokens
 */
interface LocalAuthTokenPayload {
    sub: string; // accountId
    type: AccountType.Local;
    iat: number;
    exp?: number;
    isRefreshToken?: boolean;
}

/**
 * Create a signed JWT token for local authentication
 * @param accountId The account ID to encode in the token
 * @param expiresIn Optional time until token expires (in seconds)
 * @returns Promise resolving to the signed token
 */
export async function createLocalJwtToken(
    accountId: string, 
    expiresIn?: number
): Promise<string> {
    const payload: LocalAuthTokenPayload = {
        sub: accountId,
        type: AccountType.Local,
        iat: Math.floor(Date.now() / 1000)
    };
    
    // Sign token
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: expiresIn ? `${expiresIn}s` : ACCESS_TOKEN_EXPIRY
    });
}

/**
 * Create a refresh token for local authentication
 * @param accountId The account ID to encode in the token
 * @returns Promise resolving to the signed refresh token
 */
export async function createLocalRefreshToken(accountId: string): Promise<string> {
    const payload: LocalAuthTokenPayload = {
        sub: accountId,
        type: AccountType.Local,
        isRefreshToken: true,
        iat: Math.floor(Date.now() / 1000)
    };
    
    // Sign token with longer expiration
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY
    });
}

/**
 * Verify a local auth JWT token
 * @param token The token to verify
 * @returns Account ID and type if valid
 */
export function verifyLocalJwtToken(token: string): { accountId: string; accountType: AccountType.Local } {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as LocalAuthTokenPayload;
        
        // Ensure it's a local auth token
        if (decoded.type !== AccountType.Local) {
            throw new Error('Not a local authentication token');
        }
        
        return {
            accountId: decoded.sub,
            accountType: AccountType.Local
        };
    } catch {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Verify a local auth refresh token
 * @param token The refresh token to verify
 * @returns Account ID and type if valid refresh token
 */
export function verifyLocalRefreshToken(token: string): { accountId: string; accountType: AccountType.Local } {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as LocalAuthTokenPayload;
        
        // Ensure it's a local auth refresh token
        if (decoded.type !== AccountType.Local || !decoded.isRefreshToken) {
            throw new Error('Not a local authentication refresh token');
        }
        
        return {
            accountId: decoded.sub,
            accountType: AccountType.Local
        };
    } catch {
        throw new Error('Invalid or expired refresh token');
    }
}

/**
 * Get token expiration time
 * @param token The JWT token
 * @returns Expiration timestamp in milliseconds
 */
export function getLocalTokenExpiration(token: string): number {
    try {
        const decoded = jwt.decode(token) as { exp?: number };
        
        if (!decoded || !decoded.exp) {
            throw new Error('Invalid token');
        }
        
        return decoded.exp * 1000;
    } catch {
        throw new Error('Failed to get token expiration');
    }
}

/**
 * Extract account ID from token without verification (for logging/debugging)
 * @param token The JWT token
 * @returns Account ID if token is decodable
 */
export function extractAccountIdFromToken(token: string): string | null {
    try {
        const decoded = jwt.decode(token) as LocalAuthTokenPayload;
        return decoded?.sub || null;
    } catch {
        return null;
    }
}

/**
 * Check if token is expired without throwing
 * @param token The JWT token
 * @returns True if expired, false if valid
 */
export function isLocalTokenExpired(token: string): boolean {
    try {
        const decoded = jwt.decode(token) as { exp?: number };
        
        if (!decoded || !decoded.exp) {
            return true;
        }
        
        return Date.now() >= decoded.exp * 1000;
    } catch {
        return true;
    }
}