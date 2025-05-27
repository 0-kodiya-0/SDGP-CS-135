import { AccountDocument } from "./feature/account/Account.model";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Server configuration
            NODE_ENV: 'development' | 'production' | 'test';
            PORT?: string;

            // Database configuration
            MONGODB_URI?: string;
            BASE_URL?: string;
            PROXY_URL?: string;

            // JWT and session configuration
            JWT_SECRET?: string;
            SESSION_SECRET?: string;

            ACCESS_TOKEN_EXPIRY?: StringValue;
            REFRESH_TOKEN_EXPIRY?: StringValue;

            COOKIE_MAX_AGE?: string;

            // OAuth providers client credentials
            GOOGLE_CLIENT_ID?: string;
            GOOGLE_CLIENT_SECRET?: string;

            // Optional Microsoft provider
            MICROSOFT_CLIENT_ID?: string;
            MICROSOFT_CLIENT_SECRET?: string;

            // Optional Facebook provider
            FACEBOOK_CLIENT_ID?: string;
            FACEBOOK_CLIENT_SECRET?: string;

            APP_NAME?: string;

            SMTP_HOST?: string;
            SMTP_PORT?: string;
            SMTP_SECURE?: string;
            SMTP_APP_PASSWORD?: string;
            SENDER_EMAIL?: string
            SENDER_NAME?: string
        }
    }
    namespace Express {
        interface Request {
            accessToken?: string;
            oauthAccessToken?: string;

            refreshToken?: string;
            oauthRefreshToken?: string;
            
            googleAuth?: Auth.OAuth2Client;
            googlePermissionRedirectUrl?: string;
            
            workspaceId?: string;
            
            // Unified account property
            account?: AccountDocument;
            
            // Legacy properties for backward compatibility during transition
            oauthAccount?: AccountDocument;
            localAccount?: AccountDocument;
        }
    }
}

// This export is needed to make the file a module
export { };