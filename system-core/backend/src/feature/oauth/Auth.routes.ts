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
import { createSignInSession, createSignUpSession, clearSession, removeAccountFromSession } from '../../utils/session';
import passport from 'passport';
import crypto from 'crypto';
import db from '../../config/db';
import { findUser } from '../account/Account.utils';
import { toOAuthAccount } from '../account/Account.utils';

const router = express.Router();

router.get('/auth/google', async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { state } = req.query;

    const stateDetails = await validateStateMiddleware(state as string,
        (state) => validateOAuthState(state, OAuthProviders.Google),
        res
    );

    if (!stateDetails) return;

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: state as string,
        accessType: 'offline',
        prompt: 'consent'
    })(req, res, next);
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

// Logout a specific account
router.post('/:accountId/logout', (req: Request, res: Response) => {
    const { accountId } = req.params;

    const success = removeAccountFromSession(res, req, accountId);

    if (success) {
        sendSuccess(res, 200, { message: 'Account logged out successfully' });
    } else {
        sendError(res, 400, ApiErrorCode.AUTH_FAILED, 'Failed to logout account');
    }
});

// Logout all accounts (clear entire session)
router.get('/logout/all', (req: Request, res: Response) => {
    clearSession(res);
    res.redirect('/');
});

export { router };