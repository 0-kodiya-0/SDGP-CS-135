import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import refresh from 'passport-oauth2-refresh';
import { OAuthProviders } from '../feature/account/Account.types';
import { ProviderResponse } from '../feature/oauth/Auth.types';

/**
 * Sets up passport strategies for OAuth providers
 */
const setupPassport = () => {
    // Create the Google Strategy with support for dynamic callback URLs
    const googleStrategy = new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: 'http://localhost:8080/api/v1/oauth/callback/google',
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            console.log('Google OAuth callback received');

            // Create the provider response with all necessary information
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
            console.error('Error in Google passport strategy:', error);
            return done(error as Error);
        }
    });

    // Register the Google Strategy
    passport.use(googleStrategy);

    // Register the strategy for refresh token usage
    refresh.use(googleStrategy);
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