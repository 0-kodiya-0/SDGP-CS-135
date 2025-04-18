import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Account } from '../types/types.data';
import { useAccountStore } from '../store/account.store'; // Import the new store
import { fetchAccountDetails } from '../utils/account.utils';

interface AccountContextType {
    accounts: Account[];
    currentAccount: Account | null;
    isLoading: boolean;
    fetchCurrentAccountDetails: () => void;
    fetchAllAccountDetails: () => void;
    error: string | null;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accountId } = useParams<{ accountId: string }>();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { accountIds } = useAccountStore(); // Get account IDs from store

    const [accounts, setAccounts] = useState<Account[]>([]);
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

                await fetchAllAccountDetails();
            } catch (err) {
                console.error('Error loading account data:', err);
                setError('Failed to load account data');
            } finally {
                setIsLoading(false);
            }
        };

        loadAccountData();
    }, [accountId]);


    const fetchAllAccountDetails = useCallback(async () => {
        if (!accountIds || accountIds.length === 0) return;

        try {
            setIsLoading(true);
            const accountPromises = accountIds.map(async (accountId) => {
                try {
                    const response = await fetchAccountDetails(accountId);
                    return response;
                } catch {
                    return null
                }
            });

            const accountDetails = await Promise.all(accountPromises);

            const currentAccount = accountDetails.find(account => account.id === accountId);

            if (!currentAccount) {
                throw new Error("Current account not found");
            }

            setCurrentAccount(currentAccount);

            setAccounts(accountDetails.filter((data) => data !== null));
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setIsLoading(false);
        }
    }, [accountId, accountIds]);

    const fetchCurrentAccountDetails = useCallback(async () => {
        if (!accountId) return;

        try {
            setIsLoading(true);
            const accountDetails = await fetchAccountDetails(accountId);

            setCurrentAccount(accountDetails);
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setIsLoading(false);
        }
    }, [accountId]);

    const value = {
        accounts,
        currentAccount,
        isLoading,
        error,
        fetchCurrentAccountDetails, 
        fetchAllAccountDetails
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