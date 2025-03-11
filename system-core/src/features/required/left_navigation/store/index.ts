import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NavigationState, NavigationActions } from '../types/store.ts';

const DEFAULT_FEATURE_STATE = {
    isSelected: false,
    isExpanded: false,
};

const INITIAL_STATE: NavigationState = {
    selectedFeature: null,
    featureStates: {
        workspace: { ...DEFAULT_FEATURE_STATE },
        files: { ...DEFAULT_FEATURE_STATE },
        contacts: { ...DEFAULT_FEATURE_STATE },
    },
};

export const useNavigationStore = create<NavigationActions>()(
    persist(
        (set) => ({
            ...INITIAL_STATE,

            selectFeature: (feature) =>
                set((state) => ({
                    selectedFeature: feature,
                    featureStates: {
                        workspace: {
                            ...state.featureStates.workspace,
                            isSelected: 'workspace' === feature
                        },
                        files: {
                            ...state.featureStates.files,
                            isSelected: 'files' === feature
                        },
                        contacts: {
                            ...state.featureStates.contacts,
                            isSelected: 'contacts' === feature
                        }
                    }
                })),

            toggleFeatureExpansion: (feature) =>
                set((state) => ({
                    ...state,
                    featureStates: {
                        ...state.featureStates,
                        [feature]: {
                            ...state.featureStates[feature],
                            isExpanded: !state.featureStates[feature].isExpanded,
                        },
                    },
                })),

            clearSelection: () =>
                set(() => ({
                    selectedFeature: null,
                    featureStates: {
                        workspace: { ...DEFAULT_FEATURE_STATE },
                        files: { ...DEFAULT_FEATURE_STATE },
                        contacts: { ...DEFAULT_FEATURE_STATE },
                    },
                })),
        }),
        {
            name: 'navigation-storage',
            version: 1,
        }
    )
);


export const selectedFeature = (state: NavigationState) => state.selectedFeature ? state.featureStates[state.selectedFeature] : DEFAULT_FEATURE_STATE;

export const selectedFeatureType = (state: NavigationState) => state.selectedFeature;