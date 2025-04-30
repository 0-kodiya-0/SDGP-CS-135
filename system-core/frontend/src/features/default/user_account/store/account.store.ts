import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccountState {
    // State
    accountIds: string[];

    // Actions
    addAccount: (accountId: string) => void;
    removeAccount: (accountId: string) => void;
    clearAccounts: () => void;

    // Getters
    hasAccounts: () => boolean;
}

export const useAccountStore = create<AccountState>()(
    persist(
        (set, get) => ({
            // Initial state
            accountIds: [],

            // Actions
            addAccount: (accountId: string) => set((state) => {
                // Only add if it doesn't already exist
                if (!state.accountIds.includes(accountId)) {
                    return { accountIds: [...state.accountIds, accountId] };
                }
                return state;
            }),

            removeAccount: (accountId: string) => set((state) => ({
                accountIds: state.accountIds.filter(id => id !== accountId)
            })),

            clearAccounts: () => set({ accountIds: [] }),

            // Getters
            hasAccounts: () => get().accountIds.length > 0,
        }),
        {
            name: 'account-storage',
            version: 1,
        }
    )
);