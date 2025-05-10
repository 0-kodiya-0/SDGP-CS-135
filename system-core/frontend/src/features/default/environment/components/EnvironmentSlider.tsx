import { useCallback } from 'react';
import { Environment } from '../types/types.data';
import { EnvironmentCard } from './EnvironmentCard';

interface EnvironmentSliderProps {
  environments: Environment[];
  selectedEnvironment: Environment | null;
  onEnvironmentSelect: (env: Environment) => void;
  onClose: () => void;
}

export function EnvironmentSlider({
  environments,
  selectedEnvironment,
  onEnvironmentSelect,
  onClose
}: EnvironmentSliderProps) {
  const getSliderStyle = useCallback(() => {
    return { top: '4px' };
  }, []);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="absolute left-4 right-4 bg-white shadow-sm rounded-lg"
        style={getSliderStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {environments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No environments available. Create a new one to get started.
          </div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-min">
              {environments.map((env) => (
                <EnvironmentCard
                  key={env.id}
                  environment={env}
                  isSelected={env.id === selectedEnvironment?.id}
                  onSelect={() => {
                    onEnvironmentSelect(env);
                    onClose();
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}