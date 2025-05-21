import jwt from 'jsonwebtoken';
import { getAccountTypeById } from '../../feature/account/Account.utils';
import { AccountType } from '../../feature/account/Account.types';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h';       // 1 hour
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';    // 30 days

/**
 * Create a signed JWT token for local authentication
 * @param accountId The account ID to encode in the token
 * @param expiresIn Optional time until token expires (in seconds)
 * @returns Promise resolving to the signed token
 */
export async function createLocalJwtToken(accountId: string, expiresIn?: number): Promise<string> {
    // Get account type to include in the token
    const accountType = await getAccountTypeById(accountId);
    
    if (!accountType) {
        throw new Error('Account not found');
    }
    
    // Create JWT payload
    const payload = {
        sub: accountId,
        type: accountType,
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
export async function createRefreshToken(accountId: string): Promise<string> {
    // Get account type to include in the token
    const accountType = await getAccountTypeById(accountId);
    
    if (!accountType) {
        throw new Error('Account not found');
    }
    
    // Create JWT payload with refresh token indicator
    const payload = {
        sub: accountId,
        type: accountType,
        isRefreshToken: true,
        iat: Math.floor(Date.now() / 1000)
    };
    
    // Sign token with longer expiration
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY
    });
}

/**
 * Verify a JWT token
 * @param token The token to verify
 * @returns Account ID if valid
 */
export function verifyJwtToken(token: string): { accountId: string; accountType: AccountType } {
    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as {
            sub: string;
            type: AccountType;
            iat: number;
            exp: number;
            isRefreshToken?: boolean;
        };
        
        return {
            accountId: decoded.sub,
            accountType: decoded.type
        };
    } catch {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Verify a refresh token
 * @param token The refresh token to verify
 * @returns Account ID if valid refresh token
 */
export function verifyRefreshToken(token: string): { accountId: string; accountType: AccountType } {
    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as {
            sub: string;
            type: AccountType;
            iat: number;
            exp: number;
            isRefreshToken?: boolean;
        };
        
        // Check if it's a refresh token
        if (!decoded.isRefreshToken) {
            throw new Error('Not a refresh token');
        }
        
        return {
            accountId: decoded.sub,
            accountType: decoded.type
        };
    } catch  {
        throw new Error('Invalid or expired refresh token');
    }
}

/**
 * Get token expiration time
 * @param token The JWT token
 * @returns Expiration timestamp in milliseconds
 */
export function getTokenExpiration(token: string): number {
    try {
        // Decode token (without verification)
        const decoded = jwt.decode(token) as { exp?: number };
        
        if (!decoded || !decoded.exp) {
            throw new Error('Invalid token');
        }
        
        // Convert expiration time to milliseconds
        return decoded.exp * 1000;
    } catch  {
        throw new Error('Failed to get token expiration');
    }
}