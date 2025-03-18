import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Account, useAuth } from './AuthContext';

interface AccountDetails {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
    provider?: string;
    status: string;
    created: string;
    updated: string;
}

interface AccountContextType {
    currentAccount: Account | null;
    accountDetails: AccountDetails | null;
    isLoading: boolean;
    error: string | null;
    fetchAccountDetails: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accountId } = useParams<{ accountId: string }>();
    const navigate = useNavigate();
    const { session, isAuthenticated, isLoading: authLoading } = useAuth();

    const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Find the current account from the session
    const currentAccount = session?.accounts?.find(
        account => account.accountId === accountId
    ) || null;

    // Debug the account matching
    useEffect(() => {
        if (session?.accounts) {
            console.log("AccountContext: Looking for account with ID:", accountId);
            console.log("AccountContext: Available accounts:", session.accounts);
            console.log("AccountContext: Current account found:", currentAccount);
        }
    }, [accountId, session, currentAccount]);

    // Fetch account details when the account ID changes
    useEffect(() => {
        if (accountId && isAuthenticated && !authLoading) {
            console.log("AccountContext: Fetching account details for:", accountId);
            fetchAccountDetails();
        } else {
            if (!accountId) console.log("AccountContext: No accountId parameter found");
            if (!isAuthenticated) console.log("AccountContext: Not authenticated");
            if (authLoading) console.log("AccountContext: Auth is still loading");

            setAccountDetails(null);
            setIsLoading(false);
        }
    }, [accountId]);

    // Redirect if the account doesn't exist in the session
    useEffect(() => {
        if (!authLoading && isAuthenticated && !currentAccount && accountId) {
            console.log("AccountContext: Redirect condition met:");
            console.log("- authLoading:", authLoading);
            console.log("- isAuthenticated:", isAuthenticated);
            console.log("- currentAccount:", currentAccount);
            console.log("- accountId:", accountId);

            // This account is not in the user's session, redirect to error or first available account
            setError('You do not have access to this account');

            if (session?.accounts?.length) {
                console.log("AccountContext: Redirecting to first account:", session.accounts[0].accountId);
                navigate(`/app/${session.accounts[0].accountId}`);
            } else {
                console.log("AccountContext: No accounts found, redirecting to login");
                navigate('/login');
            }
        }
    }, [currentAccount, accountId, isAuthenticated, authLoading, session, navigate]);

    const fetchAccountDetails = async () => {
        if (!accountId) return;

        try {
            setIsLoading(true);
            console.log("AccountContext: Making API request for account details:", accountId);

            const response = await axios.get(`/api/v1/account/${accountId}`);
            console.log("AccountContext: API response:", response.data);

            if (response.data.success) {
                setAccountDetails(response.data.data);
                setError(null);
            } else {
                console.error("AccountContext: API returned success: false");
                setError('Failed to load account details');
                setAccountDetails(null);
            }
        } catch (error) {
            console.error('AccountContext: Error fetching account details:', error);
            setError('Failed to load account details');
            setAccountDetails(null);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        currentAccount,
        accountDetails,
        isLoading,
        error,
        fetchAccountDetails
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