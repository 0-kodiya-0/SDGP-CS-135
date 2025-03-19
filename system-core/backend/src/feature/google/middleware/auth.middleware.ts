import { NextFunction, Response, Request } from "express";
import { ApiErrorCode } from "../../../types/response.types";
import { sendError } from "../../../utils/response";
import { OAuthProviders } from "../../account/Account.types";
import { validateAndRefreshToken } from "../../../utils/session";
import {
    GoogleServiceName,
    getGoogleScope,
    createOAuth2Client,
    hasRequiredScope
} from "../config/config";
import { getAbsoluteUrl } from "../../../utils/url";
import { GoogleApiRequest } from "../types";

/**
 * Core middleware for Google API authentication
 * This middleware:
 * 1. Validates the session token
 * 2. Validates and refreshes the OAuth token if needed
 * 3. Creates a Google OAuth2 client
 * 4. Attaches the client to the request for downstream middleware and route handlers
 */
export const authenticateGoogleApi = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const accountId = req.params.accountId;

    if (!accountId) {
        return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Account ID is required');
    }

    try {
        // Store the original request URL to redirect back after permission grant
        const originalUrl = req.originalUrl;

        // Validate and refresh token if needed - only done once per request
        const tokenDetails = await validateAndRefreshToken(accountId, OAuthProviders.Google);

        // Create OAuth2 client with the validated tokens
        const oauth2Client = createOAuth2Client(
            tokenDetails.accessToken,
            tokenDetails.refreshToken
        );

        // Attach the Google Auth client to the request for use in route handlers
        const googleReq = req as GoogleApiRequest;
        googleReq.googleAuth = oauth2Client;

        // Prepare a permission redirect URL that can be used if needed later
        googleReq.googlePermissionRedirectUrl = `${getAbsoluteUrl(req, '/oauth/permission')}?redirect=${encodeURIComponent(originalUrl)}&accountId=${accountId}`;

        next();
    } catch (error) {
        console.error('Google API authentication error:', error);
        sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication failed');
    }
};

/**
 * Middleware to verify required scope
 * This middleware builds on authenticateGoogleApi and checks if the required scope is granted
 * 
 * @param service The Google service (gmail, calendar, etc.)
 * @param scopeLevel The level of access needed (readonly, full, etc.)
 */
export const requireGoogleScope = (service: GoogleServiceName, scopeLevel: string) => {
    return async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
        // Ensure we have a Google client attached by authenticateGoogleApi
        if (!req.googleAuth) {
            return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Google API client not initialized');
        }

        const accountId = req.params.accountId;

        try {
            // Check if the user is returning from a permission request that failed
            const permissionCheckFailed = req.query.permission_check_failed === 'true';

            if (permissionCheckFailed) {
                return sendError(
                    res,
                    403,
                    ApiErrorCode.PERMISSION_DENIED,
                    `Additional permissions required for ${service} ${scopeLevel} access`
                );
            }

            // Get the required scope
            const requiredScope = getGoogleScope(service, scopeLevel);

            // Get the token from the OAuth client
            const credentials = req.googleAuth.credentials;
            const accessToken = credentials.access_token;

            if (!accessToken) {
                throw new Error('Access token not available');
            }

            // Check if the token has the required scope
            const hasScope = await hasRequiredScope(accessToken, requiredScope);

            if (!hasScope) {
                // Construct a redirect URL to request additional permissions
                const permissionPath = `/oauth/permission/${service}/${scopeLevel}`;
                const redirectParam = encodeURIComponent(getAbsoluteUrl(req, req.originalUrl));
                const permissionUrl = `${getAbsoluteUrl(req, permissionPath)}?redirect=${redirectParam}&accountId=${accountId}`;

                console.log(`Redirecting to request additional permissions: ${permissionUrl}`);
                return res.redirect(permissionUrl);
            }

            // Token has the required scope, continue
            next();
        } catch (error) {
            console.error('Google scope validation error:', error);

            // Check if this appears to be a permission issue
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const isLikelyPermissionError =
                errorMessage.includes('permission') ||
                errorMessage.includes('scope') ||
                errorMessage.includes('access');

            if (isLikelyPermissionError && req.googlePermissionRedirectUrl) {
                return res.redirect(req.googlePermissionRedirectUrl);
            }

            sendError(
                res,
                403,
                ApiErrorCode.INSUFFICIENT_SCOPE,
                `Access to Google ${service} requires additional permissions`
            );
        }
    };
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

/**
 * Helper function to handle Google API errors consistently
 */
export const handleGoogleApiError = (req: Request, res: Response, error: any) => {
    console.error('Google API error:', error);

    // Get the permission redirect URL if available
    const googleReq = req as GoogleApiRequest;
    const redirectUrl = googleReq.googlePermissionRedirectUrl;

    // Handle different types of Google API errors
    if (error.response && error.response.data) {
        // Google API error with response data
        const { code, message } = error.response.data.error || {};
        const statusCode = code || error.response.status || 500;
        let errorCode = ApiErrorCode.DATABASE_ERROR;

        // Map HTTP status codes to our API error codes
        if (statusCode === 401 || statusCode === 403) {
            errorCode = ApiErrorCode.AUTH_FAILED;

            // Check if this is a permission error
            const isPermissionError =
                message?.includes('permission') ||
                message?.includes('scope') ||
                message?.includes('authorization') ||
                message?.includes('access');

            // If this appears to be a permission error and we have a redirect URL
            if (isPermissionError && redirectUrl) {
                console.log(`Redirecting to request additional permissions: ${redirectUrl}`);
                return res.redirect(redirectUrl);
            }
        } else if (statusCode === 404) {
            errorCode = ApiErrorCode.RESOURCE_NOT_FOUND;
        }

        sendError(res, statusCode, errorCode, message || 'Google API error');
    } else if (error.code === 'ECONNREFUSED') {
        // Network connection error
        sendError(res, 503, ApiErrorCode.SERVICE_UNAVAILABLE, 'Google API service unavailable');
    } else {
        // Check if this might be a permission error based on error message
        const errorMsg = error.message || 'Unknown Google API error';
        const isLikelyPermissionError =
            errorMsg.includes('permission') ||
            errorMsg.includes('scope') ||
            errorMsg.includes('authorization') ||
            errorMsg.includes('access');

        if (isLikelyPermissionError && redirectUrl) {
            console.log(`Redirecting to request additional permissions: ${redirectUrl}`);
            return res.redirect(redirectUrl);
        }

        // Generic error handler
        sendError(res, 500, ApiErrorCode.SERVER_ERROR, errorMsg);
    }
};