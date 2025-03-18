import { NextFunction, Request, Response } from 'express';
import { OAuthProviders } from '../account/Account.types';
import { ApiErrorCode } from '../../types/response.types';
import { sendError } from '../../utils/response';
import { StateDetails } from './Auth.dto';
import { SessionPayload } from '../../types/session.types';
import { validateAndRefreshToken } from '../../utils/session';

type ValidateStateMiddleware = (
    state: string | undefined,
    validate: (state: string) => Promise<StateDetails>,
    res: Response
) => Promise<StateDetails | undefined>;

// Middleware to validate state parameter
export const validateStateMiddleware: ValidateStateMiddleware = async (state, validate, res) => {
    if (!state || typeof state !== 'string') {
        sendError(res, 400, ApiErrorCode.INVALID_STATE, 'Missing state parameter');
        return;
    }

    try {
        const stateDetails = await validate(state);

        if (!stateDetails) {
            sendError(res, 400, ApiErrorCode.INVALID_STATE, 'Invalid or expired state parameter');
            return;
        }

        return stateDetails;
    } catch (error) {
        console.error('Error validating state:', error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to validate state');
        return;
    }
};

type ValidateProviderMiddleware = (provider: string | undefined, res: Response) => boolean

// Middleware to validate provider parameter
export const validateProviderMiddleware: ValidateProviderMiddleware = (provider, res) => {
    if (!provider || typeof provider !== 'string') {
        sendError(res, 400, ApiErrorCode.INVALID_PROVIDER, 'Missing or invalid provider parameter');
        return false;
    }

    if (!Object.values(OAuthProviders).includes(provider as OAuthProviders)) {
        sendError(res, 400, ApiErrorCode.INVALID_PROVIDER, 'Invalid provider');
        return false;
    }

    return true;
};

/**
 * Middleware to ensure that the OAuth token is valid and refreshed if necessary
 * This middleware should be applied to routes that require a valid token
 */
export const ensureValidToken = async (req: Request, res: Response, next: NextFunction) => {
    // Get the account ID from the route parameters
    const accountId = req.params.accountId;

    if (!accountId) {
        return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Account ID is required');
    }

    try {
        // Get the session from the request (added by the authenticateSession middleware)
        const session = req.session as SessionPayload;

        // Find the account in the session
        const accountSession = session.accounts.find(acc => acc.accountId === accountId);

        if (!accountSession) {
            return sendError(res, 403, ApiErrorCode.AUTH_FAILED, 'No access to this account');
        }

        // Get the provider for this account
        const provider = accountSession.provider as OAuthProviders;

        if (!provider) {
            return sendError(res, 400, ApiErrorCode.INVALID_PROVIDER, 'Provider information missing');
        }

        // Validate and refresh the token if needed
        await validateAndRefreshToken(accountId, provider);

        // Continue with the request
        next();
    } catch (error) {
        console.error('Token validation middleware error:', error);
        return sendError(res, 500, ApiErrorCode.AUTH_FAILED, 'Token validation failed');
    }
};