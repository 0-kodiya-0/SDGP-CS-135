import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { fetchAccountDetails } from '../utils/account.utils';
import { Account, AccountDetails } from '../types/types.data';
import { useTokenApi } from '../hooks/useToken.google';

interface TokenData {
    expiresAt?: string;
    expiresIn?: number;
    scope?: string;
}

interface AccountContextType {
    currentAccount: Account | null;
    accountDetails: AccountDetails | null;
    tokenData: TokenData | null;
    isLoading: boolean;
    error: string | null;
    fetchAccountDetails: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accountId } = useParams<{ accountId: string }>();
    const navigate = useNavigate();
    const { session, isAuthenticated, isLoading: authLoading } = useAuth();
    const { getTokenInfo, refreshToken: refreshTokenApi } = useTokenApi();

    const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Find the current account from the session
    const currentAccount: Account | null = session?.accounts?.find(
        account => account.accountId === accountId
    ) || null;

    // Fetch account details when the account ID changes
    useEffect(() => {
        if (accountId && isAuthenticated && !authLoading) {
            console.log("AccountContext: Fetching account details for:", accountId);
            fetchAccountDetailsFromAPI();
        } else {
            setIsLoading(false);
            setAccountDetails(null);
        }
    }, [accountId, isAuthenticated, authLoading]);

    // Fetch token information when account is loaded
    useEffect(() => {
        const fetchTokenInfo = async () => {
            if (!accountId || !accountDetails) return;
            
            try {
                const tokenInfo = await getTokenInfo(accountId);
                if (tokenInfo) {
                    setTokenData({
                        expiresAt: tokenInfo.tokenInfo.expiresAt,
                        expiresIn: tokenInfo.tokenInfo.expiresIn,
                        scope: tokenInfo.scopes.granted.map(g => g.scope).join(' ')
                    });
                }
            } catch (error) {
                console.error('Error fetching token info:', error);
            }
        };

        fetchTokenInfo();
    }, [accountId, accountDetails]);

    // Redirect if the account doesn't exist in the session
    useEffect(() => {
        if (!authLoading && isAuthenticated && !currentAccount && accountId) {
            console.log("AccountContext: Account not found in session, redirecting...");
            setError('You do not have access to this account');

            if (session?.accounts?.length) {
                // If there's a selected account, use that
                if (session.selectedAccountId) {
                    navigate(`/app/${session.selectedAccountId}`);
                } else {
                    // Otherwise use the first account
                    navigate(`/app/${session.accounts[0].accountId}`);
                }
            } else {
                navigate('/login');
            }
        }
    }, [currentAccount, accountId, isAuthenticated, authLoading, session, navigate]);

    const fetchAccountDetailsFromAPI = async () => {
        if (!accountId) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetchAccountDetails(accountId);

            if (response.success) {
                const details = response.data;

                // Format the account details with proper typing
                setAccountDetails({
                    id: details.id,
                    name: details.userDetails?.name || 'User',
                    email: details.userDetails?.email || '',
                    imageUrl: details.userDetails?.imageUrl || '',
                    provider: details.provider,
                    status: details.status,
                    created: details.created,
                    updated: details.updated,
                    security: details.security || {
                        twoFactorEnabled: false,
                        sessionTimeout: 30,
                        autoLock: false
                    },
                    tokenDetails: details.tokenDetails
                });
            } else {
                console.error("API returned success: false", response);
                setError('Failed to load account details');
            }
        } catch (error) {
            console.error('Error fetching account details:', error);
            setError('Failed to load account details');
        } finally {
            setIsLoading(false);
        }
    };

    // Wrapper for token refresh API
    const refreshTokenHandler = async (): Promise<boolean> => {
        if (!accountId) return false;
        
        try {
            setIsLoading(true);
            const success = await refreshTokenApi(accountId);
            
            if (success) {
                // Re-fetch token info to update the UI
                const tokenInfo = await getTokenInfo(accountId);
                if (tokenInfo) {
                    setTokenData({
                        expiresAt: tokenInfo.tokenInfo.expiresAt,
                        expiresIn: tokenInfo.tokenInfo.expiresIn,
                        scope: tokenInfo.scopes.granted.map(g => g.scope).join(' ')
                    });
                }
            }
            
            return success;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        currentAccount,
        accountDetails,
        tokenData,
        isLoading,
        error,
        fetchAccountDetails: fetchAccountDetailsFromAPI,
        refreshToken: refreshTokenHandler
    };

    return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const useAccount = (): AccountContextType => {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error('useAccount must be used within an AccountProvider');
    }
    return context;
};