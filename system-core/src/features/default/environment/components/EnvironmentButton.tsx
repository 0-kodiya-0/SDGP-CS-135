import { MoreVertical } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useEnvironmentStore } from '../store';
import { CreateEnvironmentInput } from './CreateEnvironmentInput';
import { UpdateEnvironmentInput } from './UpdateEnvironmentInput';
import { EnvironmentSlider } from './EnvironmentSlider';
import { ActiveAccount } from '../../user_account';
import { Environment } from '../types/types.data';

export interface EnvironmentButtonProps {
  activeAccount: ActiveAccount;
}

export function EnvironmentButton({ activeAccount }: EnvironmentButtonProps) {
  const accountId = activeAccount.id;
  
  // Get functions from the store directly to avoid selector re-creation on each render
  const getEnvironmentsByAccount = useEnvironmentStore(state => state.getEnvironmentsByAccount);
  const getEnvironment = useEnvironmentStore(state => state.getEnvironment);
  const setEnvironmentFn = useEnvironmentStore(state => state.setEnvironment);
  
  // Use the functions with the account ID
  const environments = getEnvironmentsByAccount(accountId);
  const selectedEnvironment = getEnvironment(accountId);
  const setEnvironment = (env: Environment) => setEnvironmentFn(env, accountId);
  
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
  const [isUpdateEnvOpen, setIsUpdateEnvOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="flex items-center h-full w-full">
      <button
        onClick={handleEnvironmentClick}
        className="flex-1 h-full px-4 flex items-center min-w-0 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center min-w-0 w-full">
          {selectedEnvironment ? (
            <>
              <span className="text-sm font-medium truncate">{selectedEnvironment.name}</span>
              {selectedEnvironment.status !== 'active' && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${selectedEnvironment.status === 'archived' ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                  {selectedEnvironment.status}
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
            {selectedEnvironment && (
              <button
                onClick={handleEditClick}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit Environment
              </button>
            )}
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

      {isUpdateEnvOpen && selectedEnvironment && (
        <UpdateEnvironmentInput activeEnvironment={selectedEnvironment} onCancel={handleUpdateEnvClose} />
      )}

      {isSliderOpen && (
        <EnvironmentSlider
          environments={environments}
          selectedEnvironment={selectedEnvironment}
          onEnvironmentSelect={setEnvironment}
          onClose={handleSliderClose}
        />
      )}
    </div>
  );
}