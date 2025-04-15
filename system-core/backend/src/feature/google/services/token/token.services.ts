import { google } from 'googleapis';
import { ScopeToServiceMap } from '../../config/config';
import { TokenInfo, TokenScopeInfo } from './token.types';
import { ProviderValidationError } from '../../../../types/response.types';
import { OAuthProviders } from '../../../account/Account.types';

/**
     * Get detailed token information from Google
     * @param accessToken The access token to check
     */
export async function getTokenInfo(accessToken: string) {
    try {
        // Get token info from Google's token info endpoint
        const tokenInfoResult = await google.oauth2('v2').tokeninfo({
            access_token: accessToken
        });

        return tokenInfoResult.data;
    } catch (error) {
        console.error('Error getting token info:', error);
        throw new ProviderValidationError(OAuthProviders.Google, 'Error getting token info');
    }
}

/**
     * Get detailed scope information from a token
     * @param accessToken The access token to analyze
     */
export async function getTokenScopes(accessToken: string): Promise<TokenScopeInfo> {
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
        throw new ProviderValidationError(OAuthProviders.Google, 'Failed to get token scope information');
    }
}

/**
     * Refresh an access token using a refresh token
     * @param refreshToken The refresh token to use
     */
export async function refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
    try {
        const refreshClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        refreshClient.setCredentials({
            refresh_token: refreshToken
        });

        const { credentials } = await refreshClient.refreshAccessToken();

        return {
            accessToken: credentials.access_token || '',
            refreshToken: credentials.refresh_token || refreshToken,
            scope: credentials.scope || ''
        };
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw new ProviderValidationError(OAuthProviders.Google, 'Failed to refresh access token');
    }
}

 /**
     * Check if a token has access to a specific scope
     * @param accessToken The token to check
     * @param requiredScope The scope to check for
     */
export async function hasScope(accessToken: string, requiredScope: string): Promise<boolean> {
    try {
        const tokenInfo = await getTokenInfo(accessToken);
        const grantedScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
        return grantedScopes.includes(requiredScope);
    } catch (error) {
        console.error('Error checking token scope:', error);
        return false;
    }
}

/**
 * Checks if the access token has expired.
 * @param expiresIn Number of seconds until the token expires.
 * @param issuedAt The time (in milliseconds) when the token was issued.
 * @returns True if the token is expired, false otherwise.
 */
export function isAccessTokenExpired(expiresIn: number, issuedAt: number): boolean {
    const currentTime = Date.now(); // current time in milliseconds
    const expiryTime = issuedAt + expiresIn * 1000; // convert seconds to ms
    return currentTime >= expiryTime;
}