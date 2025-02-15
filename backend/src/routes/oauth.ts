import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import crypto from 'crypto';
import { OAuthProviders, OAuthAccount, AccountType, OAuthState, AuthType, AuthUrls, OAuthUserData, AccountStatus, SignUpState, SignInState, DevicePreferences, Device, BaseAccount, TokenDetails, UserDetails } from '../types/data';
import db from '../config/db';

const router = express.Router();

// Generate and store state for OAuth flow
const generateState = (provider: OAuthProviders, authType: AuthType): string => {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const stateData: OAuthState = {
        state,
        provider,
        authType,
        expiresAt,
    };

    db.data.oauthStates.push(stateData);
    return state;
};

// Validate state and return auth type
const validateOAuthState = (state: string, provider: OAuthProviders): OAuthState | null => {
    const stateData = db.data.oauthStates.find(s =>
        s.state === state &&
        s.provider === provider &&
        new Date(s.expiresAt) > new Date()
    );

    if (stateData) {
        // Remove used state
        db.data.oauthStates = db.data.oauthStates.filter(s => s.state !== state);
        return stateData;
    }

    return null;
};

const validateSignInState = (state: string): SignInState | null => {
    const stateData = db.data.signInStates.find(s =>
        s.state === state &&
        new Date(s.expiresAt) > new Date()
    );

    if (stateData) {
        // Remove used state
        db.data.signInStates = db.data.signInStates.filter(s => s.state !== state);
        return stateData;
    }

    return null;
};

const validateSignUpState = (state: string, remove: boolean): SignUpState | null => {
    const stateData = db.data.signUpStates.find(s =>
        s.state === state &&
        new Date(s.expiresAt) > new Date()
    );

    if (stateData) {
        // Remove used state

        if (remove) {
            db.data.signUpStates = db.data.signUpStates.filter(s => s.state !== state);
        }
        return stateData;
    }

    return null;
};

const userExists = (email: string, provider: OAuthProviders): boolean => {
    return db.data.oauthAccounts.some(account =>
        account.userDetails.email === email &&
        account.provider === provider
    );
};

function validateUserDetails(obj: any): obj is UserDetails {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.name === "string" &&
        (obj.email === undefined || typeof obj.email === "string") &&
        (obj.imageUrl === undefined || typeof obj.imageUrl === "string")
    );
}

function validateTokenDetails(obj: any): obj is TokenDetails {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.accessToken === "string" &&
        typeof obj.refreshToken === "string"
    );
}

function validateDevicePreferences(obj: any): obj is DevicePreferences {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.theme === "string" &&
        typeof obj.language === "string" &&
        typeof obj.notifications === "boolean" &&
        Array.isArray(obj.notificationTypes)
    );
}

function validateDevice(obj: any): obj is Device {
    if (
        obj &&
        typeof obj === "object" &&
        typeof obj.id === "string" &&
        typeof obj.installationDate === "string" &&
        typeof obj.name === "string" &&
        typeof obj.os === "string" &&
        typeof obj.version === "string" &&
        typeof obj.uniqueIdentifier === "string" &&
        validateDevicePreferences(obj.preferences)
    ) {
        return true;
    }
    throw new Error("Invalid Device object");
}

function validateBaseAccount(obj: any): obj is BaseAccount {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.id === "string" &&
        typeof obj.created === "string" &&
        typeof obj.updated === "string" &&
        validateDevice(obj.device) &&
        Object.values(AccountType).includes(obj.accountType) &&
        Object.values(AccountStatus).includes(obj.status) &&
        validateUserDetails(obj.userDetails)
    );
}

function validateOAuthAccount(obj: any): obj is OAuthAccount {
    if (
        validateBaseAccount(obj as OAuthAccount) &&
        obj.accountType === AccountType.OAuth &&
        Object.values(OAuthProviders).includes(obj.provider) &&
        typeof obj.security === "object" &&
        validateTokenDetails(obj.tokenDetails)
    ) {
        return true;
    }
    throw new Error("Invalid OAuthAccount object");
}

// Sign Up endpoint
router.post('/signup', (req: Request, res: Response) => {


    const reqState = req.query.state as string | undefined;

    if (reqState) {
        const stateDetails = validateSignUpState(reqState, true);

        if (!stateDetails) {
            res.status(400).json({ error: 'Invalid or expired state parameter' });
            return;
        }

        const success = validateOAuthAccount(stateDetails.accountDetails);

        if (!success) {
            res.status(400).json({ error: 'Missing data' });
            return;
        }

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

        db.data.oauthAccounts.push(newAccount);
        db.write();

        res.json(stateDetails);
        return;
    }

    const { provider } = req.body as { provider: OAuthProviders };
    const state = generateState(provider, AuthType.SIGN_UP);

    const authUrls: AuthUrls = {
        [OAuthProviders.Google]: `/api/oauth/auth/google?state=${state}`,
        [OAuthProviders.Microsoft]: `/api/oauth/auth/microsoft?state=${state}`,
        [OAuthProviders.Facebook]: `/api/oauth/auth/facebook?state=${state}`,
    };

    res.json({ authUrl: authUrls[provider] });
});

type SignUpDetails = 'device' | undefined | null;

router.post('/signup/add/:details', (req: Request, res: Response) => {

    const details = req.params.details as SignUpDetails;

    const reqState = req.query.state as string | undefined;

    if (!reqState) {
        res.status(400).json({ error: 'Missing state parameter' });
        return;
    }
    const stateDetails = validateSignUpState(reqState, false);

    if (!stateDetails) {
        res.status(400).json({ error: 'Invalid or expired state parameter' });
        return;
    }

    switch (details) {
        case 'device':

            const body = req.body as Device;

            const success = validateDevice(body);
            if (!success) {
                res.status(400).json({ error: 'Invalid body' });
                return;
            }

            stateDetails.accountDetails.device = body;
            db.write();

            res.send(201);
            break;
        default:
            res.status(404);
            return;
    }
});

// Sign In endpoint
router.post('/signin', (req: Request, res: Response) => {

    const reqState = req.query.state as string | undefined;

    if (reqState) {
        const stateDetails = validateSignInState(reqState);

        if (!stateDetails) {
            res.status(400).json({ error: 'Invalid or expired state parameter' });
            return;
        }
        res.json(stateDetails);
        return;
    }

    const { provider } = req.body as { provider: OAuthProviders };
    const state = generateState(provider, AuthType.SIGN_IN);

    const authUrls: AuthUrls = {
        [OAuthProviders.Google]: `/api/oauth/auth/google?state=${state}`,
        [OAuthProviders.Microsoft]: `/api/oauth/auth/microsoft?state=${state}`,
        [OAuthProviders.Facebook]: `/api/oauth/auth/facebook?state=${state}`,
    };

    res.json({ authUrl: authUrls[provider] });
});

// OAuth provider authentication routes
// In oauth.ts
router.get('/auth/google', (req: Request, res: Response, next: NextFunction) => {
    const { state } = req.query;

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: state as string // Pass the state to Google
    })(req, res, next);
});

router.get('/auth/microsoft', (req: Request, res: Response, next: NextFunction) => {
    const { state } = req.query;

    passport.authenticate('microsoft', {
        scope: ['user.read'],
        session: false,
        state: state as string
    })(req, res, next);
});

router.get('/auth/facebook', (req: Request, res: Response, next: NextFunction) => {
    const { state } = req.query;

    passport.authenticate('facebook', {
        scope: ['email'],
        session: false,
        state: state as string
    })(req, res, next);
});

// OAuth callback route
router.get('/callback/:provider', (req: Request, res: Response, next: NextFunction) => {
    const { provider } = req.params;
    const stateFromProvider = req.query.state as string | undefined;

    if (!stateFromProvider) {
        res.status(400).json({ error: 'Missing state parameter' });
        return;
    }

    const stateData = validateOAuthState(stateFromProvider, provider as OAuthProviders);
    if (!stateData) {
        res.status(400).json({ error: 'Invalid or expired state parameter' });
        return;
    }

    passport.authenticate(provider, { session: false }, (err: Error | null, userData: any) => {
        if (err) {
            res.status(500).json({ error: 'Authentication failed' });
            return;
        }
        if (!userData) {
            res.status(401).json({ error: 'Authentication failed - no user data' });
            return;
        }

        const userEmail = userData.userDetails.email;
        const exists = userExists(userEmail, provider as OAuthProviders);

        if (stateData.authType === AuthType.SIGN_UP) {
            if (exists) {
                res.redirect('/auth/signup?error=user_exists');
                return;
            }
            const state = generateState(provider as OAuthProviders, AuthType.SIGN_IN);

            res.json({ state });

        } else {
            // Sign In flow
            if (!exists) {
                res.redirect('/auth/signin?error=user_not_found');
                return;
            }


            res.redirect('/auth/signin/success');
        }
    })(req, res, next);
});

// Get OAuth accounts
router.get('/accounts', (req: Request, res: Response) => {
    res.json(db.data.oauthAccounts);
});

// Update OAuth account
router.patch('/accounts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const accountIndex = db.data.oauthAccounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
        res.status(404).json({ error: 'Account not found' });
        return;
    }

    const updatedAccount: OAuthAccount = {
        ...db.data.oauthAccounts[accountIndex],
        ...updates,
        updated: new Date().toISOString(),
    };

    db.data.oauthAccounts[accountIndex] = updatedAccount;
    await db.write();

    res.json(updatedAccount);
});

// Remove OAuth account
router.delete('/accounts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    db.data.oauthAccounts = db.data.oauthAccounts.filter(acc => acc.id !== id);
    await db.write();

    res.status(204).send();
});

// Refresh OAuth token
router.post('/accounts/:id/refresh', async (req: Request, res: Response) => {
    const { id } = req.params;
    const account = db.data.oauthAccounts.find(acc => acc.id === id);

    if (!account) {
        res.status(404).json({ error: 'Account not found' });
        return;
    }

    try {
        const tokenDetails = {
            accessToken: crypto.randomBytes(32).toString('hex'),
            refreshToken: account.tokenDetails.refreshToken,
        };

        const accountIndex = db.data.oauthAccounts.findIndex(acc => acc.id === id);
        const updatedAccount: OAuthAccount = {
            ...account,
            tokenDetails,
            updated: new Date().toISOString(),
            accountType: AccountType.OAuth, // Explicitly set accountType
        };

        db.data.oauthAccounts[accountIndex] = updatedAccount;
        await db.write();
        res.json(tokenDetails);
    } catch (error) {
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Update OAuth account security settings
router.patch('/accounts/:id/security', async (req: Request, res: Response) => {
    const { id } = req.params;
    const securityUpdates = req.body;

    const accountIndex = db.data.oauthAccounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
        res.status(404).json({ error: 'Account not found' });
        return;
    }

    const updatedAccount: OAuthAccount = {
        ...db.data.oauthAccounts[accountIndex],
        security: {
            ...db.data.oauthAccounts[accountIndex].security,
            ...securityUpdates,
        },
        updated: new Date().toISOString(),
    };

    db.data.oauthAccounts[accountIndex] = updatedAccount;
    await db.write();

    res.json(updatedAccount);
});

export default router;