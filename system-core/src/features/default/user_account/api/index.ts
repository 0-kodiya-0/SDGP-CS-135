import { api } from '../../../../api/client.ts';
import {
    OAuthProviders,
    TokenDetails
} from '../types/data.types.ts';

// Initiate sign-up with a specific OAuth provider
export const initiateSignUp = async (
    provider: OAuthProviders
): Promise<string> => {
    // This will redirect to /signup/:provider which handles the OAuth flow
    const response = await api.get<{ state: string }>(`/signup/${provider}`);
    return response.data.state;
};

// Initiate sign-in with a specific OAuth provider
export const initiateSignIn = async (
    provider: OAuthProviders
): Promise<string> => {
    // This will redirect to /signin/:provider which handles the OAuth flow
    const response = await api.get<{ state: string }>(`/signin/${provider}`);
    return response.data.state;
};

// Process sign-up completion (after OAuth provider redirects back)
export interface SignUpResponse {
    accountDetails: {
        device: any;
    };
    oAuthResponse: {
        provider: OAuthProviders;
        name: string;
        email: string;
        imageUrl?: string;
        tokenDetails: TokenDetails;
    };
    state: string;
}

export const completeSignUp = async (state: string): Promise<SignUpResponse> => {
    const response = await api.get<SignUpResponse>(`/signup?state=${state}`);
    return response.data;
};

// Add device details to sign-up flow
export const addSignUpDeviceDetails = async (
    state: string,
    deviceDetails: any
): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
        `/signup/add/device?state=${state}`,
        deviceDetails
    );
    return response.data;
};