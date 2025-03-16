import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
    LocalAccount,
    AccountType,
    AccountStatus,
    OAuthAccount,
} from "../types/types.data.ts"
import { AccountState } from "../types/types.store.ts"
import { mockLocalAccount, mockOAuthAccounts } from "../../../../mock/mock/data.ts"
import { stateLogger } from "../../../../api/logger"

// Create dedicated logger for account store
const accountStoreLogger = stateLogger.extend('account');

export const useAccountStore = create<AccountState>()(
    persist(
        (set, get) => ({
            localAccount: mockLocalAccount,
            oauthAccounts: mockOAuthAccounts,
            activeAccount: mockLocalAccount,

            createLocalAccount: ({ device, password, userDetails }) => {
                accountStoreLogger('Creating local account for device %s, user %s', 
                                 device.id, userDetails.name);
                const { localAccount } = get()

                if (localAccount) {
                    accountStoreLogger('Local account already exists, cannot create another');
                    return null;
                }

                const newAccount: LocalAccount = {
                    id: 0,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    device,
                    accountType: AccountType.Local,
                    status: AccountStatus.Active,
                    userDetails,
                    security: {
                        password,
                        sessionTimeout: 20,
                        autoLock: false
                    }
                }

                accountStoreLogger('Created local account with ID %d', newAccount.id);
                set({ localAccount: newAccount, activeAccount: newAccount })
                accountStoreLogger('Local account set as active account');
                return newAccount
            },

            updateLocalAccount: (updates) => {
                accountStoreLogger('Updating local account with: %o', {
                    ...updates,
                    password: updates.password ? '[REDACTED]' : undefined
                });
                const { password, ...restUpdates } = updates

                set((state) => {
                    if (!state.localAccount) {
                        accountStoreLogger('No local account exists to update');
                        return state;
                    }
                    
                    accountStoreLogger('Local account updated successfully');
                    return {
                        localAccount: {
                            ...state.localAccount,
                            ...restUpdates,
                            security: {
                                ...state.localAccount.security,
                                ...(password ? { password } : {})
                            },
                            updated: new Date().toISOString()
                        }
                    };
                });
            },

            deleteLocalAccount: () => {
                accountStoreLogger('Deleting local account');
                const { activeAccount, localAccount } = get()

                if (activeAccount?.id === localAccount?.id) {
                    accountStoreLogger('Active account was local account, clearing active account');
                    set({ activeAccount: null })
                }

                accountStoreLogger('Local account deleted');
                set({ localAccount: null })
            },

            addOAuthAccount: ({ device, provider, userDetails, tokenDetails }) => {
                accountStoreLogger('Adding OAuth account for provider %s, user %s', 
                                 provider, userDetails.email);
                const { oauthAccounts, canAddMoreOAuthAccounts } = get()

                if (!canAddMoreOAuthAccounts()) {
                    accountStoreLogger('Cannot add more OAuth accounts, limit reached');
                    return false;
                }

                const isDuplicate = oauthAccounts.some(
                    acc => acc.provider === provider && acc.userDetails.email === userDetails.email
                )

                if (isDuplicate) {
                    accountStoreLogger('Duplicate OAuth account for provider %s and email %s', 
                                     provider, userDetails.email);
                    return false;
                }

                const newAccount: OAuthAccount = {
                    id: 0, // This would normally be assigned by backend
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    device,
                    accountType: AccountType.OAuth,
                    status: AccountStatus.Active,
                    security: {
                        twoFactorEnabled: false,
                        sessionTimeout: 30,
                        autoLock: true
                    },
                    provider,
                    userDetails,
                    tokenDetails
                }

                accountStoreLogger('OAuth account created for %s with provider %s', 
                                 userDetails.email, provider);
                
                set((state) => ({
                    oauthAccounts: [...state.oauthAccounts, newAccount]
                }))

                accountStoreLogger('OAuth account added successfully');
                return true
            },

            updateOAuthAccount: (accountId, updates) => {
                accountStoreLogger('Updating OAuth account %d with: %o', accountId, updates);
                
                set((state) => {
                    const accountExists = state.oauthAccounts.some(acc => acc.id === accountId);
                    if (!accountExists) {
                        accountStoreLogger('OAuth account %d not found for update', accountId);
                    } else {
                        accountStoreLogger('OAuth account %d updated successfully', accountId);
                    }
                    
                    return {
                        oauthAccounts: state.oauthAccounts.map(acc =>
                            acc.id === accountId
                                ? { ...acc, ...updates, updated: new Date().toISOString() }
                                : acc
                        )
                    };
                });
            },

            removeOAuthAccount: (accountId) => {
                accountStoreLogger('Removing OAuth account %d', accountId);
                const { activeAccount } = get()

                if (activeAccount?.id === accountId) {
                    accountStoreLogger('Active account was the OAuth account being removed, clearing active account');
                    set({ activeAccount: null })
                }

                set((state) => {
                    const accountExists = state.oauthAccounts.some(acc => acc.id === accountId);
                    if (!accountExists) {
                        accountStoreLogger('OAuth account %d not found for removal', accountId);
                    } else {
                        accountStoreLogger('OAuth account %d removed successfully', accountId);
                    }
                    
                    return {
                        oauthAccounts: state.oauthAccounts.filter(acc => acc.id !== accountId)
                    };
                });
            },

            setActiveAccount: (account) => {
                if (account) {
                    accountStoreLogger('Setting active account to %s account %d', 
                                     account.accountType, account.id);
                } else {
                    accountStoreLogger('Clearing active account');
                }
                
                set({ activeAccount: account })
            },

            getAccountById: (accountId) => {
                accountStoreLogger('Getting account by ID: %d', accountId);
                const { localAccount, oauthAccounts } = get()

                if (localAccount?.id === accountId) {
                    accountStoreLogger('Found local account with ID %d', accountId);
                    return localAccount;
                }
                
                const oauthAccount = oauthAccounts.find(acc => acc.id === accountId);
                if (oauthAccount) {
                    accountStoreLogger('Found OAuth account with ID %d (provider: %s)', 
                                      accountId, oauthAccount.provider);
                } else {
                    accountStoreLogger('No account found with ID %d', accountId);
                }
                
                return oauthAccount || null;
            },

            canAddMoreOAuthAccounts: () => {
                const { oauthAccounts } = get()
                const canAdd = oauthAccounts.length < 20;
                accountStoreLogger('Can add more OAuth accounts: %s (current count: %d/20)', 
                                 canAdd, oauthAccounts.length);
                return canAdd;
            },

            getTotalAccounts: () => {
                const { localAccount, oauthAccounts } = get()
                const total = (localAccount ? 1 : 0) + oauthAccounts.length;
                accountStoreLogger('Total accounts: %d (local: %s, OAuth: %d)', 
                                 total, localAccount ? 'yes' : 'no', oauthAccounts.length);
                return total;
            }
        }),
        {
            name: 'account-storage',
            partialize: (state) => ({
                localAccount: state.localAccount,
                oauthAccounts: state.oauthAccounts,
                activeAccount: state.activeAccount
            }),
            onRehydrateStorage: () => {
                accountStoreLogger('Rehydrating account store from storage');
                return (state) => {
                    if (state) {
                        accountStoreLogger('Account store rehydrated: %s local account, %d OAuth accounts', 
                                          state.localAccount ? 'has' : 'no', 
                                          state.oauthAccounts.length);
                    } else {
                        accountStoreLogger('Failed to rehydrate account store');
                    }
                };
            }
        }
    )
)

export const getActiveAccount = (state: AccountState) => state.activeAccount;