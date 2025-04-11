import { Response } from 'express';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { GoogleServiceName, getGoogleScope } from '../../config';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { isValidGoogleService } from '../../utils';
import db from '../../../../config/db';
import { GoogleTokenService } from '../../services/token';
import { updateUserTokens, createSessionToken } from '../../../../services/session';

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
        // Get service and scope levels from query parameters
        const { service, scopeLevel, scopeLevels } = req.query;

        if (!service) {
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Service parameter is required');
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
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'At least one scope level is required');
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

        // Use GoogleTokenService to get all granted scopes at once
        const googleTokenService = GoogleTokenService.getInstance();
        const tokenInfo = await googleTokenService.getTokenInfo(accessToken);
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

        return sendSuccess(res, 200, {
            service: serviceName,
            scopeResults: results
        });
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
        const session = req.session;

        if (!session) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
        }

        if (!accountId) {
            return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Account ID is required");
        }

        // const session = extractSession(req);

        try {
            // // Force refresh the token
            // const account = session.accounts.find(acc => acc === accountId);

            // if (!account) {
            //     return sendError(res, 403, ApiErrorCode.AUTH_FAILED, "Account not in session");
            // }

            // Get the account from the database to access the refresh token
            const models = await db.getModels();
            const dbAccount = await models.accounts.OAuthAccount.findOne({ _id: accountId });

            if (!dbAccount || !dbAccount.tokenDetails.refreshToken) {
                return sendError(res, 400, ApiErrorCode.INVALID_DETAILS, "No refresh token available for this account");
            }

            // Refresh the token
            const googleTokenService = GoogleTokenService.getInstance();
            const newTokenInfo = await googleTokenService.refreshAccessToken(dbAccount.tokenDetails.refreshToken);

            // Update the token in the database
            await updateUserTokens(accountId, {
                accessToken: newTokenInfo.accessToken,
                refreshToken: newTokenInfo.refreshToken || dbAccount.tokenDetails.refreshToken,
                tokenCreatedAt: new Date().toISOString()
            });

            // Update the token in the session
            // account.tokenInfo = {
            //     accessToken: newTokenInfo.accessToken,
            //     expiresAt: newTokenInfo.expiresAt,
            //     scope: newTokenInfo.scope
            // };

            // Update the session cookie
            createSessionToken(res, session);

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

// /**
//  * Get a list of active sessions for the current user
//  */
// export const getSessions = async (req: GoogleApiRequest, res: Response) => {
//     try {
//         const accountId = req.params.accountId;

//         if (!accountId) {
//             return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Account ID is required");
//         }

//
//         const session = extractSession(req);

//         if (!session) {
//             return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
//         }

//         try {
//             // Get all active sessions for this user
//             const activeSessions = await getUserActiveSessions(accountId);

//             // Remove sensitive data and format the response
//             const formattedSessions = activeSessions.map(s => ({
//                 sessionId: s.sessionId,
//                 createdAt: s.createdAt,
//                 lastActivity: s.lastActivity,
//                 userAgent: s.userAgent,
//                 isCurrent: s.sessionId === session.sessionId
//             }));

//             return sendSuccess(res, 200, {
//                 sessions: formattedSessions,
//                 currentSessionId: session.sessionId
//             });
//         } catch (error) {
//             console.error('Error retrieving sessions:', error);
//             return sendError(res, 500, ApiErrorCode.SERVER_ERROR, "Failed to retrieve sessions");
//         }
//     } catch (error) {
//         return handleGoogleApiError(req, res, error);
//     }
// };

// /**
//  * Terminate all other sessions for this user
//  */
// export const terminateOtherSessions = async (req: GoogleApiRequest, res: Response) => {
//     try {
//         const accountId = req.params.accountId;

//         if (!accountId) {
//             return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Account ID is required");
//         }

//
//         const session = extractSession(req);

//         if (!session) {
//             return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
//         }

//         try {
//             // Deactivate all other sessions
//             const deactivatedCount = await deactivateOtherSessions(
//                 accountId,
//                 session.sessionId
//             );

//             return sendSuccess(res, 200, {
//                 success: true,
//                 terminatedSessionsCount: deactivatedCount
//             });
//         } catch (error) {
//             console.error('Error terminating sessions:', error);
//             return sendError(res, 500, ApiErrorCode.SERVER_ERROR, "Failed to terminate sessions");
//         }
//     } catch (error) {
//         return handleGoogleApiError(req, res, error);
//     }
// };

// /**
//  * Switch the active account in the current session
//  */
// export const switchAccount = async (req: GoogleApiRequest, res: Response) => {
//     try {
//         const { targetAccountId } = req.body;

//         if (!targetAccountId) {
//             return sendError(res, 400, ApiErrorCode.MISSING_DATA, "Target account ID is required");
//         }

//
//         const session = extractSession(req);

//         if (!session) {
//             return sendError(res, 401, ApiErrorCode.AUTH_FAILED, "No active session");
//         }

//         // Check if the target account is in the session
//         const targetAccount = session.accounts.find(acc => acc.accountId === targetAccountId);

//         if (!targetAccount) {
//             return sendError(res, 403, ApiErrorCode.AUTH_FAILED, "Target account not found in session");
//         }

//         // Update the selected account
//         session.selectedAccountId = targetAccountId;

//         // Update the session cookie
//         createSessionToken(res, session);

//         return sendSuccess(res, 200, {
//             success: true,
//             selectedAccountId: targetAccountId
//         });
//     } catch (error) {
//         return handleGoogleApiError(req, res, error);
//     }
// };