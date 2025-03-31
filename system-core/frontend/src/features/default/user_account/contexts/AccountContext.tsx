import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
// import { fetchAccountDetails } from '../utils/account.utils';
import { Account, AccountDetails } from '../types/types.data';
import { useTokenApi } from '../hooks/useToken.google';
import axios from 'axios';
import { API_BASE_URL, ApiResponse } from '../../../../conf/axios';

interface TokenData {
    expiresAt?: string;
    expiresIn?: number;
    scope?: string;
}

interface AccountContextType {
    currentAccount: Account | null;
    // accountDetails: AccountDetails | null;
    tokenData: TokenData | null;
    isLoading: boolean;
    error: string | null;
    fetchAccountDetails: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Function to fetch a single account's data
// const fetchSingleAccount = async (accountId: string): Promise<Account | null> => {
//     try {
//         const response = await axios.get<ApiResponse<Account>>(
//             `${API_BASE_URL}/account/${accountId}`,
//             { withCredentials: true }
//         );

//         if (response.data.success && response.data.data) {
//             return response.data.data;
//         } else {
//             console.error('Failed to fetch account data:', response.data.error);
//             return null;
//         }
//     } catch (err) {
//         console.error('Account data retrieval failed:', err);
//         return null;
//     }
// };

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accountId } = useParams<{ accountId: string }>();
    const navigate = useNavigate();
    const { accountIds, isAuthenticated, isLoading: authLoading } = useAuth();
    const { getTokenInfo, refreshToken: refreshTokenApi } = useTokenApi();

    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
    // const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch the current account when accountId changes
    useEffect(() => {
        const loadAccountData = async () => {
            if (!accountId || !isAuthenticated || authLoading) {
                setCurrentAccount(null);
                return;
            }

            setIsLoading(true);

            try {
                // Check if this accountId is in the available accounts
                // if (!accountIds.includes(accountId)) {
                //     console.log("AccountContext: Account not found in available accounts, redirecting...");
                //     setError('You do not have access to this account');

                //     if (accountIds.length > 0) {
                //         navigate(`/app/${accountIds[0]}`);
                //     } else {
                //         navigate('/login');
                //     }
                //     return;
                // }

                // Fetch the account data


                await fetchAccountDetails();

                const tokenInfo = await getTokenInfo(accountId);
                if (tokenInfo) {
                    setTokenData({
                        expiresAt: tokenInfo.tokenInfo.expiresAt,
                        expiresIn: tokenInfo.tokenInfo.expiresIn,
                        scope: tokenInfo.scopes.granted.map(g => g.scope).join(' ')
                    });
                }
            } catch (err) {
                console.error('Error loading account data:', err);
                setError('Failed to load account data');
            } finally {
                setIsLoading(false);
            }
        };

        loadAccountData();
    }, [accountId, isAuthenticated, authLoading]);

    // Fetch token information when account is loaded
    // useEffect(() => {
    //     const fetchTokenInfo = async () => {
    //         if (!accountId || !accountDetails) return;

    //         try {

    //         } catch (error) {
    //             console.error('Error fetching token info:', error);
    //         }
    //     };

    //     fetchTokenInfo();
    // }, [accountId, accountDetails]);

    const fetchAccountDetails = async () => {
        if (!accountId) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.get<ApiResponse<Account>>(
                `${API_BASE_URL}/account/${accountId}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const account = response.data.data;
                setCurrentAccount(account);
            } else {
                console.error("API returned success: false");
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
        // accountDetails,
        tokenData,
        isLoading,
        error,
        fetchAccountDetails,
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