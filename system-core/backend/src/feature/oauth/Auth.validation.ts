import db from "../../config/db";
import { OAuthProviders } from "../account/Account.types";
import { OAuthState, SignInState, SignUpState } from "./Auth.types";
import { toOAuthState, toSignInState, toSignUpState } from "./Auth.helpers";

export const validateOAuthState = async (state: string, provider: OAuthProviders): Promise<OAuthState | null> => {
    const models = await db.getModels();
    
    const stateData = await models.auth.OAuthState.findOne({
        state: state,
        provider: provider,
        expiresAt: { $gt: new Date() }
    }).lean();

    return toOAuthState(stateData);
};

export const validateSignInState = async (state: string): Promise<SignInState | null> => {
    const models = await db.getModels();
    
    const stateData = await models.auth.SignInState.findOne({
        state: state,
        expiresAt: { $gt: new Date() }
    }).lean();

    return toSignInState(stateData);
};

export const validateSignUpState = async (state: string): Promise<SignUpState | null> => {
    const models = await db.getModels();
    
    const stateData = await models.auth.SignUpState.findOne({
        state: state,
        expiresAt: { $gt: new Date() }
    }).lean();

    return toSignUpState(stateData);
};