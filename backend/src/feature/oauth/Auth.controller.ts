import { NextFunction, Response, Request } from 'express';
import passport from 'passport';
import { 
    ApiErrorCode, 
    BadRequestError, 
    NotFoundError,
    RedirectError, 
    RedirectSuccess 
} from '../../types/response.types';
import * as AuthService from './Auth.service';
import { AuthType, AuthUrls, OAuthState, PermissionState, ProviderResponse, SignInState } from './Auth.types';
import { OAuthProviders } from '../account/Account.types';
import { 
    validateOAuthState, 
    validateSignInState, 
    validateSignUpState, 
    validatePermissionState, 
    validateProvider, 
    validateState, 
} from './Auth.validation';
import { 
    clearOAuthState, 
    clearSignInState, 
    clearSignUpState, 
    generateOAuthState, 
    generatePermissionState} from './Auth.utils';
import { 
    getTokenInfo,
    verifyTokenOwnership} from '../google/services/token';
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../services/session';
import { createRedirectUrl, RedirectType } from '../../utils/redirect';
import { GoogleServiceName, getGoogleScope } from '../google/config';
import { SignUpRequest, SignInRequest, OAuthCallBackRequest } from './Auth.dto';
import { ValidationUtils } from '../../utils/validation';

/**
 * Initiate Google authentication
 */
export const initiateGoogleAuth = async (req: Request, res: Response, next: NextFunction) => {
    const { state } = req.query;

    await validateState(state as string,
        (state) => validateOAuthState(state, OAuthProviders.Google),
        res
    );

    // Default Google authentication options
    const authOptions = {
        scope: ['profile', 'email'],
        state: state as string,
        accessType: 'offline',
        prompt: 'consent'
    };

    // Pass control to passport middleware
    passport.authenticate('google', authOptions)(req, res, next);
};

/**
 * Handle sign up process
 */
export const signup = async (req: SignUpRequest, res: Response, next: NextFunction) => {
    const frontendRedirectUrl = req.query.redirectUrl as string;
    const provider = req.params.provider as OAuthProviders;

    if (!frontendRedirectUrl) {
        throw new BadRequestError("Missing redirectUrl query parameter");
    }

    if (!validateProvider(provider, res)) {
        throw new RedirectError(ApiErrorCode.INVALID_PROVIDER, frontendRedirectUrl, 'Invalid provider');
    }

    const reqState = req.query.state;
    if (reqState && typeof reqState === 'string') {
        const stateDetails = await validateState(reqState, validateSignUpState, res) as SignInState;
        
        try {
            const result = await AuthService.processSignup(stateDetails, provider);
            await clearSignUpState(stateDetails.state);
            
            if (result.accessTokenInfo && result.accessTokenInfo.expires_in) {
                setAccessTokenCookie(
                    res,
                    result.accountId,
                    result.accessToken,
                    result.accessTokenInfo.expires_in * 1000
                );
                
                if (result.refreshToken) {
                    setRefreshTokenCookie(res, result.accountId, result.refreshToken);
                }
            }
            
            // Use the stored redirect URL if available, otherwise use the default
            const redirectTo = stateDetails.redirectUrl || frontendRedirectUrl;
            
            next(new RedirectSuccess({
                accountId: result.accountId,
                name: result.name
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

    next(new RedirectSuccess({ state: generatedState }, authUrls[provider], 302, "State generated", frontendRedirectUrl));
};

/**
 * Handle sign in process
 */
export const signin = async (req: SignInRequest, res: Response, next: NextFunction) => {
    const frontendRedirectUrl = req.query.redirectUrl as string;
    const provider = req.params.provider as OAuthProviders;
    const { state } = req.query;

    if (!frontendRedirectUrl) {
        throw new BadRequestError("Missing redirectUrl query parameter");
    }

    if (!validateProvider(provider, res)) {
        throw new BadRequestError('Invalid provider');
    }

    if (state && typeof state === 'string') {
        const stateDetails = await validateState(state, validateSignInState, res) as SignInState;

        try {
            const result = await AuthService.processSignIn(stateDetails, frontendRedirectUrl);
            await clearSignInState(stateDetails.state);
            
            if (result.accessTokenInfo && result.accessTokenInfo.expires_in) {
                setAccessTokenCookie(
                    res,
                    result.userId,
                    result.accessToken,
                    result.accessTokenInfo.expires_in * 1000
                );
                
                if (result.refreshToken) {
                    setRefreshTokenCookie(res, result.userId, result.refreshToken);
                }
            }
            
            // Handle additional scopes
            if (result.needsAdditionalScopes) {
                const redirectTo = createRedirectUrl(stateDetails.redirectUrl || frontendRedirectUrl, {
                    type: RedirectType.SUCCESS, 
                    data: {
                        accountId: result.userId,
                        name: result.userName
                    }
                });
                
                next(new RedirectSuccess({
                    accountId: result.userId,
                    name: result.userName,
                    skipRedirectUrl: redirectTo
                }, '/auth/permission-confirmation', undefined, undefined, `/api/v1/oauth/permission/reauthorize?redirectUrl=${redirectTo}`));
            } else {
                // No additional scopes needed, continue with normal flow
                const redirectTo = stateDetails.redirectUrl || frontendRedirectUrl;
                
                next(new RedirectSuccess({
                    accountId: result.userId,
                    name: result.userName
                }, redirectTo));
            }
            
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

    next(new RedirectSuccess({ state: generatedState }, authUrls[provider], 302, undefined, frontendRedirectUrl));
};

/**
 * Handle callback from OAuth provider
 */
export const handleCallback = async (req: OAuthCallBackRequest, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const stateFromProvider = req.query.state;

    if (!validateProvider(provider, res)) {
        throw new BadRequestError('Invalid provider');
    }

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
            
            const result = await AuthService.processSignInSignupCallback(userData, stateDetails, redirectUrl);
            
            if (result.authType === AuthType.SIGN_UP) {
                next(new RedirectSuccess({ state: result.state },
                    `../signup/${provider}`,
                    302,
                    "User authenticated by provider", redirectUrl));
            } else {
                next(new RedirectSuccess({ state: result.state },
                    `../signin/${provider}`,
                    302,
                    "User authenticated by provider", redirectUrl));
            }
        } catch (error) {
            console.error(error);
            next(new RedirectError(ApiErrorCode.SERVER_ERROR, redirectUrl, 'Failed to process authentication'));
        }
    })(req, res, next);
};

/**
 * Handle callback for permission request
 */
export const handlePermissionCallback = async (req: Request, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const stateFromProvider = req.query.state as string;

    if (!validateProvider(provider, res)) {
        throw new BadRequestError('Invalid provider');
    }

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

            const exists = await AuthService.checkUserExists(accountId);

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

            // Update tokens and scopes
            await AuthService.updateTokensAndScopes(
                accountId, 
                result.tokenDetails.accessToken
            );

            setAccessTokenCookie(
                res,
                accountId,
                result.tokenDetails.accessToken,
                accessTokenInfo.expires_in * 1000
            );

            if (result.tokenDetails.refreshToken) {
                setRefreshTokenCookie(res, accountId, result.tokenDetails.refreshToken);
            }

            console.log(`Token updated for ${service} ${scopeLevel}. Redirecting to ${redirectUrl}`);

            next(new RedirectSuccess({
                accountId,
                service,
                scopeLevel,
            }, redirectUrl));
        } catch (error) {
            console.error('Error updating token:', error);
            next(new RedirectError(ApiErrorCode.SERVER_ERROR, redirectUrl, 'Failed to update token'));
        }
    })(req, res, next);
};

/**
 * Request permission for a specific service
 */
export const requestPermission = async (req: Request, res: Response, next: NextFunction) => {
    const service = req.params.service as string;
    const scopeLevel = req.params.scopeLevel as string;
    const { accountId, redirectUrl } = req.query;

    ValidationUtils.validateRequiredFields(req.query, ['redirectUrl', 'accountId']);
    ValidationUtils.validateUrl(redirectUrl as string, 'Redirect URL');
    ValidationUtils.validateObjectId(accountId as string, 'Account ID');

    // Get user account information
    const account = await AuthService.getUserAccount(accountId as string);
    
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
    const authOptions = {
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
};

/**
 * Reauthorize permissions
 */
export const reauthorizePermissions = async (req: Request, res: Response, next: NextFunction) => {
    const { accountId, redirectUrl } = req.query;

    if (!accountId || !redirectUrl) {
        throw new BadRequestError("Missing required parameters");
    }

    // Get the user's account details
    const account = await AuthService.getUserAccount(accountId as string);

    if (!account || !account.userDetails.email) {
        throw new NotFoundError('Account not found or missing email', 404, ApiErrorCode.USER_NOT_FOUND);
    }

    // Get previously granted scopes from the database
    const storedScopes = await AuthService.getAccountScopes(accountId as string);

    if (!storedScopes || storedScopes.length === 0) {
        // No additional scopes to request, just redirect to final destination
        return next(new RedirectSuccess({ message: "No additional scopes needed" }, redirectUrl as string));
    }

    // Generate a unique state for this re-authorization
    const state = await generatePermissionState(
        OAuthProviders.Google,
        redirectUrl as string,
        accountId as string,
        "reauthorize",
        "all"
    );

    // Build the authentication options
    const authOptions = {
        scope: storedScopes,
        accessType: 'offline',
        prompt: 'consent',
        loginHint: account.userDetails.email,
        state,
        includeGrantedScopes: true
    };

    console.log(`Re-requesting scopes for account ${accountId}:`, storedScopes);

    // Redirect to Google authorization page
    passport.authenticate('google-permission', authOptions)(req, res, next);
};