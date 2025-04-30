import React, { useState, useCallback } from 'react';
import { ChevronDown, Plus, Pencil } from 'lucide-react';
import { EnvironmentSlider } from './EnvironmentSlider';
import { CreateEnvironmentInput } from './CreateEnvironmentInput';
import { UpdateEnvironmentInput } from './UpdateEnvironmentInput';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { Environment } from '../types/types.data';
import { useAccount } from '../../user_account';

interface EnvironmentButtonProps {
  className?: string;
}

export const EnvironmentButton: React.FC<EnvironmentButtonProps> = ({ className = '' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { currentAccount } = useAccount();
  const {
    currentEnvironment,
    environments,
    setCurrentEnvironment,
    isLoading
  } = useEnvironment();

  // Define all hooks at the top level, regardless of conditions
  const handleCreateClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setIsCreating(true);
  }, []);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setIsEditing(true);
  }, []);

  const handleEnvironmentSelect = useCallback((env: Environment) => {
    setCurrentEnvironment(env);
    setIsDropdownOpen(false);
  }, [setCurrentEnvironment]);

  const handleDropdownClose = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  // We can't do anything without an account
  if (!currentAccount) {
    return (
      <div className={`h-full flex items-center px-3 text-sm text-gray-400 ${className}`}>
        No Account Selected
      </div>
    );
  }

  const accountId = currentAccount.id;

  return (
    <>
      <div className={`h-full flex items-center justify-between w-full px-3 ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(true)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          disabled={isLoading}
        >
          <span className="truncate max-w-[180px]">
            {isLoading
              ? 'Loading...'
              : (currentEnvironment ? currentEnvironment.name : 'Select Environment')}
          </span>
          <ChevronDown size={14} />
        </button>

        <div className="flex items-center space-x-1">
          {currentEnvironment && (
            <button
              onClick={handleEditClick}
              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              disabled={isLoading}
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={handleCreateClick}
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            disabled={isLoading}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {isDropdownOpen && !isLoading && (
        <EnvironmentSlider
          environments={environments}
          selectedEnvironment={currentEnvironment}
          onEnvironmentSelect={handleEnvironmentSelect}
          onClose={handleDropdownClose}
        />
      )}

      {isCreating && (
        <CreateEnvironmentInput
          accountId={accountId}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {isEditing && currentEnvironment && (
        <UpdateEnvironmentInput
          activeEnvironment={currentEnvironment}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </>
  );
};