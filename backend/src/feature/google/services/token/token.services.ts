import { google } from 'googleapis';
import { ScopeToServiceMap } from '../../config/config';
import { TokenScopeInfo } from './token.types';
import { ProviderValidationError } from '../../../../types/response.types';
import { OAuthProviders } from '../../../account/Account.types';
import db from '../../../../config/db';

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
        throw new ProviderValidationError(OAuthProviders.Google, 'Failed to get token scope information', undefined);
    }
}

/**
 * Update Google permissions for an account (replaces updateAccountScopes)
 * @param accountId The account ID to update
 * @param accessToken The access token containing scopes
 */
export async function updateAccountScopes(accountId: string, accessToken: string): Promise<string[]> {
    try {
        // Get token info for scopes
        const tokenInfoResult = await google.oauth2('v2').tokeninfo({
            access_token: accessToken
        });

        // Parse granted scopes
        const grantedScopes = tokenInfoResult.data.scope ? tokenInfoResult.data.scope.split(' ') : [];
        
        if (grantedScopes.length === 0) {
            return [];
        }

        // Get database models
        const models = await db.getModels();
        
        // Check if permissions already exist
        const existingPermissions = await models.google.GooglePermissions.findOne({ accountId });
        
        if (existingPermissions) {
            // Update existing permissions only if new scopes are granted
            const existingScopeSet = new Set(existingPermissions.scopes);
            const newScopes = grantedScopes.filter(scope => !existingScopeSet.has(scope));
            
            if (newScopes.length > 0) {
                existingPermissions.addScopes(newScopes);
                await existingPermissions.save();
            }
        } else {
            // Create new permissions record
            await models.google.GooglePermissions.create({
                accountId,
                scopes: grantedScopes,
                lastUpdated: new Date().toISOString()
            });
        }

        return grantedScopes;
    } catch (error) {
        console.error('Error updating account scopes:', error);
        throw new ProviderValidationError(OAuthProviders.Google, 'Failed to update account scopes');
    }
}

/**
 * Get all previously granted scopes for an account from GooglePermissions
 * @param accountId The account ID to check
 */
export async function getAccountScopes(accountId: string): Promise<string[]> {
    try {
        // Get database models
        const models = await db.getModels();
        
        // Retrieve the permissions
        const permissions = await models.google.GooglePermissions.findOne({ accountId });

        if (!permissions) {
            return [];
        }

        return permissions.scopes;
    } catch (error) {
        console.error('Error getting account scopes:', error);
        return [];
    }
}

/**
* Refresh an access token using a refresh token
* @param refreshToken The refresh token to use
*/
export async function refreshGoogleToken(refreshToken: string) {
    try {
        const refreshClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        refreshClient.setCredentials({ refresh_token: refreshToken });

        const { credentials } = await refreshClient.refreshAccessToken();

        if (!credentials.access_token || !credentials.expiry_date) {
            throw new ProviderValidationError(
                OAuthProviders.Google,
                'Missing required token details'
            );
        }

        return credentials;
    } catch (error) {
        console.error('Error refreshing access token:', error);

        // Avoid wrapping the same error again
        if (error instanceof ProviderValidationError) {
            throw error;
        }

        throw new ProviderValidationError(
            OAuthProviders.Google,
            'Failed to refresh access token'
        );
    }
}

/**
 * Revoke an access token and optionally a refresh token
 * @param accessToken The access token to revoke
 * @param refreshToken Optional refresh token to revoke
 */
export async function revokeTokens(accessToken: string, refreshToken?: string) {
    try {
        // Create OAuth2 client for revoking tokens
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        // Revoke access token
        const results = {
            accessTokenRevoked: false,
            refreshTokenRevoked: false
        };

        try {
            await oAuth2Client.revokeToken(accessToken);
            results.accessTokenRevoked = true;
        } catch (error) {
            console.error('Error revoking access token:', error);
        }

        // Revoke refresh token if provided
        if (refreshToken) {
            try {
                await oAuth2Client.revokeToken(refreshToken);
                results.refreshTokenRevoked = true;
            } catch (error) {
                console.error('Error revoking refresh token:', error);
            }
        }

        // Check if at least one token was revoked successfully
        if (!results.accessTokenRevoked && !results.refreshTokenRevoked) {
            throw new ProviderValidationError(
                OAuthProviders.Google,
                'Failed to revoke tokens'
            );
        }

        return results;
    } catch (error) {
        console.error('Error during token revocation:', error);
        
        // Avoid wrapping the same error again
        if (error instanceof ProviderValidationError) {
            throw error;
        }
        
        throw new ProviderValidationError(
            OAuthProviders.Google,
            'Failed to revoke tokens'
        );
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

/**
 * Helper function to check if a user has additional scopes in GooglePermissions
 * that aren't included in their current access token
 */
export async function checkForAdditionalScopes(accountId: string, accessToken: string): Promise<{
    needsAdditionalScopes: boolean,
    missingScopes: string[]
}> {
    // Get scopes from the current token
    const tokenInfo = await getTokenInfo(accessToken);
    const currentScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
    
    // Get previously granted scopes from GooglePermissions
    const storedScopes = await getAccountScopes(accountId);
    
    // Only care about missing scopes that aren't the basic profile and email
    const filteredStoredScopes = storedScopes.filter(scope => 
        !scope.includes('auth/userinfo.email') && 
        !scope.includes('auth/userinfo.profile')
    );
    
    // Find scopes that are in GooglePermissions but not in the current token
    const missingScopes = filteredStoredScopes.filter(scope => !currentScopes.includes(scope));
    
    return {
        needsAdditionalScopes: missingScopes.length > 0,
        missingScopes
    };
}

/**
 * Verifies that the token belongs to the correct user account
 * 
 * @param accessToken The access token to verify
 * @param accountId The account ID that should own this token
 * @returns Object indicating if the token is valid and reason if not
 */
export async function verifyTokenOwnership(
    accessToken: string,
    accountId: string
): Promise<{ isValid: boolean; reason?: string }> {
    try {
        // Get the models
        const models = await db.getModels();

        // Get the account that should own this token
        const account = await models.accounts.Account.findOne({ _id: accountId });

        if (!account) {
            return { isValid: false, reason: 'Account not found' };
        }

        // Get the email from the account
        const expectedEmail = account.userDetails.email;

        if (!expectedEmail) {
            return { isValid: false, reason: 'Account missing email' };
        }

        // Get user information from the token
        const googleAuth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        googleAuth.setCredentials({ access_token: accessToken });

        // Get the user info using the oauth2 API
        const oauth2 = google.oauth2({
            auth: googleAuth,
            version: 'v2'
        });

        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            return { isValid: false, reason: 'Could not get email from token' };
        }

        // Compare emails
        if (userInfo.data.email.toLowerCase() !== expectedEmail.toLowerCase()) {
            return {
                isValid: false,
                reason: `Token email (${userInfo.data.email}) does not match account email (${expectedEmail})`
            };
        }

        return { isValid: true };
    } catch (error) {
        console.error('Error verifying token ownership:', error);
        return { isValid: false, reason: 'Error verifying token ownership' };
    }
}