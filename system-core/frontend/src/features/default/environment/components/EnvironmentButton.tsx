import React, { useState } from 'react';
import { ChevronDown, Plus, Pencil } from 'lucide-react';
import { EnvironmentSlider } from './EnvironmentSlider';
import { CreateEnvironmentInput } from './CreateEnvironmentInput';
import { UpdateEnvironmentInput } from './UpdateEnvironmentInput';
import { useAccount } from '../../../../services/auth';
import { useEnvironment } from '../contexts/EnvironmentContext';

interface EnvironmentButtonProps {
  className?: string;
}

export const EnvironmentButton: React.FC<EnvironmentButtonProps> = ({ className = '' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { currentAccount } = useAccount();
  const { currentEnvironment, environments, setCurrentEnvironment } = useEnvironment();

  // We can't do anything without an account
  if (!currentAccount) {
    return (
      <div className={`h-full flex items-center px-3 text-sm text-gray-400 ${className}`}>
        No Account Selected
      </div>
    );
  }

  const accountId = currentAccount.accountId;

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setIsCreating(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setIsEditing(true);
  };

  return (
    <>
      <div className={`h-full flex items-center justify-between w-full px-3 ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(true)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span className="truncate max-w-[180px]">
            {currentEnvironment ? currentEnvironment.name : 'Select Environment'}
          </span>
          <ChevronDown size={14} />
        </button>

        <div className="flex items-center space-x-1">
          {currentEnvironment && (
            <button
              onClick={handleEditClick}
              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={handleCreateClick}
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {isDropdownOpen && (
        <EnvironmentSlider
          environments={environments}
          selectedEnvironment={currentEnvironment}
          onEnvironmentSelect={(env) => {
            setCurrentEnvironment(env);
            setIsDropdownOpen(false);
          }}
          onClose={() => setIsDropdownOpen(false)}
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