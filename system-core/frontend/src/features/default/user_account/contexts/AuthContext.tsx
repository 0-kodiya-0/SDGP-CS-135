import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccountStore } from '../store/account.store'; // Import the new store

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    logout: (accountId?: string) => Promise<void>;
    logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use the account store instead of state
    const { hasAccounts, clearAccounts } = useAccountStore();

    // Complete initial loading after component mounts
    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Logout from a specific account
    const logout = async (accountId?: string) => {
        try {
            setIsLoading(true);
            if (accountId) {
                // Navigate to the logout endpoint
                window.location.href = `/api/v1/${accountId}/account/logout`;
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
            // Clear local store first
            clearAccounts();
            // Then navigate to logout endpoint
            window.location.href = "/api/v1/account/logout/all";
        } catch (error) {
            console.error('Logout all failed:', error);
            setError('Failed to logout from all accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        isAuthenticated: hasAccounts(),
        isLoading,
        error,
        logout,
        logoutAll
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