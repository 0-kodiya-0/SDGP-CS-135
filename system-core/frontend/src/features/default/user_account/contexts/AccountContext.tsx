import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Account } from '../types/types.data';
import axios from 'axios';
import { API_BASE_URL, ApiResponse } from '../../../../conf/axios';
import { useAccountStore } from '../store/account.store'; // Import the new store

interface AccountContextType {
    currentAccount: Account | null;
    isLoading: boolean;
    error: string | null;
    fetchAccountDetails: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accountId } = useParams<{ accountId: string }>();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { accountIds } = useAccountStore(); // Get account IDs from store

    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
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
                // Check if this accountId is in the available accounts from our store
                if (!accountIds.includes(accountId)) {
                    console.log("AccountContext: Account not found in available accounts");
                    setError('You do not have access to this account');
                    return;
                }

                await fetchAccountDetails();
            } catch (err) {
                console.error('Error loading account data:', err);
                setError('Failed to load account data');
            } finally {
                setIsLoading(false);
            }
        };

        loadAccountData();
    }, [accountId, accountIds]);

    const fetchAccountDetails = useCallback(async () => {
        if (!accountId) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.get<ApiResponse<Account>>(
                `${API_BASE_URL}/${accountId}/account`,
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
    }, [accountId]);

    const value = {
        currentAccount,
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