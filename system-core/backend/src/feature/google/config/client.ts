// google-auth.util.ts
import { google, Auth } from 'googleapis';

/**
 * GoogleAuthClient singleton utility
 * Provides methods to get Google OAuth2 client instances
 */
export class GoogleAuthClient {
    private static instance: GoogleAuthClient;
    private baseClient: Auth.OAuth2Client;

    private constructor() {
        // Create the base client with application credentials
        this.baseClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): GoogleAuthClient {
        if (!GoogleAuthClient.instance) {
            GoogleAuthClient.instance = new GoogleAuthClient();
        }
        return GoogleAuthClient.instance;
    }

    /**
     * Get a base client without credentials
     * Use this when you just need the client ID and secret, but not user tokens
     */
    public getBaseClient(): Auth.OAuth2Client {
        return this.baseClient;
    }

    /**
     * Get a client with access token set
     * Creates a new instance with the same client ID/secret but with user tokens
     * 
     * @param accessToken User's access token
     * @param refreshToken Optional refresh token
     */
    public getClientWithToken(accessToken: string, refreshToken?: string): Auth.OAuth2Client {
        // Set credentials
        this.baseClient.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        return this.baseClient;
    }
}