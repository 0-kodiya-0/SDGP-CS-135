import { selectedFeatureType, useNavigationStore } from '../store';
import { FeatureType } from '../types/store.ts';
import { Environment } from '../../../default/environment/types/data.ts';
import SummaryLoader from './SummaryLoader.tsx';

interface SummaryBarProps {
  environment: Environment;
  className?: string;
}

// Feature path mapping
const featurePaths: Record<FeatureType, string> = {
  workspace: '../../workspace/WorkspaceSummary',
  files: '',
  contacts: ''
};

export function SummaryBar({ environment, className }: SummaryBarProps) {
  const featureType = useNavigationStore(selectedFeatureType);
  const selectFeature = useNavigationStore(state => state.selectFeature);

  const handleFeatureSelect = (feature: FeatureType) => {
    if (feature === featureType) {
      return;
    }
    selectFeature(feature);
  };

  // Determine which feature to render based on current selection
  const renderFeatureComponent = () => {
    return (
      <SummaryLoader
        featurePath={featurePaths["workspace"]}
        props={{
          environment,
          onFeatureSelect: handleFeatureSelect
        }}
      />
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 py-4 flex-shrink-0 ${className}`}>
      <div className="flex flex-col space-y-4">
        {renderFeatureComponent()}
      </div>
    </div>
  );
}