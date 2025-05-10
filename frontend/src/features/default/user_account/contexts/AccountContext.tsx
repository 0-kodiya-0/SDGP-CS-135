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
    fetchAllAccountDetails: (setCurrentAccountData?: boolean) => void;
    error: string | null;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accountId } = useParams<{ accountId: string }>();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { accountIds, removeAccount } = useAccountStore(); // Get account IDs from store

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


    const fetchAllAccountDetails = useCallback(async (setCurrentAccountData = true) => {
        if (!accountIds || accountIds.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Fetch all accounts in parallel
            const accountDetailsResults = await Promise.all(
                accountIds.map(id => fetchAccountDetails(id))
            );

            // Filter out null responses (failed fetches)
            const validAccounts = accountDetailsResults.filter((account): account is Account => account !== null);

            // Find account IDs that failed to load
            const fetchedAccountIds = validAccounts.map(account => account.id);
            const invalidAccountIds = accountIds.filter(id => !fetchedAccountIds.includes(id));

            // Remove failed accounts from the store
            invalidAccountIds.forEach(id => removeAccount(id));

            // Update accounts state
            setAccounts(validAccounts);

            // Set current account if requested
            if (setCurrentAccountData && accountId) {
                const current = validAccounts.find(account => account.id === accountId);
                if (current) {
                    setCurrentAccount(current);
                } else {
                    console.warn("Current account not found in fetched accounts");
                    if (!invalidAccountIds.includes(accountId)) {
                        // This is strange - account ID isn't in invalid list but we didn't find it
                        setError("Error loading current account");
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching account details:', error);
            setError('Failed to load account data');
        } finally {
            setIsLoading(false);
        }
    }, [accountIds, accountId, removeAccount]);

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