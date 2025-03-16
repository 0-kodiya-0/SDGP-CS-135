import db from "../../config/db";
import { OAuthProviders } from "../account/Account.types";
import { OAuthState, SignInState, SignUpState } from "./Auth.types";

export const validateOAuthState = (state: string, provider: OAuthProviders): OAuthState | null => {
    const stateData = db.data.oauthStates.find(s =>
        s.state === state &&
        s.provider === provider &&
        new Date(s.expiresAt) > new Date()
    );

    if (stateData) {
        return stateData;
    }

    return null;
};

export const validateSignInState = (state: string): SignInState | null => {
    const stateData = db.data.signInStates.find(s =>
        s.state === state &&
        new Date(s.expiresAt) > new Date()
    );

    if (stateData) {
        return stateData;
    }

    return null;
};

export const validateSignUpState = (state: string): SignUpState | null => {
    const stateData = db.data.signUpStates.find(s =>
        s.state === state &&
        new Date(s.expiresAt) > new Date()
    );

    if (stateData) {
        return stateData;
    }

    return null;
};