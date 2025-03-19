import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import refresh from 'passport-oauth2-refresh';
import { OAuthProviders } from '../feature/account/Account.types';
import { ProviderResponse } from '../feature/oauth/Auth.types';

/**
 * Sets up passport strategies for OAuth providers
 */
const setupPassport = () => {
    // Main Google Strategy for authentication (sign in/sign up)
    const googleAuthStrategy = new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: 'http://localhost:8080/api/v1/oauth/callback/google',
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            console.log('Google Auth callback received');

            // Create the provider response with all user information
            const response: ProviderResponse = {
                provider: OAuthProviders.Google,
                name: profile.displayName,
                email: profile.emails?.[0].value,
                imageUrl: profile.photos?.[0].value,
                tokenDetails: {
                    accessToken,
                    refreshToken: refreshToken || '',
                    tokenCreatedAt: new Date().toISOString()
                }
            };

            console.log(`Authentication successful for: ${response.email}`);

            return done(null, response);
        } catch (error) {
            console.error('Error in Google auth strategy:', error);
            return done(error as Error);
        }
    });

    // Separate Google Strategy for permission requests - focused only on tokens
    const googlePermissionStrategy = new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: 'http://localhost:8080/api/v1/oauth/callback/permission/google',
        passReqToCallback: true,
        skipUserProfile: true
    }, async (req, accessToken, refreshToken, params, done) => {
        try {
            console.log('Google Permission callback received');

            // For permission requests, we only care about the tokens
            // We don't need to extract profile information because we already have it
            const response: ProviderResponse = {
                provider: OAuthProviders.Google,
                // These fields will be ignored/unused for permission requests
                name: '',
                email: '',
                imageUrl: '',
                // The important part: the new token with expanded scopes
                tokenDetails: {
                    accessToken,
                    refreshToken: refreshToken || '',
                    tokenCreatedAt: new Date().toISOString()
                }
            };

            console.log(`Permission request successful, received new access token`);

            return done(null, response);
        } catch (error) {
            console.error('Error in Google permission strategy:', error);
            return done(error as Error);
        }
    });

    // Register the strategies with different names
    passport.use('google', googleAuthStrategy);
    passport.use('google-permission', googlePermissionStrategy);

    // Register the strategy for refresh token usage
    refresh.use('google', googleAuthStrategy);
};

export default setupPassport;

// // Microsoft Strategy
// passport.use(new MicrosoftStrategy({
//     clientID: process.env.MICROSOFT_CLIENT_ID!,
//     clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
//     callbackURL: '/api/oauth/callback/microsoft',
//     scope: ['user.read']
// }, async (accessToken: string, refreshToken: string | undefined, profile: Profile, done: DoneCallback) => {
//     try {
//         const response: ProviderResponse = {
//             provider: OAuthProviders.Google,
//             name: profile.displayName,
//             email: profile.emails?.[0].value,
//             imageUrl: profile.photos?.[0].value,
//             tokenDetails: {
//                 accessToken,
//                 refreshToken: refreshToken || '',
//             }
//         };
//         return done(null, response);
//     } catch (error) {
//         return done(error as Error);
//     }
// }));

// // Facebook Strategy
// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_CLIENT_ID!,
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
//     callbackURL: '/api/oauth/callback/facebook',
//     profileFields: ['id', 'displayName', 'photos', 'email']
// }, async (accessToken, refreshToken, profile, done) => {
//     try {
//         const response: ProviderResponse = {
//             provider: OAuthProviders.Google,
//             name: profile.displayName,
//             email: profile.emails?.[0].value,
//             imageUrl: profile.photos?.[0].value,
//             tokenDetails: {
//                 accessToken,
//                 refreshToken: refreshToken || '',
//             }
//         };
//         return done(null, response);
//     } catch (error) {
//         return done(error as Error);
//     }
// }));