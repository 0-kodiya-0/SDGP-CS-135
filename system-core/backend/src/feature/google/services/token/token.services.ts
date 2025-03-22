import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { TokenDetails } from '../../../account/Account.types';
import { GoogleAuthClient } from '../../config/client';
import { ScopeToServiceMap } from '../../config/config';
import { TokenInfo, TokenScopeInfo } from './token.types';

export class GoogleTokenService {
    private static instance: GoogleTokenService;
    private client: OAuth2Client;

    private constructor() {
        this.client = GoogleAuthClient.getInstance().getBaseClient();
    }

    public static getInstance(): GoogleTokenService {
        if (!GoogleTokenService.instance) {
            GoogleTokenService.instance = new GoogleTokenService();
        }
        return GoogleTokenService.instance;
    }

    /**
     * Get detailed token information from Google
     * @param accessToken The access token to check
     */
    public async getTokenInfo(accessToken: string): Promise<TokenInfo> {
        try {
            // Get token info from Google's tokeninfo endpoint
            const tokenInfoResult = await google.oauth2('v2').tokeninfo({
                access_token: accessToken
            });

            return {
                accessToken,
                expiresAt: Date.now() + (Number(tokenInfoResult.data.expires_in || 3600) * 1000),
                scope: tokenInfoResult.data.scope || '',
                email: tokenInfoResult.data.email || undefined,
                verified: tokenInfoResult.data.verified_email || undefined
            };
        } catch (error) {
            console.error('Error getting token info:', error);
            // Return a default expiration (1 hour from now) if we can't get the actual info
            return {
                accessToken,
                expiresAt: Date.now() + (3600 * 1000),
                scope: ''
            };
        }
    }

    /**
     * Get detailed scope information from a token
     * @param accessToken The access token to analyze
     */
    public async getTokenScopes(accessToken: string): Promise<TokenScopeInfo> {
        try {
            // Get token info
            const tokenInfoResult = await google.oauth2('v2').tokeninfo({
                access_token: accessToken
            });

            // Parse granted scopes
            const grantedScopes = tokenInfoResult.data.scope ? tokenInfoResult.data.scope.split(' ') : [];

            // Map scopes to services and levels
            const scopeDetails = grantedScopes.map(scope => {
                const serviceInfo = ScopeToServiceMap.get(scope);
                return {
                    scope,
                    service: serviceInfo?.service || 'unknown',
                    level: serviceInfo?.level || 'unknown'
                };
            });

            // Determine which services are accessible
            const serviceAccess = {
                gmail: false,
                calendar: false,
                drive: false,
                people: false,
                meet: false
            };

            // Check each service
            scopeDetails.forEach(detail => {
                if (detail.service in serviceAccess) {
                    serviceAccess[detail.service as keyof typeof serviceAccess] = true;
                }
            });

            return {
                granted: scopeDetails,
                serviceAccess
            };
        } catch (error) {
            console.error('Error getting token scopes:', error);
            throw new Error('Failed to get token scope information');
        }
    }

    /**
     * Refresh an access token using a refresh token
     * @param refreshToken The refresh token to use
     */
    public async refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
        try {
            this.client.setCredentials({
                refresh_token: refreshToken
            });

            const { credentials } = await this.client.refreshAccessToken();

            return {
                accessToken: credentials.access_token || '',
                refreshToken: credentials.refresh_token || refreshToken,
                expiresAt: Date.now() + (credentials.expiry_date || 3600 * 1000),
                scope: credentials.scope || ''
            };
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * Convert TokenDetails to TokenInfo format
     * @param tokenDetails The token details to convert
     */
    public async tokenDetailsToInfo(tokenDetails: TokenDetails): Promise<TokenInfo> {
        // If we already have token details but no expiration info, get it from Google
        if (tokenDetails.accessToken) {
            return this.getTokenInfo(tokenDetails.accessToken);
        }

        // If we have a refresh token but no access token, refresh it
        if (tokenDetails.refreshToken) {
            return this.refreshAccessToken(tokenDetails.refreshToken);
        }

        throw new Error('No valid token information available');
    }

    /**
     * Check if a token has access to a specific scope
     * @param accessToken The token to check
     * @param requiredScope The scope to check for
     */
    public async hasScope(accessToken: string, requiredScope: string): Promise<boolean> {
        try {
            const tokenInfo = await this.getTokenInfo(accessToken);
            const grantedScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
            return grantedScopes.includes(requiredScope);
        } catch (error) {
            console.error('Error checking token scope:', error);
            return false;
        }
    }
}