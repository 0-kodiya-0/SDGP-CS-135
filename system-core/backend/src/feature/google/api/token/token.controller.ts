import { Response } from 'express';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { GoogleServiceName, getGoogleScope } from '../../config';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { isValidGoogleService } from '../../utils';
import db from '../../../../config/db';
import { GoogleTokenService } from '../../services/token';
import { SessionManager } from '../../../../services/session';

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

        // Use GoogleTokenService to get detailed token info
        const googleTokenService = GoogleTokenService.getInstance();
        const tokenInfo = await googleTokenService.getTokenInfo(accessToken);
        const scopeInfo = await googleTokenService.getTokenScopes(accessToken);

        // Create a response with both token info and parsed scopes
        const response = {
            tokenInfo: {
                expiresAt: new Date(tokenInfo.expiresAt).toISOString(),
                expiresIn: Math.floor((tokenInfo.expiresAt - Date.now()) / 1000),
                email: tokenInfo.email,
                verified: tokenInfo.verified
            },
            scopes: scopeInfo
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

        // Validate service name is one of the expected Google services
        if (!isValidGoogleService(service.toString())) {
            return sendError(res, 400, ApiErrorCode.INVALID_SERVICE, `Invalid Google service: ${service}`);
        }

        // Cast to GoogleServiceName since we've validated it
        const serviceName = service.toString() as GoogleServiceName;

        // Validate the scope level for this service
        try {
            const requiredScope = getGoogleScope(serviceName, scopeLevel.toString());

            // Use GoogleTokenService to check if the token has the required scope
            const googleTokenService = GoogleTokenService.getInstance();
            const hasAccess = await googleTokenService.hasScope(accessToken, requiredScope);

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

/**
 * Refresh the access token manually
 * Useful for client-side initiated refreshes when needed
 */
export const refreshToken = async (req: GoogleApiRequest, res: Response) => {
    try {
        const accountId = req.params.accountId;

        if (!accountId) {
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Account ID is required");
        }

        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);

        if (!session) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
        }

        try {
            // Force refresh the token
            const account = session.accounts.find(acc => acc.accountId === accountId);

            if (!account) {
                return sendError(res, 403, ApiErrorCode.AUTH_FAILED, "Account not in session");
            }

            // Get the account from the database to access the refresh token
            const models = await db.getModels();
            const dbAccount = await models.accounts.OAuthAccount.findOne({ id: accountId });

            if (!dbAccount || !dbAccount.tokenDetails.refreshToken) {
                return sendError(res, 400, ApiErrorCode.INVALID_DETAILS, "No refresh token available for this account");
            }

            // Refresh the token
            const googleTokenService = GoogleTokenService.getInstance();
            const newTokenInfo = await googleTokenService.refreshAccessToken(dbAccount.tokenDetails.refreshToken);

            // Update the token in the database
            await sessionManager.updateUserTokens(accountId, {
                accessToken: newTokenInfo.accessToken,
                refreshToken: newTokenInfo.refreshToken || dbAccount.tokenDetails.refreshToken,
                tokenCreatedAt: new Date().toISOString()
            });

            // Update the token in the session
            account.tokenInfo = {
                accessToken: newTokenInfo.accessToken,
                expiresAt: newTokenInfo.expiresAt,
                scope: newTokenInfo.scope
            };

            // Update the session cookie
            sessionManager.createSessionToken(res, session);

            return sendSuccess(res, 200, {
                success: true,
                expiresAt: new Date(newTokenInfo.expiresAt).toISOString(),
                expiresIn: Math.floor((newTokenInfo.expiresAt - Date.now()) / 1000)
            });
        } catch (error) {
            console.error('Error refreshing token:', error);
            return sendError(res, 500, ApiErrorCode.TOKEN_INVALID, "Failed to refresh token");
        }
    } catch (error) {
        return handleGoogleApiError(req, res, error);
    }
};

/**
 * Get a list of active sessions for the current user
 */
export const getSessions = async (req: GoogleApiRequest, res: Response) => {
    try {
        const accountId = req.params.accountId;

        if (!accountId) {
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Account ID is required");
        }

        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);

        if (!session) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
        }

        try {
            // Get all active sessions for this user
            const activeSessions = await sessionManager.getUserActiveSessions(accountId);

            // Remove sensitive data and format the response
            const formattedSessions = activeSessions.map(s => ({
                sessionId: s.sessionId,
                createdAt: s.createdAt,
                lastActivity: s.lastActivity,
                userAgent: s.userAgent,
                isCurrent: s.sessionId === session.sessionId
            }));

            return sendSuccess(res, 200, {
                sessions: formattedSessions,
                currentSessionId: session.sessionId
            });
        } catch (error) {
            console.error('Error retrieving sessions:', error);
            return sendError(res, 500, ApiErrorCode.SERVER_ERROR, "Failed to retrieve sessions");
        }
    } catch (error) {
        return handleGoogleApiError(req, res, error);
    }
};

/**
 * Terminate all other sessions for this user
 */
export const terminateOtherSessions = async (req: GoogleApiRequest, res: Response) => {
    try {
        const accountId = req.params.accountId;

        if (!accountId) {
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Account ID is required");
        }

        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);

        if (!session) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
        }

        try {
            // Deactivate all other sessions
            const deactivatedCount = await sessionManager.deactivateOtherSessions(
                accountId,
                session.sessionId
            );

            return sendSuccess(res, 200, {
                success: true,
                terminatedSessionsCount: deactivatedCount
            });
        } catch (error) {
            console.error('Error terminating sessions:', error);
            return sendError(res, 500, ApiErrorCode.SERVER_ERROR, "Failed to terminate sessions");
        }
    } catch (error) {
        return handleGoogleApiError(req, res, error);
    }
};

/**
 * Switch the active account in the current session
 */
export const switchAccount = async (req: GoogleApiRequest, res: Response) => {
    try {
        const { targetAccountId } = req.body;

        if (!targetAccountId) {
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Target account ID is required");
        }

        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);

        if (!session) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
        }

        // Check if the target account is in the session
        const targetAccount = session.accounts.find(acc => acc.accountId === targetAccountId);

        if (!targetAccount) {
            return sendError(res, 403, ApiErrorCode.AUTH_FAILED, "Target account not found in session");
        }

        // Update the selected account
        session.selectedAccountId = targetAccountId;

        // Update the session cookie
        sessionManager.createSessionToken(res, session);

        return sendSuccess(res, 200, {
            success: true,
            selectedAccountId: targetAccountId
        });
    } catch (error) {
        return handleGoogleApiError(req, res, error);
    }
};