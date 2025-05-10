import { ProviderValidationError } from '../../../types/response.types';
import { OAuthProviders } from '../../account/Account.types';

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
        throw new ProviderValidationError(OAuthProviders.Google, `Invalid Google service: ${service}`);
    }

    // Get the scopes for this service
    const serviceScopes = GoogleScopes[service];

    // Check if the scope level exists for this service
    if (!serviceScopes[scopeLevel as keyof typeof serviceScopes]) {
        throw new ProviderValidationError(OAuthProviders.Google, `Invalid scope level '${scopeLevel}' for service '${service}'`);
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

// /**
//  * Check if the token has the required scope
//  * 
//  * @param token Access token to check
//  * @param requiredScope The scope to check for
//  * @returns Promise that resolves to true if scope is included, false otherwise
//  */
// export const hasRequiredScope = async (token: string, requiredScope: string): Promise<boolean> => {
//     try {
//         // Use the tokeninfo endpoint to get information about the token
//         const response = await google.oauth2('v2').tokeninfo({
//             access_token: token
//         });

//         if (!response.data.scope) {
//             return false;
//         }

//         // The scope string contains space-separated scopes
//         const grantedScopes = response.data.scope.split(' ');
//         return grantedScopes.includes(requiredScope);
//     } catch (error) {
//         console.error('Error checking token scopes:', error);
//         return false;
//     }
// };