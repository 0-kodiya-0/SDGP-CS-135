import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccountStore } from '../store/account.store'; // Import the new store
import { useNavigate } from 'react-router-dom';
import { OAuthProviders } from '../types/types.data';
import axios from 'axios';
import { API_BASE_URL } from '../../../../conf/axios';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    logout: (accountId: string) => Promise<void>;
    logoutAll: () => Promise<void>;
    tokenRevocation: (accountId: string, provider: OAuthProviders) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Use the account store instead of state
    const { accountIds, hasAccounts, clearAccounts, removeAccount } = useAccountStore();

    // Complete initial loading after component mounts
    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Logout from a specific account
    const logout = async (accountId: string) => {
        try {
            setIsLoading(true);

            // Use direct axios instead of window.location.href
            await axios({
                url: `${API_BASE_URL}/account/logout`,
                method: 'GET',
                params: { accountId },
                withCredentials: true
            });
            
            removeAccount(accountId);

            navigate('/accounts');
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout');
        } finally {
            setIsLoading(false);
        }
    };

    // Updated logoutAll function
    const logoutAll = async () => {
        try {
            setIsLoading(true);

            // Use direct axios instead of window.location.href
            await axios.get(`${API_BASE_URL}/account/logout/all`, {
                params: { accountIds },
                paramsSerializer: () => {
                    const searchParams = new URLSearchParams();
                    accountIds.forEach(id => searchParams.append('accountIds', id));
                    return searchParams.toString();
                },
                withCredentials: true
            });
            clearAccounts();
            navigate('/accounts');
        } catch (error) {
            console.error('Logout all failed:', error);
            setError('Failed to logout from all accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const tokenRevocation = (accountId: string, provider: OAuthProviders) => {
        navigate(`/app/${accountId}/revoke?provider=${provider}`);
    };

    const value = {
        isAuthenticated: hasAccounts(),
        isLoading,
        error,
        logout,
        logoutAll,
        tokenRevocation
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