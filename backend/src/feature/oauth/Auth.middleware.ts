import { Response } from 'express';
import { OAuthProviders } from '../account/Account.types';
import { ApiErrorCode } from '../../types/response.types';
import { sendError } from '../../utils/response';
import { StateDetails } from './Auth.dto';

type ValidateStateMiddleware = (state: string | undefined, validate: (state: string) => StateDetails, res: Response) => StateDetails | undefined;

// Middleware to validate state parameter
export const validateStateMiddleware: ValidateStateMiddleware = (state, validate, res) => {
    if (!state || typeof state !== 'string') {
        sendError(res, 400, ApiErrorCode.INVALID_STATE, 'Missing state parameter');
        return;
    }

    const stateDetails = validate(state);

    if (!stateDetails) {
        sendError(res, 400, ApiErrorCode.INVALID_STATE, 'Invalid or expired state parameter');
        return;
    }

    return stateDetails;
}

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