import express, { Response, Request, NextFunction } from 'express';
import { OAuthAccount, AccountType, AccountStatus, OAuthProviders } from '../account/Account.types';
import { validateOAuthAccount } from '../account/Account.validation';
import { validateSignUpState, validateSignInState, validateOAuthState, validatePermissionState, verifyTokenOwnership, validateProvider, validateState } from './Auth.validation';
import { AuthType, AuthUrls, OAuthState, PermissionState, ProviderResponse, SignInState, SignUpState } from './Auth.types';
import { generateSignInState, generateSignupState, generateOAuthState, clearOAuthState, clearSignUpState, clearSignInState, generatePermissionState } from './Auth.utils';
import { SignUpRequest, SignInRequest, AuthRequest, OAuthCallBackRequest } from './Auth.dto';
import { ApiErrorCode, AuthError, BadRequestError, NotFoundError, RedirectError, RedirectSuccess } from '../../types/response.types';
import passport from 'passport';
import db from '../../config/db';
import { findUserByEmail, findUserById, userEmailExists, userIdExists } from '../account/Account.utils';
import { getGoogleScope, GoogleServiceName } from '../google/config';
import { AuthenticateOptionsGoogle } from 'passport-google-oauth20';
// import { getRedirectUrl } from '../../utils/redirect';
import { asyncHandler } from '../../utils/response';
import { getTokenInfo } from '../google/services/token';
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../services/session';

export const router = express.Router();

/**
 * Common Google authentication route for all auth types
 */
router.get('/auth/google', asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { state } = req.query;

    await validateState(state as string,
        (state) => validateOAuthState(state, OAuthProviders.Google),
        res
    );

    // Default Google authentication options
    const authOptions: AuthenticateOptionsGoogle = {
        scope: ['profile', 'email'],
        state: state as string,
        accessType: 'offline',
        prompt: 'consent'
    };

    // Pass control to passport middleware
    passport.authenticate('google', authOptions)(req, res, next);
}));

router.get('/signup/:provider?', asyncHandler(async (req: SignUpRequest, res: Response, next: NextFunction) => {
    const frontendRedirectUrl = req.query.redirectUrl as string;

    const provider = req.params.provider as OAuthProviders;

    if (!frontendRedirectUrl) {
        throw new BadRequestError("Missing redirectUrl query parameter");
    }

    if (!validateProvider(provider, res)) {
        throw new RedirectError(ApiErrorCode.INVALID_PROVIDER, frontendRedirectUrl, 'Invalid provider');
    };

    const reqState = req.query.state;
    if (reqState && typeof reqState === 'string') {
        const stateDetails = await validateState(reqState, validateSignUpState, res) as SignUpState;
        if (!stateDetails || !stateDetails.oAuthResponse.email) {
            throw new BadRequestError('Invalid or missing state details', 400, ApiErrorCode.INVALID_STATE);
        }

        try {
            const models = await db.getModels();

            const newAccount: Omit<OAuthAccount, "id"> = {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                accountType: AccountType.OAuth,
                status: AccountStatus.Active,
                provider,
                userDetails: {
                    name: stateDetails.oAuthResponse.name,
                    email: stateDetails.oAuthResponse.email,
                    imageUrl: stateDetails.oAuthResponse.imageUrl
                },
                security: {
                    twoFactorEnabled: false,
                    sessionTimeout: 3600,
                    autoLock: false
                }
            };

            const success = validateOAuthAccount(newAccount);
            if (!success) {
                throw new RedirectError(ApiErrorCode.MISSING_DATA, frontendRedirectUrl, 'Missing required account data');
            }

            await clearSignUpState(stateDetails.state);

            const newAccountDoc = await models.accounts.OAuthAccount.create(newAccount);

            const accessTokenInfo = await getTokenInfo(stateDetails.oAuthResponse.tokenDetails.accessToken);

            if (!accessTokenInfo.expires_in) {
                return next(new RedirectError(ApiErrorCode.SERVER_ERROR, frontendRedirectUrl, 'Failed to fetch token information'));
            }

            setAccessTokenCookie(
                res,
                newAccountDoc.id || newAccountDoc._id.toHexString(),
                stateDetails.oAuthResponse.tokenDetails.accessToken,
                accessTokenInfo.expires_in as number
            );

            if (stateDetails.oAuthResponse.tokenDetails.refreshToken) {
                setRefreshTokenCookie(res, newAccountDoc.id || newAccountDoc._id.toHexString(), stateDetails.oAuthResponse.tokenDetails.refreshToken);
            }

            // Use the stored redirect URL if available, otherwise use the default
            const redirectTo = stateDetails.redirectUrl || frontendRedirectUrl;

            next(new RedirectSuccess({
                accountId: newAccountDoc.id || newAccountDoc._id.toHexString(),
                name: newAccount.userDetails.name
            }, redirectTo));
            return;
        } catch (error) {
            console.log(error);
            throw new RedirectError(ApiErrorCode.SERVER_ERROR, frontendRedirectUrl, 'Database operation failed');
        }
    }

    const generatedState = await generateOAuthState(provider as OAuthProviders, AuthType.SIGN_UP, frontendRedirectUrl);
    const authUrls: AuthUrls = {
        [OAuthProviders.Google]: '../auth/google',
        [OAuthProviders.Microsoft]: '../auth/microsoft',
        [OAuthProviders.Facebook]: '../auth/facebook',
    };

    next(new RedirectSuccess({ state: generatedState }, authUrls[provider as OAuthProviders], 302, undefined, frontendRedirectUrl));
}));

router.get('/signin/:provider?', asyncHandler(async (req: SignInRequest, res: Response, next: NextFunction) => {
    const frontendRedirectUrl = req.query.redirectUrl as string;

    const provider = req.params.provider as OAuthProviders;
    const { state } = req.query;

    if (!frontendRedirectUrl) {
        throw new BadRequestError("Missing redirectUrl query parameter");
    }

    if (!validateProvider(provider, res)) {
        throw new BadRequestError('Invalid provider');
    };

    if (state && typeof state === 'string') {
        const stateDetails = await validateState(state, validateSignInState, res) as SignInState;
        if (!stateDetails || !stateDetails.oAuthResponse.email) {
            throw new BadRequestError('Invalid or missing state details', 400, ApiErrorCode.INVALID_STATE);
        }

        const user = await findUserByEmail(stateDetails.oAuthResponse.email);

        if (!user) {
            throw new RedirectError(ApiErrorCode.USER_NOT_FOUND, frontendRedirectUrl, 'User details not found');
        }

        try {
            await clearSignInState(stateDetails.state);

            const accessTokenInfo = await getTokenInfo(stateDetails.oAuthResponse.tokenDetails.accessToken);

            if (!accessTokenInfo.expires_in) {
                return next(new RedirectError(ApiErrorCode.SERVER_ERROR, frontendRedirectUrl, 'Failed to fetch token information'));
            }

            setAccessTokenCookie(
                res,
                user.id,
                stateDetails.oAuthResponse.tokenDetails.accessToken,
                accessTokenInfo.expires_in as number
            );

            if (stateDetails.oAuthResponse.tokenDetails.refreshToken) {
                setRefreshTokenCookie(res, user.id, stateDetails.oAuthResponse.tokenDetails.refreshToken);
            }

            // Use the stored redirect URL if available, otherwise use the default
            const redirectTo = stateDetails.redirectUrl || frontendRedirectUrl;

            next(new RedirectSuccess({
                accountId: user.id,
                name: user.userDetails.name
            }, redirectTo));
            return;
        } catch (error) {
            console.log(error);
            throw new RedirectError(ApiErrorCode.DATABASE_ERROR, frontendRedirectUrl, 'Failed to validate state');
        }
    }

    const generatedState = await generateOAuthState(provider as OAuthProviders, AuthType.SIGN_IN, frontendRedirectUrl);
    const authUrls: AuthUrls = {
        [OAuthProviders.Google]: '../auth/google',
        [OAuthProviders.Microsoft]: '../auth/microsoft',
        [OAuthProviders.Facebook]: '../auth/facebook',
    };

    next(new RedirectSuccess({ state: generatedState }, authUrls[provider as OAuthProviders], 302, undefined, frontendRedirectUrl));
}));

router.get('/callback/:provider', asyncHandler(async (req: OAuthCallBackRequest, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const stateFromProvider = req.query.state;

    if (!validateProvider(provider, res)) {
        throw new BadRequestError('Invalid provider');
    };

    const stateDetails = await validateState(
        stateFromProvider,
        (state) => validateOAuthState(state, provider as OAuthProviders),
        res
    ) as OAuthState;

    // Extract redirect URL from state
    const redirectUrl = stateDetails.redirectUrl || '/';

    await clearOAuthState(stateDetails.state);

    passport.authenticate(provider as OAuthProviders, { session: false }, async (err: Error | null, userData: ProviderResponse) => {
        try {
            if (err) {
                return next(new RedirectError(ApiErrorCode.AUTH_FAILED, redirectUrl, 'Authentication failed'));
            }

            if (!userData) {
                return next(new RedirectError(ApiErrorCode.AUTH_FAILED, redirectUrl, 'Authentication failed - no user data'));
            }

            const userEmail = userData.email;
            if (!userEmail) {
                return next(new RedirectError(ApiErrorCode.MISSING_EMAIL, redirectUrl, 'Missing email parameter'));
            }

            const exists = await userEmailExists(userEmail);

            if (stateDetails.authType === AuthType.SIGN_UP) {
                if (exists) {
                    return next(new RedirectError(ApiErrorCode.USER_EXISTS, redirectUrl));
                }
                const state = await generateSignupState(userData, redirectUrl);
                next(new RedirectSuccess({ state },
                    `../signup/${provider}`,
                    302,
                    "User authenticated by provider", redirectUrl));
            } else {
                if (!exists) {
                    return next(new RedirectError(ApiErrorCode.USER_NOT_FOUND, redirectUrl));
                }
                const state = await generateSignInState(userData, redirectUrl);
                next(new RedirectSuccess({ state },
                    `../signin/${provider}`,
                    302,
                    "User authenticated by provider", redirectUrl));
            }

        } catch (error) {
            console.error(error);
            next(new RedirectError(ApiErrorCode.SERVER_ERROR, redirectUrl, 'Failed to process authentication'));
        }
    })(req, res, next);
}));

/**
 * Dedicated callback route for permission requests - focused only on token handling
 */
router.get('/callback/permission/:provider', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const stateFromProvider = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
        console.error(`Permission error returned from provider: ${error}`);
        throw new AuthError(`Permission request failed: ${error}`);
    }

    if (!validateProvider(provider, res)) {
        throw new BadRequestError('Invalid provider');
    };

    const permissionDetails = await validateState(
        stateFromProvider,
        (state) => validatePermissionState(state, provider as OAuthProviders),
        res
    ) as PermissionState;

    // Get the details we need from the permission state
    const { accountId, service, scopeLevel, redirectUrl } = permissionDetails;

    // Use the permission-specific passport strategy
    passport.authenticate(`${provider}-permission`, { session: false }, async (err: Error | null, result: ProviderResponse) => {
        try {
            if (err) {
                console.error('Permission token exchange error:', err);
                return next(new RedirectError(ApiErrorCode.AUTH_FAILED, redirectUrl, 'Permission token exchange failed'));
            }

            if (!result || !result.tokenDetails || !result.tokenDetails.accessToken || !result.tokenDetails.refreshToken) {
                return next(new RedirectError(ApiErrorCode.AUTH_FAILED, redirectUrl, 'Permission request failed'));
            }

            const exists = await userIdExists(accountId);

            if (!exists) {
                return next(new RedirectError(ApiErrorCode.USER_NOT_FOUND, redirectUrl, 'User record not found in database'));
            }

            console.log(`Processing permission callback for account ${accountId}, service ${service}, scope ${scopeLevel}`);

            // Verify that the token belongs to the correct user account
            const token = await verifyTokenOwnership(result.tokenDetails.accessToken, accountId);

            if (!token.isValid) {
                console.error('Token ownership verification failed:', token.reason);
                return next(new RedirectError(ApiErrorCode.AUTH_FAILED, redirectUrl, 'Permission was granted with an incorrect account. Please try again and ensure you use the correct Google account.'));
            }

            const accessTokenInfo = await getTokenInfo(result.tokenDetails.accessToken);

            if (!accessTokenInfo.expires_in) {
                return next(new RedirectError(ApiErrorCode.SERVER_ERROR, redirectUrl, 'Failed to fetch token information'));
            }

            setAccessTokenCookie(
                res,
                accountId,
                result.tokenDetails.accessToken,
                accessTokenInfo.expires_in as number
            );

            if (result.tokenDetails.refreshToken) {
                setRefreshTokenCookie(res, accountId, result.tokenDetails.refreshToken);
            }

            console.log(`Token updated for ${service} ${scopeLevel}. Redirecting to ${redirectUrl}`);

            next(new RedirectSuccess({
                service,
                scopeLevel,
                success: true
            }, redirectUrl));
        } catch (error) {
            console.error('Error updating token:', error);
            next(new RedirectError(ApiErrorCode.SERVER_ERROR, redirectUrl, 'Failed to update token'));
        }
    })(req, res, next);
}));

router.get('/permission/:service/:scopeLevel', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const service = req.params.service as string;
    const scopeLevel = req.params.scopeLevel as string;
    const { accountId, redirectUrl } = req.query;

    if (!redirectUrl || typeof redirectUrl !== 'string') {
        throw new BadRequestError('Redirect URL is required for permission requests');
    }

    if (!accountId) {
        throw new BadRequestError('Account id is required for permission requests');
    }

    // Get the user's account details
    const account = await findUserById(accountId as string);

    if (!account || !account.userDetails.email) {
        throw new NotFoundError('Account not found or missing email', 404, ApiErrorCode.USER_NOT_FOUND);
    }

    const userEmail = account.userDetails.email;

    const scopeLevels = scopeLevel.split(',');

    // Get the scopes - handle both single and multiple scopes
    const scopes = scopeLevels.map(level =>
        getGoogleScope(service as GoogleServiceName, level)
    );

    // Generate state and save permission state
    const state = await generatePermissionState(
        OAuthProviders.Google,
        redirectUrl as string,
        accountId as string,
        service,
        scopeLevel
    );

    // CRITICAL: These options force Google to use the specified account
    const authOptions: AuthenticateOptionsGoogle = {
        scope: scopes,
        accessType: 'offline',
        prompt: 'consent',
        loginHint: userEmail,     // Pre-select the account
        state,
        includeGrantedScopes: true
    };

    console.log(`Initiating permission request for service: ${service}, scope: ${scopeLevel}, account: ${userEmail}`);

    // Redirect to Google authorization page
    passport.authenticate('google-permission', authOptions)(req, res, next);
}));