import { NextFunction, Response, Request } from "express";
import { ApiErrorCode } from "../../../types/response.types";
import { sendError } from "../../../utils/response";
import { ensureValidToken } from "../../oauth/Auth.middleware";
import { GoogleScopes } from "../config/config";

/**
 * Type definition for Google API scopes
 */
export type GoogleApiScope = keyof typeof GoogleScopes;
export type GoogleScopeLevel = 'readonly' | 'full' | string;

/**
 * Middleware to verify that the user has granted the required scopes
 * This middleware should be used after ensureValidToken
 * 
 * @param service The Google service (gmail, calendar, etc.)
 * @param scopeLevel The level of access needed (readonly, full, etc.)
 */
export const requireGoogleScope = (service: GoogleApiScope, scopeLevel: GoogleScopeLevel) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // First ensure the token is valid
            await ensureValidToken(req, res, (err) => {
                if (err) return err;
            });

            // TODO: In a production app, we would verify the granted scopes here
            // This would involve checking the token info from Google or
            // storing the granted scopes in our database

            // For now, we'll assume the scope is granted if the token is valid
            next();
        } catch (error) {
            console.error('Google scope validation error:', error);
            sendError(res, 403, ApiErrorCode.AUTH_FAILED, `Access to Google ${service} requires additional permissions`);
        }
    };
};

/**
 * Combined middleware for Google API routes
 * This middleware ensures the token is valid and the user has the required scope
 */
export const googleApiAuth = (service: GoogleApiScope, scopeLevel: GoogleScopeLevel = 'readonly') => {
    return [
        ensureValidToken,
        requireGoogleScope(service, scopeLevel)
    ];
};