import jwt from 'jsonwebtoken';
import { AccountType } from '../../feature/account/Account.types';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

/**
 * Create a signed JWT token for local authentication
 * Accept accountType as parameter instead of querying database
 * @param accountId The account ID to encode in the token
 * @param accountType The account type (passed from caller who already knows it)
 * @param expiresIn Optional time until token expires (in seconds)
 * @returns Promise resolving to the signed token
 */
export async function createLocalJwtToken(
    accountId: string, 
    accountType: AccountType, // Accept as parameter instead of querying
    expiresIn?: number
): Promise<string> {
    // No database query needed - use provided accountType
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
 * Accept accountType as parameter instead of querying database
 * @param accountId The account ID to encode in the token
 * @param accountType The account type (passed from caller who already knows it)
 * @returns Promise resolving to the signed refresh token
 */
export async function createRefreshToken(
    accountId: string,
    accountType: AccountType // Accept as parameter instead of querying
): Promise<string> {
    // No database query needed - use provided accountType
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
 * Verify a JWT token (unchanged - no optimization needed)
 * @param token The token to verify
 * @returns Account ID if valid
 */
export function verifyJwtToken(token: string): { accountId: string; accountType: AccountType } {
    try {
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
 * Verify a refresh token (unchanged - no optimization needed)
 * @param token The refresh token to verify
 * @returns Account ID if valid refresh token
 */
export function verifyRefreshToken(token: string): { accountId: string; accountType: AccountType } {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            sub: string;
            type: AccountType;
            iat: number;
            exp: number;
            isRefreshToken?: boolean;
        };
        
        if (!decoded.isRefreshToken) {
            throw new Error('Not a refresh token');
        }
        
        return {
            accountId: decoded.sub,
            accountType: decoded.type
        };
    } catch {
        throw new Error('Invalid or expired refresh token');
    }
}

/**
 * Get token expiration time (unchanged - no optimization needed)
 * @param token The JWT token
 * @returns Expiration timestamp in milliseconds
 */
export function getTokenExpiration(token: string): number {
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