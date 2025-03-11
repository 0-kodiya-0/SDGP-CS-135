import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
    LocalAccount,
    AccountType,
    AccountStatus,
    OAuthAccount,
} from "../types/data.types.ts"
import { AccountState } from "../types/store.types.ts"
import { mockLocalAccount, mockOAuthAccounts } from "../../../../api/mock/data.ts"

export const useAccountStore = create<AccountState>()(
    persist(
        (set, get) => ({
            localAccount: mockLocalAccount,
            oauthAccounts: mockOAuthAccounts,
            activeAccount: mockLocalAccount,

            createLocalAccount: ({ device, password, userDetails }) => {
                const { localAccount } = get()

                if (localAccount) return null

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

                set({ localAccount: newAccount, activeAccount: newAccount })
                return newAccount
            },

            updateLocalAccount: (updates) => {
                const { password, ...restUpdates } = updates

                set((state) => ({
                    localAccount: state.localAccount ? {
                        ...state.localAccount,
                        ...restUpdates,
                        security: {
                            ...state.localAccount.security,
                            ...(password ? { password } : {})
                        },
                        updated: new Date().toISOString()
                    } : null
                }))
            },

            deleteLocalAccount: () => {
                const { activeAccount, localAccount } = get()

                if (activeAccount?.id === localAccount?.id) {
                    set({ activeAccount: null })
                }

                set({ localAccount: null })
            },

            addOAuthAccount: ({ device, provider, userDetails, tokenDetails }) => {
                const { oauthAccounts, canAddMoreOAuthAccounts } = get()

                if (!canAddMoreOAuthAccounts()) return false

                const isDuplicate = oauthAccounts.some(
                    acc => acc.provider === provider && acc.userDetails.email === userDetails.email
                )

                if (isDuplicate) return false

                const newAccount: OAuthAccount = {
                    id: 0,
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

                set((state) => ({
                    oauthAccounts: [...state.oauthAccounts, newAccount]
                }))

                return true
            },

            updateOAuthAccount: (accountId, updates) => {
                set((state) => ({
                    oauthAccounts: state.oauthAccounts.map(acc =>
                        acc.id === accountId
                            ? { ...acc, ...updates, updated: new Date().toISOString() }
                            : acc
                    )
                }))
            },

            removeOAuthAccount: (accountId) => {
                const { activeAccount } = get()

                if (activeAccount?.id === accountId) {
                    set({ activeAccount: null })
                }

                set((state) => ({
                    oauthAccounts: state.oauthAccounts.filter(acc => acc.id !== accountId)
                }))
            },

            setActiveAccount: (account) => {
                set({ activeAccount: account })
            },

            getAccountById: (accountId) => {
                const { localAccount, oauthAccounts } = get()

                if (localAccount?.id === accountId) return localAccount
                return oauthAccounts.find(acc => acc.id === accountId) || null
            },

            canAddMoreOAuthAccounts: () => {
                const { oauthAccounts } = get()
                return oauthAccounts.length < 20
            },

            getTotalAccounts: () => {
                const { localAccount, oauthAccounts } = get()
                return (localAccount ? 1 : 0) + oauthAccounts.length
            }
        }),
        {
            name: 'account-storage',
            partialize: (state) => ({
                localAccount: state.localAccount,
                oauthAccounts: state.oauthAccounts,
                activeAccount: state.activeAccount
            })
        }
    )
)