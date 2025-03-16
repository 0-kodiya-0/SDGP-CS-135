import { SessionPayload } from "./types/session.types";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Server configuration
            NODE_ENV: 'development' | 'production' | 'test';
            PORT?: string;

            // JWT and session configuration
            JWT_SECRET: string;
            JWT_EXPIRES_IN: StringValue;
            COOKIE_MAX_AGE: string;

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
        }
    }
}

// This export is needed to make the file a module
export { };