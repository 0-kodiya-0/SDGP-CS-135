import { google, Auth } from 'googleapis';
import { OAuthProviders } from '../../account/Account.types';
import { validateAndRefreshToken } from '../../../utils/session';

// Define scope level types for each service
export type GmailScopeLevel = 'readonly' | 'send' | 'compose' | 'full';
export type CalendarScopeLevel = 'readonly' | 'events' | 'full';
export type DriveScopeLevel = 'readonly' | 'file' | 'full';
export type PeopleScopeLevel = 'readonly' | 'full';
export type MeetScopeLevel = 'readonly' | 'full';

// Map of services to their scope level types
export interface GoogleScopeMap {
    gmail: Record<GmailScopeLevel, string>;
    calendar: Record<CalendarScopeLevel, string>;
    drive: Record<DriveScopeLevel, string>;
    people: Record<PeopleScopeLevel, string>;
    meet: Record<MeetScopeLevel, string>;
}

// Service name type
export type GoogleServiceName = keyof GoogleScopeMap;

// Union of all scope levels
export type GoogleScopeLevel = GmailScopeLevel | CalendarScopeLevel | DriveScopeLevel | PeopleScopeLevel | MeetScopeLevel;

/**
 * Define scopes for different Google services
 * Reference: https://developers.google.com/identity/protocols/oauth2/scopes
 */
export const GoogleScopes: GoogleScopeMap = {
    // Gmail API scopes
    gmail: {
        readonly: 'https://www.googleapis.com/auth/gmail.readonly',
        send: 'https://www.googleapis.com/auth/gmail.send',
        compose: 'https://www.googleapis.com/auth/gmail.compose',
        full: 'https://mail.google.com/',
    },
    // Calendar API scopes
    calendar: {
        readonly: 'https://www.googleapis.com/auth/calendar.readonly',
        events: 'https://www.googleapis.com/auth/calendar.events',
        full: 'https://www.googleapis.com/auth/calendar',
    },
    // Drive API scopes
    drive: {
        readonly: 'https://www.googleapis.com/auth/drive.readonly',
        file: 'https://www.googleapis.com/auth/drive.file',
        full: 'https://www.googleapis.com/auth/drive',
    },
    // People API scopes
    people: {
        readonly: 'https://www.googleapis.com/auth/contacts.readonly',
        full: 'https://www.googleapis.com/auth/contacts',
    },
    // Meet API scopes (part of Calendar API)
    meet: {
        readonly: 'https://www.googleapis.com/auth/calendar.readonly',
        full: 'https://www.googleapis.com/auth/calendar',
    }
};

/**
 * Get a scope URL safely with type checking
 */
export function getGoogleScope(service: GoogleServiceName, scopeLevel: string): string {
    // Check if the service exists
    if (!GoogleScopes[service]) {
        throw new Error(`Invalid Google service: ${service}`);
    }

    // Get the scopes for this service
    const serviceScopes = GoogleScopes[service];

    // Check if the scope level exists for this service
    if (!serviceScopes[scopeLevel as keyof typeof serviceScopes]) {
        throw new Error(`Invalid scope level '${scopeLevel}' for service '${service}'`);
    }

    // Return the scope URL
    return serviceScopes[scopeLevel as keyof typeof serviceScopes];
}

// Reverse mapping to get service and level from scope URL
export const ScopeToServiceMap = new Map<string, { service: GoogleServiceName, level: GoogleScopeLevel }>();

// Build the reverse mapping
Object.entries(GoogleScopes).forEach(([service, levels]) => {
    Object.entries(levels).forEach(([level, scope]) => {
        ScopeToServiceMap.set(scope, {
            service: service as GoogleServiceName,
            level: level as GoogleScopeLevel
        });
    });
});

/**
 * Create an OAuth2 client with the given credentials
 */
export const createOAuth2Client = (accessToken: string, refreshToken: string): Auth.OAuth2Client => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    return oauth2Client;
};

/**
 * Check if the token has the required scope
 * 
 * @param token Access token to check
 * @param requiredScope The scope to check for
 * @returns Promise that resolves to true if scope is included, false otherwise
 */
export const hasRequiredScope = async (token: string, requiredScope: string): Promise<boolean> => {
    try {
        // Use the tokeninfo endpoint to get information about the token
        const response = await google.oauth2('v2').tokeninfo({
            access_token: token
        });

        if (!response.data.scope) {
            return false;
        }

        // The scope string contains space-separated scopes
        const grantedScopes = response.data.scope.split(' ');
        return grantedScopes.includes(requiredScope);
    } catch (error) {
        console.error('Error checking token scopes:', error);
        return false;
    }
};

/**
 * Create an authenticated Google API client for the requested service
 * This function ensures the token is valid before creating the client
 * 
 * @param accountId User's account ID
 * @returns Promise resolving to an OAuth2 client
 */
export const createGoogleClient = async (accountId: string): Promise<Auth.OAuth2Client> => {
    try {
        // Validate and refresh token if needed
        const tokenDetails = await validateAndRefreshToken(accountId, OAuthProviders.Google);

        // Create OAuth2 client with the validated tokens
        const oauth2Client = createOAuth2Client(
            tokenDetails.accessToken,
            tokenDetails.refreshToken
        );

        return oauth2Client;
    } catch (error) {
        console.error('Error creating Google API client:', error);
        throw new Error('Failed to create Google API client');
    }
};

/**
 * Check if the user's token has the required scope and create a Google client
 * 
 * @param accountId User's account ID
 * @param service Google service name
 * @param scopeLevel Level of access required
 * @returns Promise resolving to an OAuth2 client and a boolean indicating if scope is valid
 */
export const createGoogleClientWithScopeCheck = async (
    accountId: string,
    service: GoogleServiceName,
    scopeLevel: string,
    redirectUrl?: string
): Promise<{ client: Auth.OAuth2Client, hasScope: boolean }> => {
    try {
        // Validate and refresh token
        const tokenDetails = await validateAndRefreshToken(accountId, OAuthProviders.Google);

        // Create the OAuth client
        const oauth2Client = createOAuth2Client(
            tokenDetails.accessToken,
            tokenDetails.refreshToken,
            redirectUrl
        );

        // Get the required scope using the safe method
        const requiredScope = getGoogleScope(service, scopeLevel);

        // Check if the token has the required scope
        const hasScope = await hasRequiredScope(tokenDetails.accessToken, requiredScope);

        return { client: oauth2Client, hasScope };
    } catch (error) {
        console.error('Error creating Google API client with scope check:', error);
        throw new Error('Failed to create Google API client');
    }
};