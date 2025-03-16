import db from "../../config/db";
import { OAuthProviders } from "../account/Account.types";
import { AuthType, OAuthState, ProviderResponse, SignInState, SignUpState } from "./Auth.types";
import crypto from "crypto";

export const generateOAuthState = async (provider: OAuthProviders, authType: AuthType) => {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const stateData: OAuthState = {
        state,
        provider,
        authType,
        expiresAt,
    };

    db.data.oauthStates.push(stateData);

    await db.write();
    return state;
};

export const generateSignupState = async (providerResponse: ProviderResponse) => {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const stateData: SignUpState = {
        state,
        accountDetails: {},
        oAuthResponse: providerResponse,
        expiresAt,
    };

    db.data.signUpStates.push(stateData);

    await db.write();
    return state;
};

export const generateSignInState = async (providerResponse: ProviderResponse) => {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const stateData: SignInState = {
        state,
        oAuthResponse: providerResponse,
        expiresAt,
    };

    db.data.signInStates.push(stateData);

    await db.write();
    return state;
};

export const clearOAuthState = async (state: string) => {
    db.data.oauthStates = db.data.oauthStates.filter((s: OAuthState) => s.state !== state);
    await db.write();
};

export const clearSignUpState = async (state: string) => {
    db.data.signUpStates = db.data.signUpStates.filter((s: SignUpState) => s.state !== state);
    await db.write();
};

export const clearSignInState = async (state: string) => {
    db.data.signInStates = db.data.signInStates.filter((s: SignInState) => s.state !== state);
    await db.write();
};

export const clearExpiredStates = async () => {
    const now = new Date().toISOString();
    
    db.data.oauthStates = db.data.oauthStates.filter((s: OAuthState) => s.expiresAt > now);
    db.data.signUpStates = db.data.signUpStates.filter((s: SignUpState) => s.expiresAt > now);
    db.data.signInStates = db.data.signInStates.filter((s: SignInState) => s.expiresAt > now);
    
    await db.write();
};
