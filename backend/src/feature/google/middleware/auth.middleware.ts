import { NextFunction, Response, Request } from "express";
import { ApiErrorCode, AuthError, ServerError } from "../../../types/response.types";
import { getAbsoluteUrl } from "../../../utils/url";
import { GoogleServiceName, getGoogleScope } from "../config";
import { hasScope } from "../services/token";
import { GoogleApiRequest } from "../types";
import { asyncHandler } from "../../../utils/response";
import { google } from "googleapis";
import { getGoogleClientId, getGoogleClientSecret } from "../../../config/env.config";

/**
 * Core middleware for Google API authentication
 * This middleware:
 * 1. Validates the session token
 * 2. Validates and refreshes the OAuth token if needed
 * 3. Creates a Google OAuth2 client
 * 4. Attaches the client to the request for downstream middleware and route handlers
 */
export const authenticateGoogleApi = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const accessToken = req.oauthAccessToken as string;

    // Create OAuth2 client with the valid token
    const oauth2Client = new google.auth.OAuth2(
        getGoogleClientId(),
        getGoogleClientSecret() 
    );

    oauth2Client.setCredentials({
        access_token: accessToken
    });

    // Attach the Google Auth client to the request for use in route handlers
    const googleReq = req as GoogleApiRequest;
    googleReq.googleAuth = oauth2Client;

    // Prepare permission info that can be included in error responses if needed
    googleReq.googlePermissionInfo = {
        permissionUrl: `${getAbsoluteUrl(req, '/oauth/permission')}`,
    };

    next();
});

/**
 * Middleware to verify required scope
 * This middleware builds on authenticateGoogleApi and checks if the required scope is granted
 * 
 * @param service The Google service (gmail, calendar, etc.)
 * @param scopeLevel The level of access needed (readonly, full, etc.)
 */
export const requireGoogleScope = (service: GoogleServiceName, scopeLevel: string) => {
    return asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
        // Ensure we have a Google client attached by authenticateGoogleApi
        if (!req.googleAuth) {
            throw new ServerError('Google API client not initialized', 500, ApiErrorCode.SERVER_ERROR);
        }

        // Get the required scope
        const requiredScope = getGoogleScope(service, scopeLevel);

        // Get the token from the OAuth client
        const credentials = req.googleAuth.credentials;
        const accessToken = credentials.access_token as string;

        const result = await hasScope(accessToken, requiredScope);

        if (!result) {
            // Send an error response with permission info
            throw new AuthError('Invalid scope', 403, ApiErrorCode.INSUFFICIENT_SCOPE, {
                requiredPermission: {
                    service,
                    scopeLevel,
                    requiredScope,
                    permissionInfo: req.googlePermissionInfo
                }
            });
        }

        // Token has the required scope, continue
        next();
    });
};

/**
 * Combined middleware factory for Google API routes
 * Creates a middleware array with authentication and scope checking
 */
export const googleApiAuth = (service: GoogleServiceName, scopeLevel: string = 'readonly') => {
    return [
        authenticateGoogleApi,
        requireGoogleScope(service, scopeLevel)
    ];
};