import { ReactNode } from 'react';
import { FeatureType } from '../store/useFeatureStore';

interface SummarySectionProps {
  icon?: ReactNode;
  title: string;
  featureComponent: ReactNode;
  featureType: FeatureType;
  onSelect: (featureType: FeatureType) => void;
  badgeCount?: number;
  isActive?: boolean;
}

export function SummarySection({
  icon,
  title,
  featureComponent,
  featureType,
  onSelect,
  badgeCount,
  isActive = false,
}: SummarySectionProps) {
  if (!featureType) return null;

  return (
    <div className="space-y-2">
      <button
        className={`
          relative w-12 h-12 rounded-lg
          flex items-center justify-center
          transition-colors duration-200
          ${isActive
            ? 'bg-blue-100 text-blue-600'
            : 'hover:bg-gray-100'
          }
        `}
        onClick={() => onSelect(featureType)}
        title={title}
      >
        {icon}

        {/* Optional badge */}
        {typeof badgeCount === 'number' && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 text-xs
                 bg-red-500 text-white rounded-full
                 flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </button>
      {featureComponent}
    </div>
  );
}