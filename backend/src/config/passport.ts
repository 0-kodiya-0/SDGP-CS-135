import passport, { Profile, DoneCallback } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { OAuthProviders } from '../feature/account/Account.types';
import { ProviderResponse } from '../feature/oauth/Auth.types';

const setupPassport = () => {
    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/api/oauth/callback/google',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const response: ProviderResponse = {
                provider: OAuthProviders.Google,
                name: profile.displayName,
                email: profile.emails?.[0].value,
                imageUrl: profile.photos?.[0].value,
                tokenDetails: {
                    accessToken,
                    refreshToken: refreshToken || '',
                }
            };
            return done(null, response);
        } catch (error) {
            return done(error as Error);
        }
    }));

    // Microsoft Strategy
    passport.use(new MicrosoftStrategy({
        clientID: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        callbackURL: '/api/oauth/callback/microsoft',
        scope: ['user.read']
    }, async (accessToken: string, refreshToken: string | undefined, profile: Profile, done: DoneCallback) => {
        try {
            const response: ProviderResponse = {
                provider: OAuthProviders.Google,
                name: profile.displayName,
                email: profile.emails?.[0].value,
                imageUrl: profile.photos?.[0].value,
                tokenDetails: {
                    accessToken,
                    refreshToken: refreshToken || '',
                }
            };
            return done(null, response);
        } catch (error) {
            return done(error as Error);
        }
    }));

    // Facebook Strategy
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        callbackURL: '/api/oauth/callback/facebook',
        profileFields: ['id', 'displayName', 'photos', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const response: ProviderResponse = {
                provider: OAuthProviders.Google,
                name: profile.displayName,
                email: profile.emails?.[0].value,
                imageUrl: profile.photos?.[0].value,
                tokenDetails: {
                    accessToken,
                    refreshToken: refreshToken || '',
                }
            };
            return done(null, response);
        } catch (error) {
            return done(error as Error);
        }
    }));
};

export default setupPassport;