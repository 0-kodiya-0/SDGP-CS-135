import { NextFunction, Response } from 'express';
import { ApiErrorCode, AuthError, BadRequestError, JsonSuccess, ServerError } from '../../../../types/response.types';
import { GoogleServiceName, getGoogleScope } from '../../config';
import { GoogleApiRequest } from '../../types';
import { isValidGoogleService } from '../../utils';
import { getTokenInfo, getTokenScopes } from '../../services/token';
import { asyncHandler } from '../../../../utils/response';

/**
 * Get token information for the current user
 * This endpoint retrieves detailed information about the token including granted scopes
 */
export const getTokenInfoController = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    // Ensure we have a Google client attached by the middleware
    if (!req.googleAuth) {
        throw new ServerError('Google API client not initialized');
    }

    // Get the token from the OAuth client
    const credentials = req.googleAuth.credentials;
    const accessToken = credentials.access_token;

    if (!accessToken) {
        throw new AuthError('Access token not available', 401, ApiErrorCode.TOKEN_INVALID);
    }

    const tokenInfo = await getTokenInfo(accessToken);
    const scopeInfo = await getTokenScopes(accessToken);

    // Create a response with both token info and parsed scopes
    const response = {
        tokenInfo,
        scopes: scopeInfo
    };

    next(new JsonSuccess(response));
});

/**
 * Check if the token has access to a specific service and scope level
 * @param req Request with service and scopeLevel query parameters
 * @param res Response
 * @returns Response indicating whether the token has access to the specified service and scope
 */
export const checkServiceAccess = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    // Get service and scope levels from query parameters
    const { service, scopeLevel, scopeLevels } = req.query;

    if (!service) {
        throw new BadRequestError('Service parameter is required');
    }

    // Determine scope levels to check
    let scopesToCheck: string[] = [];

    if (scopeLevels) {
        try {
            // Parse the JSON array of scope levels
            scopesToCheck = JSON.parse(scopeLevels.toString());
            if (!Array.isArray(scopesToCheck)) {
                scopesToCheck = [];
            }
        } catch {
            // Try treating it as a comma-separated string if JSON parsing fails
            scopesToCheck = scopeLevels.toString().split(',');
        }
    } else if (scopeLevel) {
        // Fall back to single scope level
        scopesToCheck = [scopeLevel.toString()];
    }

    if (scopesToCheck.length === 0) {
        throw new BadRequestError('At least one scope level is required');
    }

    // Ensure we have a Google client attached by the middleware
    if (!req.googleAuth) {
        throw new ServerError('Google API client not initialized');
    }

    // Get the token from the OAuth client
    const credentials = req.googleAuth.credentials;
    const accessToken = credentials.access_token;

    if (!accessToken) {
        throw new AuthError('Access token not available', 401, ApiErrorCode.TOKEN_INVALID);
    }

    // Validate service name is one of the expected Google services
    if (!isValidGoogleService(service.toString())) {
        throw new BadRequestError(`Invalid Google service: ${service}`, 400, ApiErrorCode.INVALID_SERVICE);
    }

    // Cast to GoogleServiceName since we've validated it
    const serviceName = service.toString() as GoogleServiceName;

    // Use GoogleTokenService to get all granted scopes at once
    const tokenInfo = await getTokenInfo(accessToken);
    const grantedScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];

    // Process all requested scopes at once
    const results: Record<string, { hasAccess: boolean, requiredScope: string }> = {};

    for (const scope of scopesToCheck) {
        try {
            const requiredScope = getGoogleScope(serviceName, scope);
            // Check if the token has this scope
            const hasAccess = grantedScopes.includes(requiredScope);

            results[scope] = {
                hasAccess,
                requiredScope
            };
        } catch (error) {
            // If getGoogleScope throws an error due to invalid scope level
            if (error instanceof Error && error.message.includes('Invalid scope level')) {
                results[scope] = {
                    hasAccess: false,
                    requiredScope: error.message
                };
            } else {
                throw error; // Re-throw other errors
            }
        }
    }

    next(new JsonSuccess({
        service: serviceName,
        scopeResults: results
    }));
});