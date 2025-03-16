import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuthAccount } from '../feature/account/Account.types';
import { SignInState } from '../feature/oauth/Auth.types';
import { ApiErrorCode } from '../types/response.types';
import { sendError } from './response';
import { SessionPayload } from '../types/session.types';

// Environment variables (add these to your .env file)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // 1 day
const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE || '86400000'); // 1 day in milliseconds
/**
 * Creates a JWT session token and sets it as an HTTP-only cookie
 */
export const createSessionToken = (res: Response, account: OAuthAccount): string => {
    // Create the payload with minimal necessary information
    const payload: SessionPayload = {
        userId: account.id,
        accountType: account.accountType,
        provider: account.provider,
        email: account.userDetails.email
    };

    // Sign the JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });

    // Set the token as an HTTP-only cookie
    res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'strict'
    });

    return token;
};

/**
 * Middleware to verify JWT token from cookies
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.session_token;

    if (!token) {
        return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Authentication required');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as SessionPayload;

        // Add user session data to request object
        req.session = {
            userId: decoded.userId,
            accountType: decoded.accountType,
            provider: decoded.provider,
            email: decoded.email
        };

        next();
    } catch {
        // Token is invalid or expired
        res.clearCookie('session_token');
        return sendError(res, 403, ApiErrorCode.AUTH_FAILED, 'Invalid or expired session');
    }
};

/**
 * Creates session after successful sign-in
 */
export const createSignInSession = (res: Response, stateDetails: SignInState, user: OAuthAccount) => {
    // Create the session token
    createSessionToken(res, user);

    // Return success with minimal information (since sensitive data is now in the token)
    return {
        authenticated: true,
        userId: user.id,
        name: user.userDetails.name
    };
};

/**
 * Creates session after successful sign-up
 */
export const createSignUpSession = (res: Response, account: OAuthAccount) => {
    // Create the session token
    createSessionToken(res, account);

    // Return success with minimal information
    return {
        authenticated: true,
        userId: account.id,
        name: account.userDetails.name
    };
};

/**
 * Logout function to clear the session cookie
 */
export const clearSession = (res: Response) => {
    res.clearCookie('session_token');
};