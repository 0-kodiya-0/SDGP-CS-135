import { createContext, useContext, useState, ReactNode } from 'react';

// Define the feature types
export type FeatureType = 'contacts' | 'files' | 'calendar' | 'mail' | 'chat' | 'default';

// Define the context type
interface FeatureContextType {
    // Current selected feature
    currentFeature: FeatureType;

    // Function to select a feature
    selectFeature: (feature: FeatureType) => void;
}

// Create the context with default values
const FeatureContext = createContext<FeatureContextType>({
    currentFeature: 'default',
    selectFeature: () => { },
});

// Props for the provider component
interface FeatureProviderProps {
    children: ReactNode;
    initialFeature?: FeatureType;
}

/**
 * Provider component that wraps your app and makes feature context available to any
 * child component that calls the useFeature hook.
 */
export function FeatureProvider({
    children,
    initialFeature = 'default'
}: FeatureProviderProps) {
    // State to track the current selected feature
    const [currentFeature, setCurrentFeature] = useState<FeatureType>(initialFeature);

    // Function to update the selected feature
    const selectFeature = (feature: FeatureType) => {
        setCurrentFeature(feature);
    };

    // Context value
    const value = {
        currentFeature,
        selectFeature,
    };

    return (
        <FeatureContext.Provider value={value}>
            {children}
        </FeatureContext.Provider>
    );
}

/**
 * Hook that allows components to access the feature context
 */
export function useFeature() {
    const context = useContext(FeatureContext);

    if (context === undefined) {
        throw new Error('useFeature must be used within a FeatureProvider');
    }

    return context;
}