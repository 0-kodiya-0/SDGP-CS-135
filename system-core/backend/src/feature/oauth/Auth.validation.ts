import { OAuthProviders } from "../account/Account.types";
import { OAuthState, SignInState, SignUpState } from "./Auth.types";
import { getOAuthState, getSignInState, getSignUpState } from "./Auth.cache";

export const validateOAuthState = async (state: string, provider: OAuthProviders): Promise<OAuthState | null> => {
    return getOAuthState(state, provider);
};

export const validateSignInState = async (state: string): Promise<SignInState | null> => {
    return getSignInState(state);
};

export const validateSignUpState = async (state: string): Promise<SignUpState | null> => {
    return getSignUpState(state);
};