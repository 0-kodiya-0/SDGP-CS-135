import db from "../../config/db";
import { OAuthProviders } from "../account/Account.types";
import { AuthType, OAuthState, ProviderResponse, SignInState, SignUpState } from "./Auth.types";
import crypto from "crypto";

export const generateOAuthState = async (provider: OAuthProviders, authType: AuthType): Promise<string> => {
    const models = await db.getModels();
    
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const stateData: OAuthState = {
        state,
        provider,
        authType,
        expiresAt: expiresAt.toISOString(),
    };

    await models.auth.OAuthState.create({
        ...stateData,
        expiresAt
    });

    return state;
};

export const generateSignupState = async (providerResponse: ProviderResponse): Promise<string> => {
    const models = await db.getModels();
    
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const stateData: SignUpState = {
        state,
        accountDetails: {},
        oAuthResponse: providerResponse,
        expiresAt: expiresAt.toISOString(),
    };

    await models.auth.SignUpState.create({
        ...stateData,
        expiresAt
    });

    return state;
};

export const generateSignInState = async (providerResponse: ProviderResponse): Promise<string> => {
    const models = await db.getModels();
    
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const stateData: SignInState = {
        state,
        oAuthResponse: providerResponse,
        expiresAt: expiresAt.toISOString(),
    };

    await models.auth.SignInState.create({
        ...stateData,
        expiresAt
    });

    return state;
};

export const clearOAuthState = async (state: string): Promise<void> => {
    const models = await db.getModels();
    await models.auth.OAuthState.deleteOne({ state });
};

export const clearSignUpState = async (state: string): Promise<void> => {
    const models = await db.getModels();
    await models.auth.SignUpState.deleteOne({ state });
};

export const clearSignInState = async (state: string): Promise<void> => {
    const models = await db.getModels();
    await models.auth.SignInState.deleteOne({ state });
};

export const clearExpiredStates = async (): Promise<void> => {
    const models = await db.getModels();
    const now = new Date();
    
    const results = await Promise.all([
        models.auth.OAuthState.deleteMany({ expiresAt: { $lt: now } }),
        models.auth.SignUpState.deleteMany({ expiresAt: { $lt: now } }),
        models.auth.SignInState.deleteMany({ expiresAt: { $lt: now } })
    ]);
    
    console.log(`Cleared expired states: ${results[0].deletedCount + results[1].deletedCount + results[2].deletedCount} records removed`);
};