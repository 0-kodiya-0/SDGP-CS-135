export type FeatureType = 'workspace' | 'files' | 'contacts';

export interface FeatureState {
    isSelected: boolean;
    isExpanded: boolean;
}

export interface NavigationState {
    // Current selected feature type
    selectedFeature: FeatureType | null;

    // UI states for features
    featureStates: Record<FeatureType, FeatureState>;
}

export interface NavigationActions extends NavigationState {
    selectFeature: (feature: FeatureType | null) => void;
    toggleFeatureExpansion: (feature: FeatureType) => void;
    clearSelection: () => void;
}