// feature/default/user_account/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../conf/axios';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    accountIds: string[];
    error: string | null;
    logout: (accountId?: string) => Promise<void>;
    logoutAll: () => Promise<void>;
    refreshAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AccountsResponse {
    data: {
        accounts: string[];
    }
}

// Function to fetch account IDs from the API
const fetchAccountIds = async (): Promise<string[] | null> => {
    try {
        const response = await axios.get<AccountsResponse>(
            `${API_BASE_URL}/account`,
            { withCredentials: true }
        );

        if (response.data.data.accounts) {
            console.log("Successfully fetched accounts");
            return response.data.data.accounts;
        } else {
            console.error('Failed to fetch accounts');
            return null;
        }
    } catch (err) {
        console.error('Account retrieval failed:', err);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [accountIds, setAccountIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Initial accounts fetch
    useEffect(() => {
        const initializeAccounts = async () => {
            try {
                const accounts = await fetchAccountIds();
                console.log(accounts)
                setAccountIds(accounts || []);
            } catch (err) {
                console.error('Error initializing accounts:', err);
                setError('Failed to initialize accounts');
            } finally {
                setIsLoading(false);
            }
        };

        initializeAccounts();
    }, []);

    // Set up periodic account check
    // useEffect(() => {
    //     const checkAccounts = async () => {
    //         try {
    //             const updatedAccounts = await fetchAccountIds();
                
    //             // Only update state if the accounts have changed
    //             if (updatedAccounts && JSON.stringify(updatedAccounts) !== JSON.stringify(accountIds)) {
    //                 setAccountIds(updatedAccounts);
    //             }
    //         } catch (err) {
    //             console.error('Error checking accounts:', err);
    //         }
    //     };

    //     // Check accounts every minute
    //     const intervalId = setInterval(checkAccounts, 60000);

    //     return () => clearInterval(intervalId);
    // }, [accountIds]);

    // Manual function to refresh the accounts data
    const refreshAccounts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const accounts = await fetchAccountIds();
            setAccountIds(accounts || []);
        } catch (err) {
            console.error('Accounts refresh failed:', err);
            setError('Failed to refresh accounts');
        } finally {
            setIsLoading(false);
        }
    };

    // Logout from a specific account
    const logout = async (accountId?: string) => {
        try {
            setIsLoading(true);
            if (accountId) {
                window.location.href = `/api/v1/account/${accountId}/logout`;
            }
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout');
        } finally {
            setIsLoading(false);
        }
    };

    // Logout from all accounts
    const logoutAll = async () => {
        try {
            setIsLoading(true);
            window.location.href = "/api/v1/account/logout/all";
        } catch (error) {
            console.error('Logout all failed:', error);
            setError('Failed to logout from all accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        isAuthenticated: accountIds.length > 0,
        isLoading,
        accountIds,
        error,
        logout,
        logoutAll,
        refreshAccounts
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};