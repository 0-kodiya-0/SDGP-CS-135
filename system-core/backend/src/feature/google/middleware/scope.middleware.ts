import { NextFunction, Response, Request } from "express";
import { ApiErrorCode } from "../../../types/response.types";
import { sendError } from "../../../utils/response";
import { ensureValidToken } from "../../oauth/Auth.middleware";
import {
    GoogleServiceName,
    createGoogleClientWithScopeCheck
} from "../config/config";
import { getAbsoluteUrl } from "../../../utils/url";

/**
 * Middleware to verify that the user has granted the required scopes
 * and request additional permissions if needed
 * 
 * @param service The Google service (gmail, calendar, etc.)
 * @param scopeLevel The level of access needed (readonly, full, etc.)
 */
export const requireGoogleScope = (service: GoogleServiceName, scopeLevel: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // First ensure the token is valid
            await ensureValidToken(req, res, (err) => {
                if (err) return err;
            });

            const { accountId } = req.params;

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

            // Store the original request URL to redirect back after permission grant
            const originalUrl = req.originalUrl;

            try {
                // Check if the user's token has the required scope
                const { client, hasScope } = await createGoogleClientWithScopeCheck(
                    accountId,
                    service,
                    scopeLevel
                );

                if (!hasScope) {
                    // Token doesn't have the required scope, redirect to permission request
                    const permissionPath = `/oauth/permission/${service}/${scopeLevel}`;
                    const redirectParam = encodeURIComponent(getAbsoluteUrl(req, originalUrl));
                    const permissionUrl = `${getAbsoluteUrl(req, permissionPath)}?redirect=${redirectParam}&accountId=${accountId}`;

                    console.log(`Redirecting to request additional permissions: ${permissionUrl}`);
                    return res.redirect(permissionUrl);
                }

                // Token has the required scope, attach the client to the request
                req.googleAuth = client;

                // Also store the permission redirect URL for error handling
                const permissionPath = `/oauth/permission/${service}/${scopeLevel}`;
                const redirectParam = encodeURIComponent(getAbsoluteUrl(req, originalUrl));
                req.googlePermissionRedirectUrl = `${getAbsoluteUrl(req, permissionPath)}?redirect=${redirectParam}&accountId=${accountId}`;

                next();
            } catch (error) {
                // Log the error and check if it might be a permission issue
                console.error('Google scope validation error:', error);

                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const isLikelyPermissionError =
                    errorMessage.includes('permission') ||
                    errorMessage.includes('scope') ||
                    errorMessage.includes('access');

                if (isLikelyPermissionError) {
                    // Redirect to permission request
                    const permissionPath = `/oauth/permission/${service}/${scopeLevel}`;
                    const redirectParam = encodeURIComponent(getAbsoluteUrl(req, originalUrl));
                    const permissionUrl = `${getAbsoluteUrl(req, permissionPath)}?redirect=${redirectParam}&accountId=${accountId}`;

                    console.log(`Redirecting to request additional permissions: ${permissionUrl}`);
                    return res.redirect(permissionUrl);
                }

                sendError(
                    res,
                    403,
                    ApiErrorCode.AUTH_FAILED,
                    `Access to Google ${service} requires additional permissions`
                );
            }
        } catch (error) {
            console.error('Google scope middleware error:', error);
            sendError(
                res,
                403,
                ApiErrorCode.AUTH_FAILED,
                `Access to Google ${service} requires additional permissions`
            );
        }
    };
};

/**
 * Combined middleware for Google API routes
 * This middleware ensures the token is valid and the user has the required scope
 */
export const googleApiAuth = (service: GoogleServiceName, scopeLevel: string = 'readonly') => {
    return [
        requireGoogleScope(service, scopeLevel)
    ];
};