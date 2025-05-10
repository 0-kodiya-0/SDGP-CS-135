// frontend/src/features/default/environment/components/CreateEnvironmentModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createEnvironment } from '../services/environment.service';
import { Environment, EnvironmentPrivacy } from '../types/types.data';

interface CreateEnvironmentModalProps {
  accountId: string;
  onClose: () => void;
  onSuccess: (environment: Environment) => void;
}

export const CreateEnvironmentModal: React.FC<CreateEnvironmentModalProps> = ({
  accountId,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState<EnvironmentPrivacy>(EnvironmentPrivacy.Private);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus the input when modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Environment name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const newEnvironment = await createEnvironment(accountId, {
        name: name.trim(),
        privacy
      });
      
      onSuccess(newEnvironment);
    } catch (err) {
      console.error('Failed to create environment:', err);
      setError('Failed to create environment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
      >
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-medium">Create New Environment</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Environment Name
            </label>
            <input
              ref={inputRef}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter environment name"
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Privacy
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value={EnvironmentPrivacy.Private}
                  checked={privacy === EnvironmentPrivacy.Private}
                  onChange={() => setPrivacy(EnvironmentPrivacy.Private)}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Private</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value={EnvironmentPrivacy.Shared}
                  checked={privacy === EnvironmentPrivacy.Shared}
                  onChange={() => setPrivacy(EnvironmentPrivacy.Shared)}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Shared</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value={EnvironmentPrivacy.Global}
                  checked={privacy === EnvironmentPrivacy.Global}
                  onChange={() => setPrivacy(EnvironmentPrivacy.Global)}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Global</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Creating...' : 'Create Environment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEnvironmentModal;