// frontend/src/features/default/user_account/contexts/AccountContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Account, AccountType } from '../types/types.data';
import { useAccountStore } from '../store/account.store';
import { fetchAccountDetails } from '../utils/account.utils';
import { LocalAuthAPI } from '../api/localAuth.api';

interface AccountContextType {
    accounts: Account[];
    currentAccount: Account | null;
    isLoading: boolean;
    fetchCurrentAccountDetails: () => void;
    fetchAllAccountDetails: (setCurrentAccountData?: boolean) => void;
    error: string | null;
    
    // Local auth account methods
    changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    setupTwoFactor: (password: string, enable: boolean) => Promise<{
        success: boolean;
        qrCode?: string;
        secret?: string;
        backupCodes?: string[];
        error?: string;
    }>;
    verifyTwoFactorSetup: (code: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    generateBackupCodes: (password: string) => Promise<{
        success: boolean;
        backupCodes?: string[];
        error?: string;
    }>;
    isLocalAccount: () => boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accountId } = useParams<{ accountId: string }>();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { accountIds, removeAccount } = useAccountStore();

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

    // Local auth methods for the current account

    const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string) => {
        if (!currentAccount || !accountId) {
            return { success: false, error: 'No current account' };
        }

        if (currentAccount.accountType !== AccountType.Local) {
            return { success: false, error: 'Password change not available for OAuth accounts' };
        }

        try {
            console.log('[AccountContext] Changing password for account:', accountId);
            
            const response = await LocalAuthAPI.changePassword(accountId, {
                oldPassword,
                newPassword,
                confirmPassword
            });

            if (response.success) {
                console.log('[AccountContext] Password changed successfully');
                return { success: true };
            }

            console.log('[AccountContext] Password change failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || 'Password change failed'
            };
        } catch (error) {
            console.error('[AccountContext] Password change error:', error);
            return {
                success: false,
                error: 'Network error during password change'
            };
        }
    };

    const setupTwoFactor = async (password: string, enable: boolean) => {
        if (!currentAccount || !accountId) {
            return { success: false, error: 'No current account' };
        }

        if (currentAccount.accountType !== AccountType.Local) {
            return { success: false, error: '2FA setup not available for OAuth accounts' };
        }

        try {
            console.log('[AccountContext] Setting up 2FA for account:', accountId, 'enable:', enable);
            
            const response = await LocalAuthAPI.setupTwoFactor(accountId, {
                password,
                enableTwoFactor: enable
            });

            if (response.success && response.data) {
                console.log('[AccountContext] 2FA setup successful');
                return {
                    success: true,
                    qrCode: response.data.qrCode,
                    secret: response.data.secret,
                    backupCodes: response.data.backupCodes
                };
            }

            console.log('[AccountContext] 2FA setup failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || '2FA setup failed'
            };
        } catch (error) {
            console.error('[AccountContext] 2FA setup error:', error);
            return {
                success: false,
                error: 'Network error during 2FA setup'
            };
        }
    };

    const verifyTwoFactorSetup = async (code: string) => {
        if (!currentAccount || !accountId) {
            return { success: false, error: 'No current account' };
        }

        if (currentAccount.accountType !== AccountType.Local) {
            return { success: false, error: '2FA verification not available for OAuth accounts' };
        }

        try {
            console.log('[AccountContext] Verifying 2FA setup for account:', accountId);
            
            const response = await LocalAuthAPI.verifyTwoFactorSetup(accountId, {
                token: code
            });

            if (response.success) {
                console.log('[AccountContext] 2FA setup verification successful');
                // Refresh account details to get updated security settings
                await fetchCurrentAccountDetails();
                return { success: true };
            }

            console.log('[AccountContext] 2FA setup verification failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || '2FA verification failed'
            };
        } catch (error) {
            console.error('[AccountContext] 2FA verification error:', error);
            return {
                success: false,
                error: 'Network error during 2FA verification'
            };
        }
    };

    const generateBackupCodes = async (password: string) => {
        if (!currentAccount || !accountId) {
            return { success: false, error: 'No current account' };
        }

        if (currentAccount.accountType !== AccountType.Local) {
            return { success: false, error: 'Backup codes not available for OAuth accounts' };
        }

        try {
            console.log('[AccountContext] Generating backup codes for account:', accountId);
            
            const response = await LocalAuthAPI.generateBackupCodes(accountId, {
                password
            });

            if (response.success && response.data?.backupCodes) {
                console.log('[AccountContext] Backup codes generated successfully');
                return {
                    success: true,
                    backupCodes: response.data.backupCodes
                };
            }

            console.log('[AccountContext] Backup codes generation failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || 'Backup codes generation failed'
            };
        } catch (error) {
            console.error('[AccountContext] Backup codes generation error:', error);
            return {
                success: false,
                error: 'Network error during backup codes generation'
            };
        }
    };

    const isLocalAccount = useCallback(() => {
        return currentAccount?.accountType === AccountType.Local;
    }, [currentAccount]);

    const value = {
        accounts,
        currentAccount,
        isLoading,
        error,
        fetchCurrentAccountDetails,
        fetchAllAccountDetails,
        
        // Local auth methods
        changePassword,
        setupTwoFactor,
        verifyTwoFactorSetup,
        generateBackupCodes,
        isLocalAccount
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