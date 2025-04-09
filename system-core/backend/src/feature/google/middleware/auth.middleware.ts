import { NextFunction, Response, Request } from "express";
import { ApiErrorCode } from "../../../types/response.types";
import { sendError } from "../../../utils/response";
import { getAbsoluteUrl } from "../../../utils/url";
import { createOAuth2Client, GoogleServiceName, getGoogleScope } from "../config";
import { GoogleTokenService } from "../services/token";
import { GoogleApiRequest } from "../types";
import { getValidAccessToken } from "../../../services/session";
import { SessionPayload } from "../../../types/session.types";

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
    const session = req.session as SessionPayload;

    try {

        // Track activity for analytics
        // updateSessionActivity(session.sessionId)
        //     .catch(err => console.error('Failed to update session activity:', err));

        // Get a valid access token
        const accessToken = await getValidAccessToken(session, accountId);

        // Create OAuth2 client with the valid token
        const oauth2Client = createOAuth2Client(accessToken);

        // Attach the Google Auth client to the request for use in route handlers
        const googleReq = req as GoogleApiRequest;
        googleReq.googleAuth = oauth2Client;

        // Prepare permission info that can be included in error responses if needed
        googleReq.googlePermissionInfo = {
            permissionUrl: `${getAbsoluteUrl(req, '/oauth/permission')}`,
        };

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

            // Use GoogleTokenService to check if the token has the required scope
            const googleTokenService = GoogleTokenService.getInstance();
            const hasScope = await googleTokenService.hasScope(accessToken, requiredScope);

            if (!hasScope) {
                // Send an error response with permission info
                return sendError(
                    res,
                    403,
                    ApiErrorCode.INSUFFICIENT_SCOPE,
                    {
                        requiredPermission: {
                            service,
                            scopeLevel,
                            requiredScope,
                            permissionInfo: req.googlePermissionInfo
                        }
                    }
                );
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

            if (isLikelyPermissionError && req.googlePermissionInfo) {
                // Send an error response with permission info
                return sendError(
                    res,
                    403,
                    ApiErrorCode.INSUFFICIENT_SCOPE,
                    {
                        requiredPermission: {
                            service,
                            scopeLevel,
                            permissionInfo: req.googlePermissionInfo
                        }
                    }
                );
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

    // Get the permission info if available
    const googleReq = req as GoogleApiRequest;
    const permissionInfo = googleReq.googlePermissionInfo;

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

            // If this appears to be a permission error and we have permission info
            if (isPermissionError && permissionInfo) {
                // Send error with permission info instead of redirecting
                return sendError(
                    res,
                    403,
                    ApiErrorCode.INSUFFICIENT_SCOPE,
                    { permissionInfo }
                );
            }
        } else if (statusCode === 404) {
            errorCode = ApiErrorCode.RESOURCE_NOT_FOUND;
        } else if (statusCode === 429) {
            errorCode = ApiErrorCode.RATE_LIMIT_EXCEEDED;
        }

        sendError(res, statusCode, errorCode, message || 'Google API error');
    } else if (error.code === 'ECONNREFUSED') {
        // Network connection error
        sendError(res, 503, ApiErrorCode.SERVICE_UNAVAILABLE, 'Google API service unavailable');
    } else if (error.message && error.message.includes('token expired')) {
        // Token expired error - this should normally be caught and handled by the token refresh mechanism
        sendError(res, 401, ApiErrorCode.TOKEN_EXPIRED, 'Authentication token expired');
    } else {
        // Check if this might be a permission error based on error message
        const errorMsg = error.message || 'Unknown Google API error';
        const isLikelyPermissionError =
            errorMsg.includes('permission') ||
            errorMsg.includes('scope') ||
            errorMsg.includes('authorization') ||
            errorMsg.includes('access');

        if (isLikelyPermissionError && permissionInfo) {
            // Send error with permission info instead of redirecting
            return sendError(
                res,
                403,
                ApiErrorCode.INSUFFICIENT_SCOPE,
                { permissionInfo }
            );
        }

        // Generic error handler
        sendError(res, 500, ApiErrorCode.SERVER_ERROR, errorMsg);
    }
};