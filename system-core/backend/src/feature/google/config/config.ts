import { google, Auth } from 'googleapis';
import { OAuthProviders } from '../../account/Account.types';
import { validateAndRefreshToken } from '../../../utils/session';

/**
 * Define scopes for different Google services
 * Reference: https://developers.google.com/identity/protocols/oauth2/scopes
 */
export const GoogleScopes = {
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
 * Create an authenticated Google API client for the requested service
 * This function ensures the token is valid before creating the client
 * 
 * @param accountId User's account ID
 * @param serviceName Name of the Google service to access
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