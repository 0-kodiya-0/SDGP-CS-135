import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the feature types
export type FeatureType = 'contacts' | 'files' | 'calendar' | 'mail' | 'default' | 'workspace' | 'chat';

// Define the store state and actions
interface FeatureState {
  // Current selected feature
  currentFeature: FeatureType;
  
  // Function to select a feature
  selectFeature: (feature: FeatureType) => void;
}

// Create the Zustand store with persistence
export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      currentFeature: 'default',
      selectFeature: (feature) => {
        console.log(`[FeatureStore] Selecting feature: ${feature}`);
        set({ currentFeature: feature });
      },
    }),
    {
      name: 'feature-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage for persistence
      // Only persist the currentFeature state
      partialize: (state) => ({ currentFeature: state.currentFeature }),
    }
  )
);