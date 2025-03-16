import { ReactNode } from 'react';
import { PluginId } from '../../../../plugin/core/types';
import { selectedPluginId, useNavigationStore } from '../store';

interface SummarySectionProps {
  icon?: ReactNode;
  title: string;
  featureComponent: ReactNode;
  featureType: PluginId;
  onSelect: (pluginId: PluginId) => void;
  badgeCount?: number;
}

export function SummarySection({
  icon,
  title,
  featureComponent,
  featureType,
  onSelect,
  badgeCount,
}: SummarySectionProps) {
  const selectedPlugin = useNavigationStore(selectedPluginId);
  const isSelected = selectedPlugin === featureType;

  if (!featureType) return null;

  return (
    <div className="space-y-2">
      <button
        className={`
          relative w-full aspect-square rounded-lg
          flex items-center justify-center
          transition-colors duration-200
          ${isSelected
            ? 'bg-white shadow-sm'
            : 'hover:bg-white hover:shadow-sm'
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