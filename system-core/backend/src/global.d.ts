import { SessionPayload } from "./types/session.types";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Server configuration
            NODE_ENV: 'development' | 'production' | 'test';
            PORT?: string;

            // Database configuration
            MONGODB_URI?: string;

            // JWT and session configuration
            JWT_SECRET: string;
            SESSION_SECRET: string;
            JWT_EXPIRES_IN: StringValue;
            REFRESH_TOKEN_EXPIRES_IN: string;
            COOKIE_MAX_AGE: string;
            PROXY_URL: string;

            // OAuth providers client credentials
            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;

            // Optional Microsoft provider
            MICROSOFT_CLIENT_ID?: string;
            MICROSOFT_CLIENT_SECRET?: string;

            // Optional Facebook provider
            FACEBOOK_CLIENT_ID?: string;
            FACEBOOK_CLIENT_SECRET?: string;
        }
    }
    namespace Express {
        interface Request {
            session?: SessionPayload;
            googleAuth?: Auth.OAuth2Client;
            googlePermissionRedirectUrl?: string;
        }
    }
}

// This export is needed to make the file a module
export { };