import { Response } from 'express';
import { google } from 'googleapis';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { GoogleServiceName, ScopeToServiceMap, getGoogleScope } from '../../config';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { isValidGoogleService } from '../../utils';
/**
 * Get token information for the current user
 * This endpoint retrieves detailed information about the token including granted scopes
 */
export const getTokenInfo = async (req: GoogleApiRequest, res: Response) => {
    try {
        // Ensure we have a Google client attached by the middleware
        if (!req.googleAuth) {
            return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Google API client not initialized');
        }

        // Get the token from the OAuth client
        const credentials = req.googleAuth.credentials;
        const accessToken = credentials.access_token;

        if (!accessToken) {
            return sendError(res, 401, ApiErrorCode.TOKEN_INVALID, 'Access token not available');
        }

        // Use the tokeninfo endpoint to get information about the token
        const tokenInfo = await google.oauth2('v2').tokeninfo({
            access_token: accessToken
        });

        // Map scopes to service and level information
        const grantedScopes = tokenInfo.data.scope ? tokenInfo.data.scope.split(' ') : [];
        const scopeDetails = grantedScopes.map(scope => {
            const serviceInfo = ScopeToServiceMap.get(scope);
            return {
                scope,
                service: serviceInfo?.service || 'unknown',
                level: serviceInfo?.level || 'unknown'
            };
        });

        // Determine which services are accessible with the current token
        const serviceAccess = {
            gmail: false,
            calendar: false,
            drive: false,
            people: false,
            meet: false
        };

        // Check each service
        scopeDetails.forEach(detail => {
            if (detail.service in serviceAccess) {
                serviceAccess[detail.service as keyof typeof serviceAccess] = true;
            }
        });

        // Create a response with both full token info and parsed scopes
        const response = {
            tokenInfo: {
                audience: tokenInfo.data.audience,
                expiresIn: tokenInfo.data.expires_in,
                email: tokenInfo.data.email,
                verified: tokenInfo.data.verified_email
            },
            scopes: {
                granted: scopeDetails,
                serviceAccess
            }
        };

        return sendSuccess(res, 200, response);
    } catch (error) {
        return handleGoogleApiError(req, res, error);
    }
};

/**
 * Check if the token has access to a specific service and scope level
 * @param req Request with service and scopeLevel query parameters
 * @param res Response
 * @returns Response indicating whether the token has access to the specified service and scope
 */
export const checkServiceAccess = async (req: GoogleApiRequest, res: Response) => {
    try {
        // Get service and scope level from query parameters
        const { service, scopeLevel } = req.query;

        if (!service || !scopeLevel) {
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Service and scopeLevel parameters are required');
        }

        // Ensure we have a Google client attached by the middleware
        if (!req.googleAuth) {
            return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Google API client not initialized');
        }

        // Get the token from the OAuth client
        const credentials = req.googleAuth.credentials;
        const accessToken = credentials.access_token;

        if (!accessToken) {
            return sendError(res, 401, ApiErrorCode.TOKEN_INVALID, 'Access token not available');
        }

        // Use the tokeninfo endpoint to get information about the token
        const tokenInfo = await google.oauth2('v2').tokeninfo({
            access_token: accessToken
        });

        // Get scopes from token info
        const grantedScopes = tokenInfo.data.scope ? tokenInfo.data.scope.split(' ') : [];

        // Find the required scope for the requested service and level
        // Validate service name is one of the expected Google services
        if (!isValidGoogleService(service.toString())) {
            return sendError(res, 400, ApiErrorCode.INVALID_SERVICE, `Invalid Google service: ${service}`);
        }

        // Cast to GoogleServiceName since we've validated it
        const serviceName = service.toString() as GoogleServiceName;

        // Validate the scope level for this service
        try {
            const requiredScope = getGoogleScope(serviceName, scopeLevel.toString());

            // Check if the token has the required scope
            const hasAccess = grantedScopes.includes(requiredScope);

            return sendSuccess(res, 200, {
                service: serviceName,
                scopeLevel: scopeLevel.toString(),
                hasAccess,
                requiredScope
            });
        } catch (error) {
            // If getGoogleScope throws an error due to invalid scope level
            if (error instanceof Error && error.message.includes('Invalid scope level')) {
                return sendError(res, 400, ApiErrorCode.INVALID_SCOPE, error.message);
            }
            throw error; // Re-throw other errors to be handled by the outer catch
        }
    } catch (error) {
        return handleGoogleApiError(req, res, error);
    }
};  