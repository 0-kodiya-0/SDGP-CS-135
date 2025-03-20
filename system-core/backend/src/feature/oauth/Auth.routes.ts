import express, { Response, Request, NextFunction } from 'express';
import { OAuthAccount, AccountType, AccountStatus, OAuthProviders } from '../account/Account.types';
import { validateOAuthAccount, userExists } from '../account/Account.validation';
import { validateSignUpState, validateSignInState, validateOAuthState, validatePermissionState, verifyTokenOwnership } from './Auth.validation';
import { AuthType, AuthUrls, OAuthState, PermissionState, ProviderResponse, SignInState, SignUpState } from './Auth.types';
import { generateSignInState, generateSignupState, generateOAuthState, clearOAuthState, clearSignUpState, clearSignInState, generatePermissionState } from './Auth.utils';
import { SignUpRequest, SignInRequest, AuthRequest, OAuthCallBackRequest } from './Auth.dto';
import { sendError, redirectWithError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';
import { validateStateMiddleware, validateProviderMiddleware } from './Auth.middleware';
import { createSignInSession, createSignUpSession, updateUserTokens } from '../../utils/session';
import passport from 'passport';
import crypto from 'crypto';
import db from '../../config/db';
import { findUser } from '../account/Account.utils';
import { toOAuthAccount } from '../account/Account.utils';
import { getGoogleScope, GoogleServiceName } from '../google/config';
import { AuthenticateOptionsGoogle } from 'passport-google-oauth20';

export const router = express.Router();

/**
 * Common Google authentication route for all auth types
 */
router.get('/auth/google', async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { state } = req.query;

    const stateDetails = await validateStateMiddleware(state as string,
        (state) => validateOAuthState(state, OAuthProviders.Google),
        res
    );

    if (!stateDetails) return;

    // Default Google authentication options
    const authOptions = {
        scope: ['profile', 'email'],
        state: state as string,
        accessType: 'offline'
    };

    // Pass control to passport middleware
    passport.authenticate('google', authOptions)(req, res, next);
});

// router.get('/auth/microsoft', async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { state } = req.query;

//     const stateDetails = await validateStateMiddleware(state as string,
//         (state) => validateOAuthState(state, OAuthProviders.Microsoft),
//         res
//     );

//     if (!stateDetails) return;

//     passport.authenticate('microsoft', {
//         scope: ['user.read'],
//         session: false,
//         state: state as string
//     })(req, res, next);
// });

// router.get('/auth/facebook', async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { state } = req.query;

//     const stateDetails = await validateStateMiddleware(state as string,
//         (state) => validateOAuthState(state, OAuthProviders.Facebook),
//         res
//     );

//     if (!stateDetails) return;

//     passport.authenticate('facebook', {
//         scope: ['email'],
//         session: false,
//         state: state as string
//     })(req, res, next);
// });

router.get('/signup/:provider?', async (req: SignUpRequest, res: Response) => {
    const error = req.query.error;
    if (error) {
        sendError(res, 400, error as ApiErrorCode, 'Error during signup process');
        return;
    }

    const reqState = req.query.state;
    if (reqState && typeof reqState === 'string') {
        const stateDetails = await validateStateMiddleware(reqState, validateSignUpState, res) as SignUpState;
        if (!stateDetails) return;

        try {
            const models = await db.getModels();

            const newAccount: OAuthAccount = {
                id: crypto.randomBytes(16).toString('hex'),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                accountType: AccountType.OAuth,
                status: AccountStatus.Active,
                provider: stateDetails.oAuthResponse.provider,
                userDetails: {
                    name: stateDetails.oAuthResponse.name,
                    email: stateDetails.oAuthResponse.email,
                    imageUrl: stateDetails.oAuthResponse.imageUrl
                },
                tokenDetails: stateDetails.oAuthResponse.tokenDetails,
                security: {
                    twoFactorEnabled: false,
                    sessionTimeout: 3600,
                    autoLock: false
                }
            };

            const success = validateOAuthAccount(newAccount);
            if (!success) {
                sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Missing required account data');
                return;
            }

            await clearSignUpState(stateDetails.state);

            // Create the account in the accounts database
            await models.accounts.OAuthAccount.create(newAccount);

            // Create session with the new account, checking for existing session
            const sessionResponse = await createSignUpSession(res, newAccount, req);

            if (sessionResponse.error) {
                sendError(res, 400, sessionResponse.code, sessionResponse.message);
                return;
            }

            res.redirect('/');
            return;
        } catch (error) {
            console.log(error);
            sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Database operation failed');
            return;
        }
    }

    const { provider } = req.params;
    if (!validateProviderMiddleware(provider, res)) return;

    try {
        const state = await generateOAuthState(provider as OAuthProviders, AuthType.SIGN_UP);
        const authUrls: AuthUrls = {
            [OAuthProviders.Google]: `../auth/google?state=${state}`,
            [OAuthProviders.Microsoft]: `../auth/microsoft?state=${state}`,
            [OAuthProviders.Facebook]: `../auth/facebook?state=${state}`,
        };

        res.redirect(authUrls[provider as OAuthProviders]);
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to generate state');
    }
});

// router.post('/signup/add/:details', async (req: SignUpDetailsAddRequest, res: Response) => {
//     const { details } = req.params;
//     const { state } = req.query;

//     const stateDetails = await validateStateMiddleware(state as string, validateSignUpState, res) as SignUpState;
//     if (!stateDetails) return;

//     try {
//         switch (details) {
//             case 'device': {
//                 const success = validateDevice(req.body);
//                 if (!success) {
//                     sendError(res, 400, ApiErrorCode.INVALID_DETAILS, 'Invalid device details');
//                     return;
//                 }

//                 const models = await db.getModels();

//                 // Update the state document with the device details
//                 await models.auth.SignUpState.updateOne(
//                     { state: stateDetails.state },
//                     { $set: { 'accountDetails.device': req.body } }
//                 );

//                 sendSuccess(res, 201, { message: 'Device details added successfully' });
//                 break;
//             }
//             default:
//                 sendError(res, 404, ApiErrorCode.INVALID_DETAILS, 'Unsupported details type');
//         }
//     } catch (error) {
//         console.error(error);
//         sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Database operation failed');
//     }
// });

router.get('/signin/:provider?', async (req: SignInRequest, res: Response) => {
    const { state, error } = req.query;

    if (error) {
        sendError(res, 400, error as ApiErrorCode, 'Error during signin process');
        return;
    }

    if (state && typeof state === 'string') {
        const stateDetails = await validateStateMiddleware(state, validateSignInState, res) as SignInState;
        if (!stateDetails) return;

        const user = await findUser(stateDetails.oAuthResponse.email, stateDetails.oAuthResponse.provider);

        if (!user) {
            sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, "User details not found");
            return;
        }

        try {
            const models = await db.getModels();

            // Find and update the user in the accounts database
            const dbUser = await models.accounts.OAuthAccount.findOne({ id: user.id });
            if (!dbUser) {
                sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, "User record not found in database");
                return;
            }

            // Update the user's token details
            dbUser.tokenDetails = stateDetails.oAuthResponse.tokenDetails;
            dbUser.updated = new Date().toISOString();
            await dbUser.save();

            await clearSignInState(stateDetails.state);

            // Create or update session with the signed-in account
            const sessionResponse = await createSignInSession(res, toOAuthAccount(dbUser)!, req);

            if (sessionResponse.error) {
                sendError(res, 400, sessionResponse.code, sessionResponse.message);
                return;
            }

            res.redirect('/');
            return;
        } catch (error) {
            console.log(error)
            sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to validate state');
            return;
        }
    }

    const { provider } = req.params;
    if (!validateProviderMiddleware(provider, res)) return;

    try {
        const state = await generateOAuthState(provider as OAuthProviders, AuthType.SIGN_IN);
        const authUrls: AuthUrls = {
            [OAuthProviders.Google]: `../auth/google?state=${state}`,
            [OAuthProviders.Microsoft]: `../auth/microsoft?state=${state}`,
            [OAuthProviders.Facebook]: `../auth/facebook?state=${state}`,
        };

        res.redirect(authUrls[provider as OAuthProviders]);
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to generate state');
    }
});

router.get('/callback/:provider', async (req: OAuthCallBackRequest, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const stateFromProvider = req.query.state;

    if (!validateProviderMiddleware(provider, res)) return;

    const stateDetails = await validateStateMiddleware(
        stateFromProvider,
        (state) => validateOAuthState(state, provider as OAuthProviders),
        res
    ) as OAuthState;
    if (!stateDetails) return;

    try {
        await clearOAuthState(stateDetails.state);

        passport.authenticate(provider as OAuthProviders, { session: false }, async (err: Error | null, userData: ProviderResponse) => {
            if (err) {
                sendError(res, 500, ApiErrorCode.AUTH_FAILED, 'Authentication failed');
                return;
            }
            if (!userData) {
                sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Authentication failed - no user data');
                return;
            }

            const userEmail = userData.email;
            if (!userEmail) {
                sendError(res, 400, ApiErrorCode.MISSING_EMAIL, 'Missing email parameter');
                return;
            }

            try {
                const exists = await userExists(userEmail, provider as OAuthProviders);

                if (stateDetails.authType === AuthType.SIGN_UP) {
                    if (exists) {
                        redirectWithError(res, '/signup', ApiErrorCode.USER_EXISTS);
                        return;
                    }
                    const state = await generateSignupState(userData);
                    res.redirect(`../signup?state=${state}`);
                } else {
                    if (!exists) {
                        redirectWithError(res, '/signin', ApiErrorCode.USER_NOT_FOUND);
                        return;
                    }
                    const state = await generateSignInState(userData);
                    res.redirect(`../signin?state=${state}`);
                }
            } catch (error) {
                console.error(error);
                sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to process authentication');
            }
        })(req, res, next);
    } catch (error) {
        console.error(error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to validate state');
    }
});

/**
 * Dedicated callback route for permission requests - focused only on token handling
 */
router.get('/callback/permission/:provider', async (req: Request, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const stateFromProvider = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
        console.error(`Permission error returned from provider: ${error}`);
        return sendError(res, 400, ApiErrorCode.AUTH_FAILED, `Permission request failed: ${error}`);
    }

    if (!validateProviderMiddleware(provider, res)) return;

    try {
        const permissionDetails = await validateStateMiddleware(
            stateFromProvider,
            (state) => validatePermissionState(state, provider as OAuthProviders),
            res
        ) as PermissionState;
        if (!permissionDetails) return;

        // Get the details we need from the permission state
        const { accountId, service, scopeLevel, redirect } = permissionDetails;

        // Use the permission-specific passport strategy
        passport.authenticate(`${provider}-permission`, { session: false }, async (err: Error | null, result: ProviderResponse) => {
            if (err) {
                console.error('Permission token exchange error:', err);
                sendError(res, 500, ApiErrorCode.AUTH_FAILED, 'Permission token exchange failed');
                return;
            }

            if (!result || !result.tokenDetails || !result.tokenDetails.accessToken) {
                sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Permission request failed - no token received');
                return;
            }

            try {
                console.log(`Processing permission callback for account ${accountId}, service ${service}, scope ${scopeLevel}`);

                // Verify that the token belongs to the correct user account
                const tokenInfo = await verifyTokenOwnership(result.tokenDetails.accessToken, accountId);
                
                if (!tokenInfo.isValid) {
                    console.error('Token ownership verification failed:', tokenInfo.reason);
                    return sendError(
                        res, 
                        403, 
                        ApiErrorCode.AUTH_FAILED, 
                        'Permission was granted with an incorrect account. Please try again and ensure you use the correct Google account.'
                    );
                }
                
                const tokenDetails = { accessToken: result.tokenDetails.accessToken, refreshToken: '' };

                if (result.tokenDetails.refreshToken) {
                    tokenDetails["refreshToken"] = result.tokenDetails.refreshToken;
                }

                await updateUserTokens(accountId, tokenDetails);

                console.log(`Token updated for ${service} ${scopeLevel}. Redirecting to ${redirect}`);

                // Redirect back to the original URL
                return res.redirect(redirect);
            } catch (error) {
                console.error('Error updating token:', error);
                sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to update token');
            }
        })(req, res, next);
    } catch (error) {
        console.error('Permission callback error:', error);
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to process permission callback');
    }
});

router.get(
    '/permission/:service/:scopeLevel',
    async (req: Request, res: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const scopeLevel = req.params.scopeLevel as string;
        const { accountId, redirect } = req.query;

        try {
            // Get the user's account details
            const models = await db.getModels();
            const account = await models.accounts.OAuthAccount.findOne({ id: accountId });

            if (!account || !account.userDetails.email) {
                return sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, 'Account not found or missing email');
            }

            const userEmail = account.userDetails.email;

            // Get the scope
            const scope = getGoogleScope(service as GoogleServiceName, scopeLevel);

            // Generate state and save permission state
            const state = await generatePermissionState(
                OAuthProviders.Google,
                redirect as string,
                accountId as string,
                service,
                scopeLevel
            );

            // CRITICAL: These options force Google to use the specified account
            const authOptions: AuthenticateOptionsGoogle = {
                scope: scope,
                accessType: 'offline',
                    // Only show consent screen, not account selection
                loginHint: userEmail,     // Pre-select the account
                state,
                includeGrantedScopes: true
            };

            console.log(`Initiating permission request for service: ${service}, scope: ${scopeLevel}, account: ${userEmail}`);

            // Redirect to Google authorization page
            passport.authenticate('google-permission', authOptions)(req, res, next);
        } catch (error) {
            console.error('Error initiating permission request:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to initiate permission request';
            sendError(res, 400, ApiErrorCode.INVALID_REQUEST, errorMessage);
        }
    }
);