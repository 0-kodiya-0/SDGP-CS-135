import { Loader2, MoreVertical } from 'lucide-react';
import { EnvironmentButtonProps } from '../types/props.ts';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useEnvironmentStore } from '../store';
import { CreateEnvironmentInput } from './CreateEnvironmentInput.tsx';
import { UpdateEnvironmentInput } from './UpdateEnvironmentInput.tsx';
import { useCreateEnvironment, useEnvironmentByAccountId } from '../hooks/useEnvironments.ts';
import { EnvironmentSlider } from './EnvironmentSlider.tsx';
import { EnvironmentError } from '../types/props.ts';
import { EnvironmentPrivacy, EnvironmentStatus } from '../types/data.ts';

export function EnvironmentButton({ activeEnvironment, activeAccount }: EnvironmentButtonProps) {
  const setEnvironment = useEnvironmentStore(state => state.setEnvironment);

  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
  const [isUpdateEnvOpen, setIsUpdateEnvOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [envSettingUpError, setEnvSettingUpError] = useState<EnvironmentError>({
    isError: false,
    message: ''
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    data: environments = [],
    isLoading: isLoadingEnvironments,
    error: fetchError
  } = useEnvironmentByAccountId(activeAccount.id);

  const createEnvironment = useCreateEnvironment(activeAccount.id);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Environment setup logic moved from EnvironmentSlider
  useEffect(() => {
    if (!isLoadingEnvironments && (!activeEnvironment || activeEnvironment.accountId !== activeAccount.id)) {

      const serverDefaultEnv = environments.find(env => env.accountId === activeAccount.id && env.name === 'Default Environment');

      if (serverDefaultEnv) {
        setEnvironment(serverDefaultEnv);
        return;
      }

      createEnvironment.mutate({
        accountId: activeAccount.id,
        name: 'Default Environment',
        status: EnvironmentStatus.Active,
        privacy: EnvironmentPrivacy.Global
      }, {
        onError: (error) => {
          setEnvSettingUpError({
            isError: true,
            message: error instanceof Error ? error.message : 'Environment setup failed'
          });
        }
      });
    }
  }, [isLoadingEnvironments]);

  useEffect(() => {
    if (!activeEnvironment || activeEnvironment.accountId !== activeAccount.id) {
      const env = environments.find(env => env.name === "Default Environment");
      if (env) {
        setEnvironment(env);
      }
    }
  }, [environments]);

  const handleEnvironmentClick = useCallback(() => {
    setIsSliderOpen(true);
  }, []);

  const handleDropdownToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
  }, []);

  const handleEditClick = useCallback(() => {
    setIsDropdownOpen(false);
    setIsUpdateEnvOpen(true);
  }, []);

  const handleCreateClick = useCallback(() => {
    setIsDropdownOpen(false);
    setIsCreateEnvOpen(true);
  }, []);

  const handleSliderClose = useCallback(() => {
    setIsSliderOpen(false);
  }, []);

  const handleCreateEnvClose = useCallback(() => {
    setIsCreateEnvOpen(false);
  }, []);

  const handleUpdateEnvClose = useCallback(() => {
    setIsUpdateEnvOpen(false);
  }, []);

  if (isLoadingEnvironments) {
    return <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
  }

  return (
    <div className="flex items-center h-full w-full">
      <button
        onClick={handleEnvironmentClick}
        className="flex-1 h-full px-4 flex items-center min-w-0 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center min-w-0 w-full">
          {activeEnvironment ? (
            <>
              <span className="text-sm font-medium truncate">{activeEnvironment.name}</span>
              {activeEnvironment.status !== 'active' && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${activeEnvironment.status === 'archived' ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                  {activeEnvironment.status}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-gray-500">No Environment Selected</span>
          )}
        </div>
      </button>

      <div className="h-full border-l border-gray-200 relative" ref={dropdownRef}>
        <button
          onClick={handleDropdownToggle}
          className="h-full w-10 flex items-center justify-center transition-colors hover:bg-gray-50"
          aria-label="Environment options"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={handleEditClick}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit Environment
            </button>
            <button
              onClick={handleCreateClick}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Create New Environment
            </button>
          </div>
        )}
      </div>

      {isCreateEnvOpen && (
        <CreateEnvironmentInput activeAccount={activeAccount} onCancel={handleCreateEnvClose} />
      )}

      {isUpdateEnvOpen && activeEnvironment && (
        <UpdateEnvironmentInput activeEnvironment={activeEnvironment} onCancel={handleUpdateEnvClose} />
      )}

      {isSliderOpen && (
        <EnvironmentSlider
          environments={environments}
          selectedEnvironment={activeEnvironment}
          isLoading={isLoadingEnvironments || createEnvironment.isPending}
          error={fetchError?.message || (envSettingUpError.isError ? envSettingUpError.message : undefined)}
          onEnvironmentSelect={setEnvironment}
          onClose={handleSliderClose}
        />
      )}
    </div>
  );
}