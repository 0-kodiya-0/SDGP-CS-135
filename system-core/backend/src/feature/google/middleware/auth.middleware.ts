import { Response, NextFunction } from "express";
import { ApiErrorCode } from "../../../types/response.types";
import { sendError } from "../../../utils/response";
import { createGoogleClient } from "../config/config";
import { GoogleApiRequest } from "../types";

/**
 * Middleware to create a Google OAuth2 client and attach it to the request
 * This middleware should be used after ensureValidToken
 */
export const attachGoogleClient = async (
    req: GoogleApiRequest,
    res: Response,
    next: NextFunction
) => {
    const { accountId } = req.params;

    if (!accountId) {
        return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Account ID is required');
    }

    try {
        // Create Google OAuth2 client with valid tokens
        const googleAuth = await createGoogleClient(accountId);

        // Attach the Google Auth client to the request for use in route handlers
        req.googleAuth = googleAuth;

        next();
    } catch (error) {
        console.error('Failed to create Google client:', error);
        sendError(res, 500, ApiErrorCode.AUTH_FAILED, 'Failed to initialize Google API client');
    }
};

/**
 * Helper function to format Google API errors
 */
export const handleGoogleApiError = (res: Response, error: any) => {
    console.error('Google API error:', error);

    // Handle different types of Google API errors
    if (error.response && error.response.data) {
        // Google API error with response data
        const { code, message, status } = error.response.data.error || {};
        const statusCode = code || error.response.status || 500;
        let errorCode = ApiErrorCode.DATABASE_ERROR;

        // Map HTTP status codes to our API error codes
        if (statusCode === 401 || statusCode === 403) {
            errorCode = ApiErrorCode.AUTH_FAILED;
        } else if (statusCode === 404) {
            errorCode = ApiErrorCode.USER_NOT_FOUND;
        }

        sendError(res, statusCode, errorCode, message || 'Google API error');
    } else if (error.code === 'ECONNREFUSED') {
        // Network connection error
        sendError(res, 503, ApiErrorCode.DATABASE_ERROR, 'Google API service unavailable');
    } else {
        // Generic error handler
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, error.message || 'Unknown Google API error');
    }
};