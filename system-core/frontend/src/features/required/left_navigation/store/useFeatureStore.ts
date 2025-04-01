import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCallback, useEffect } from 'react';
import { useAccount } from '../../../default/user_account';

// Define the feature types
export type FeatureType = 'contacts' | 'files' | 'calendar' | 'mail' | 'default' | 'workspace' | 'chat';

// Define user-feature map to track feature selection by accountId
export type AccountFeatureMap = {
  [accountId: string]: FeatureType;
};

// Define the store state and actions
interface FeatureState {
  // Map of account IDs to their selected features
  accountFeatures: AccountFeatureMap;
  
  // Update the feature for a specific account
  setFeatureForAccount: (accountId: string, feature: FeatureType) => void;
  
  // Get the selected feature for a specific account
  getFeatureForAccount: (accountId: string) => FeatureType;
}

// Default feature to use when none is selected
const DEFAULT_FEATURE: FeatureType = 'default';

// Create the Zustand store with persistence
export const useFeatureStoreBase = create<FeatureState>()(
  persist(
    (set, get) => ({
      accountFeatures: {},
      
      setFeatureForAccount: (accountId, feature) => {
        console.log(`[FeatureStore] Setting feature: ${feature} for account: ${accountId}`);
        set((state) => ({
          accountFeatures: {
            ...state.accountFeatures,
            [accountId]: feature
          }
        }));
      },
      
      getFeatureForAccount: (accountId) => {
        const state = get();
        // Return the account-specific feature or the default if not found
        return state.accountFeatures[accountId] || DEFAULT_FEATURE;
      },
    }),
    {
      name: 'feature-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage for persistence
      partialize: (state) => ({ accountFeatures: state.accountFeatures }),
    }
  )
);

/**
 * Hook that combines AccountContext with the feature store
 * to provide account-specific feature selection
 */
export const useFeatureStore = () => {
  // Get the current account from your existing AccountContext
  const { currentAccount } = useAccount();
  
  // Get the base store methods
  const { 
    setFeatureForAccount, 
    getFeatureForAccount, 
    accountFeatures 
  } = useFeatureStoreBase();

  // Get the current account ID
  const accountId = currentAccount?.id || 'default';
  
  // Get current feature for this account
  const currentFeature = getFeatureForAccount(accountId);
  
  // Method to select a feature for the current account
  const selectFeature = useCallback((feature: FeatureType) => {
    setFeatureForAccount(accountId, feature);
  }, [accountId, setFeatureForAccount]);

  // Debug log when the account changes
  useEffect(() => {
    console.log(`[useFeatureStore] Current account: ${accountId}, Current feature: ${currentFeature}`);
  }, [accountId, currentFeature]);
  
  return {
    // Feature for the current account
    currentFeature,
    
    // Select feature for the current account
    selectFeature,
    
    // Account ID for convenience
    accountId,
    
    // For advanced use cases
    accountFeatures,
    setFeatureForAccount,
    getFeatureForAccount
  };
};