import { OAuthProviders } from "../account/Account.types";
import { OAuthState, PermissionState, SignInState, SignUpState } from "./Auth.types";
import { getOAuthState, getSignInState, getSignUpState, getPermissionState } from "./Auth.cache";

/**
 * Validates an OAuth state for a specific provider
 */
export const validateOAuthState = async (state: string, provider: OAuthProviders): Promise<OAuthState | null> => {
    if (!state) return null;
    
    const oauthState = getOAuthState(state, provider);
    
    if (!oauthState) {
        return null;
    }
    
    // Check if state has expired
    if (new Date(oauthState.expiresAt) < new Date()) {
        return null;
    }
    
    return oauthState;
};

/**
 * Validates a permission state
 */
export const validatePermissionState = async (state: string): Promise<PermissionState | null> => {
    if (!state) return null;
    
    const permissionState = getPermissionState(state);
    
    if (!permissionState) {
        return null;
    }
    
    // Check if state has expired
    if (new Date(permissionState.expiresAt) < new Date()) {
        return null;
    }
    
    return permissionState;
};

/**
 * Validates a sign-in state
 */
export const validateSignInState = async (state: string): Promise<SignInState | null> => {
    if (!state) return null;
    
    const signInState = getSignInState(state);
    
    if (!signInState) {
        return null;
    }
    
    // Check if state has expired
    if (new Date(signInState.expiresAt) < new Date()) {
        return null;
    }
    
    return signInState;
};

/**
 * Validates a sign-up state
 */
export const validateSignUpState = async (state: string): Promise<SignUpState | null> => {
    if (!state) return null;
    
    const signUpState = getSignUpState(state);
    
    if (!signUpState) {
        return null;
    }
    
    // Check if state has expired
    if (new Date(signUpState.expiresAt) < new Date()) {
        return null;
    }
    
    return signUpState;
};