import express, { Response, Request, NextFunction } from 'express';
import { OAuthAccount, AccountType, AccountStatus, Device, OAuthProviders } from '../account/Account.types';
import { validateOAuthAccount, validateDevice, userExists } from '../account/Account.validation';
import { validateSignUpState, validateSignInState, validateOAuthState } from './Auth.validation';
import { AuthType, AuthUrls, OAuthState, ProviderResponse, SignInState, SignUpState } from './Auth.types';
import { generateSignInState, generateSignupState, generateOAuthState, clearOAuthState, clearSignUpState, clearSignInState } from './Auth.utils';
import { SignUpRequest, SignUpDetailsAddRequest, SignInRequest, AuthRequest, OAuthCallBackRequest } from './Auth.dto';
import { sendError, sendSuccess, redirectWithError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';
import { validateStateMiddleware, validateProviderMiddleware } from './Auth.middleware';
import { createSignInSession, createSignUpSession, clearSession } from '../../utils/session';
import passport from 'passport';
import crypto from 'crypto';
import db from '../../config/db';
import { findUser } from '../account/Account.utils';

const router = express.Router();

// OAuth provider authentication routes
router.get('/auth/google', (req: AuthRequest, res: Response, next: NextFunction) => {
    const { state } = req.query;

    const stateDetails = validateStateMiddleware(state as string,
        (state) => validateOAuthState(state, OAuthProviders.Google),
        res
    );

    if (!stateDetails) return;

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: state as string
    })(req, res, next);
});

// router.get('/auth/microsoft', (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { state } = req.query;

//     const stateDetails = validateStateMiddleware(state as string,
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

// router.get('/auth/facebook', (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { state } = req.query;

//     const stateDetails = validateStateMiddleware(state as string,
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
        const stateDetails = validateStateMiddleware(reqState, validateSignUpState, res) as SignUpState;
        if (!stateDetails) return;

        try {
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
                },
                device: stateDetails.accountDetails.device as Device
            };

            const success = validateOAuthAccount(newAccount);
            if (!success) {
                sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Missing required account data');
                return;
            }

            clearSignUpState(stateDetails.state);

            db.data.oauthAccounts.push(newAccount);
            await db.write();

            // Create session instead of sending raw data
            const sessionResponse = createSignUpSession(res, newAccount);
            sendSuccess(res, 200, sessionResponse);
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
    } catch {
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to generate state');
    }
});

router.post('/signup/add/:details', async (req: SignUpDetailsAddRequest, res: Response) => {
    const { details } = req.params;
    const { state } = req.query;

    const stateDetails = validateStateMiddleware(state as string, validateSignUpState, res) as SignUpState;
    if (!stateDetails) return;

    try {
        switch (details) {
            case 'device': {
                const success = validateDevice(req.body);
                if (!success) {
                    sendError(res, 400, ApiErrorCode.INVALID_DETAILS, 'Invalid device details');
                    return;
                }

                stateDetails.accountDetails.device = req.body;
                await db.write();

                sendSuccess(res, 201, { message: 'Device details added successfully' });
                break;
            }
            default:
                sendError(res, 404, ApiErrorCode.INVALID_DETAILS, 'Unsupported details type');
        }
    } catch {
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Database operation failed');
    }
});

router.get('/signin/:provider?', async (req: SignInRequest, res: Response) => {
    const { state, error } = req.query;

    if (error) {
        sendError(res, 400, error as ApiErrorCode, 'Error during signin process');
        return;
    }

    if (state && typeof state === 'string') {
        const stateDetails = validateStateMiddleware(state, validateSignInState, res) as SignInState;
        if (!stateDetails) return;
        
        const user = findUser(stateDetails.oAuthResponse.email, stateDetails.oAuthResponse.provider);

        if (!user) {
            sendError(res, 404, ApiErrorCode.USER_NOT_FOUND, "User details not found");
            return;
        }

        // Update the user's token details
        user.tokenDetails = stateDetails.oAuthResponse.tokenDetails;
        user.updated = new Date().toISOString();
        await db.write();

        try {
            await clearSignInState(stateDetails.state);

            // Create session instead of sending raw data
            const sessionResponse = createSignInSession(res, stateDetails, user);
            sendSuccess(res, 200, sessionResponse);
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
    } catch {
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to generate state');
    }
});

router.get('/callback/:provider', async (req: OAuthCallBackRequest, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const stateFromProvider = req.query.state;

    if (!validateProviderMiddleware(provider, res)) return;

    const stateDetails = validateStateMiddleware(
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
                const exists = userExists(userEmail, provider as OAuthProviders);

                if (stateDetails.authType === AuthType.SIGN_UP) {
                    if (exists) {
                        redirectWithError(res, '/signup', ApiErrorCode.USER_EXISTS);
                        return;
                    }
                    const state = await generateSignupState(userData);
                    sendSuccess(res, 200, { state });
                } else {
                    if (!exists) {
                        redirectWithError(res, '/signin', ApiErrorCode.USER_NOT_FOUND);
                        return;
                    }
                    const state = await generateSignInState(userData);
                    res.redirect(`../signin?state=${state}`);
                }
            } catch {
                sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to process authentication');
            }
        })(req, res, next);
    } catch {
        sendError(res, 500, ApiErrorCode.DATABASE_ERROR, 'Failed to validate state');
    }
});

// Add logout endpoint 
router.post('/logout', (req: Request, res: Response) => {
    clearSession(res);
    sendSuccess(res, 200, { message: 'Logged out successfully' });
});

export { router };