import {
    OAuthProviders,
    Device,
    LocalAccount,
    OAuthAccount,
    BaseAccount,
    UserDetails,
    TokenDetails
} from './types.data.ts'

export interface AccountState {
    localAccount: LocalAccount | null;
    oauthAccounts: OAuthAccount[];
    activeAccount: OAuthAccount | LocalAccount | null;

    // Local account actions
    createLocalAccount: (params: {
        device: Device;
        password: string;
        userDetails: UserDetails;
    }) => LocalAccount | null;
    updateLocalAccount: (updates: Partial<Omit<LocalAccount, 'security' | 'accountType'>> & { password?: string }) => void;
    deleteLocalAccount: () => void;

    // OAuth account actions
    addOAuthAccount: (params: {
        device: Device;
        provider: OAuthProviders;
        userDetails: UserDetails;
        tokenDetails: TokenDetails;
    }) => boolean;
    updateOAuthAccount: (accountId: number, updates: Partial<Omit<OAuthAccount, 'accountType'>>) => void;
    removeOAuthAccount: (accountId: number) => void;

    // General actions
    setActiveAccount: (accountId: OAuthAccount | LocalAccount | null) => void;
    getAccountById: (accountId: number) => BaseAccount | null;

    // Helper methods
    canAddMoreOAuthAccounts: () => boolean;
    getTotalAccounts: () => number;
}