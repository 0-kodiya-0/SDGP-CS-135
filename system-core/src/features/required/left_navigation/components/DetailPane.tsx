import { useCallback, useEffect, useState } from 'react';
import { useNavigationStore, selectedFeatureType } from '../store';
import { Environment } from '../../../default/environment/types/data.ts';
import { FeatureType } from '../types/store.ts';
import DetailsLoader from './DetailsLoader.tsx';

interface DetailPaneProps {
    environment: Environment;
    className?: string;
}

// Feature path mapping for detail components
const featureDetailPaths: Record<FeatureType, string> = {
    workspace: '../../workspace/WorkspaceDetail',
    files: '../../files/FileDetail',
    contacts: '../../contacts/ContactDetail',
    // Add other feature detail mappings as needed
};

export function DetailPane({ environment, className }: DetailPaneProps) {
    const selectedFeature = useNavigationStore(selectedFeatureType);
    const [selectedFeatureBefore, setSelectFeatureBefore] = useState<FeatureType | null>(null);
    const clearSelection = useNavigationStore(state => state.clearSelection);
    const [title, setTitle] = useState<null | string>(null);

    const setTitleCallBack = useCallback((title: string | null) => {
        setTitle(title);
    }, []);

    useEffect(() => {
        if (!selectedFeatureBefore) {
            setSelectFeatureBefore(selectedFeature);
            return;
        }
        if (selectedFeature !== selectedFeatureBefore) {
            clearSelection();
            setSelectFeatureBefore(selectedFeature);
        }
    }, [selectedFeature, selectedFeatureBefore, clearSelection]);

    const renderFeatureContent = () => {
        if (!selectedFeature) {
            return (
                <div className="text-sm text-gray-500 flex items-center justify-center h-full">
                    Select a feature to view its details
                </div>
            );
        }

        const featurePath = featureDetailPaths[selectedFeature];

        if (!featurePath) {
            return (
                <div className="text-sm text-gray-500 p-4">
                    Detail view for {selectedFeature} is not available
                </div>
            );
        }

        return (
            <DetailsLoader
                featurePath={featurePath}
                featureType={selectedFeature}
                props={{
                    environment,
                    setTitle: setTitleCallBack
                }}
            />
        );
    };

    return (
        <div
            className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${className}
            `}
        >
            {/* Header */}
            <div className="h-12 border-b border-gray-200 flex items-center px-2 flex-shrink-0 overflow-hidden">
                <div className={`transition-opacity duration-300`}>
                    <span className="ml-2 text-sm font-medium text-gray-900 truncate">
                        {title ? title : selectedFeature
                            ? selectedFeature.charAt(0).toUpperCase() + selectedFeature.slice(1)
                            : ''}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div
                className={`flex-1 overflow-y-auto transition-all duration-300 p-4 opacity-100 w-full 
                    custom-scrollbar
                `}
            >
                {renderFeatureContent()}
            </div>
        </div>
    );
}