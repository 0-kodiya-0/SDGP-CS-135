import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAccount } from '../../user_account';
import { EnvironmentPrivacy } from '../types/types.data';
import { createEnvironment, setActiveEnvironment } from '../services/environment.service';
import { useEnvironmentStore } from '../store';

const CreateEnvironmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAccount } = useAccount();
  const { addEnvironment, setEnvironment } = useEnvironmentStore();

  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState<EnvironmentPrivacy>(EnvironmentPrivacy.Private);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAccount?.id) {
      setError('No account selected');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Environment name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create environment on server
      const newEnvironment = await createEnvironment(currentAccount.id, {
        name: trimmedName,
        privacy
      });

      // Add to local store
      addEnvironment(newEnvironment);

      // Set as active environment
      await setActiveEnvironment(currentAccount.id, newEnvironment.id);
      setEnvironment(newEnvironment, currentAccount.id);

      // Navigate to main app
      navigate(`/app/${currentAccount.id}`);
    } catch (err) {
      console.error('Failed to create environment:', err);
      setError('Failed to create environment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">No Account Selected</h1>
          <p className="text-gray-600 mb-4">You need to select an account before creating an environment.</p>
          <button
            onClick={() => navigate('/accounts')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={handleBack}
              className="p-2 mr-4 rounded-full hover:bg-gray-100"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Create Your First Environment</h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Environments help you organize your work. Create your first environment to get started.
          </p>

          <form onSubmit={handleSubmit}>
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
                placeholder="Enter environment name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <button
              type="submit"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Creating...' : 'Create Environment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEnvironmentPage;