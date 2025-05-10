import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../user_account';
import { Environment, EnvironmentPrivacy } from '../types/types.data';
import { useEnvironmentStore } from '../store';
import { fetchEnvironments, setActiveEnvironment } from '../services/environment.service';
import { Loader2, Plus } from 'lucide-react';
import { CreateEnvironmentModal } from '../components/CreateEnvironmentModal';

const EnvironmentSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAccount } = useAccount();
  const { setEnvironment } = useEnvironmentStore();
  
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  useEffect(() => {
    const loadEnvironments = async () => {
      if (!currentAccount?.id) {
        setIsLoading(false);
        setError('No account selected');
        return;
      }
      
      try {
        setIsLoading(true);
        const environmentList = await fetchEnvironments(currentAccount.id);
        setEnvironments(environmentList);
        setError(null);
      } catch (err) {
        console.error('Failed to load environments:', err);
        setError('Failed to load environments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEnvironments();
  }, [currentAccount]);
  
  const handleEnvironmentSelect = async (environment: Environment) => {
    if (!currentAccount?.id) return;
    
    try {
      // Update the active environment on the server
      await setActiveEnvironment(currentAccount.id, environment.id);
      
      // Update the local store
      setEnvironment(environment, currentAccount.id);
      
      // Navigate to the main app
      navigate(`/app/${currentAccount.id}`);
    } catch (err) {
      console.error('Failed to select environment:', err);
      setError('Failed to select environment. Please try again.');
    }
  };
  
  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleCreateSuccess = (newEnvironment: Environment) => {
    // Add the new environment to the list
    setEnvironments(prev => [...prev, newEnvironment]);
    setIsCreateModalOpen(false);
    
    // Select the newly created environment
    handleEnvironmentSelect(newEnvironment);
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">No Account Selected</h1>
          <p className="text-gray-600 mb-4">You need to select an account before choosing an environment.</p>
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading environments...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Select Environment</h1>
            <button
              onClick={handleCreateClick}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Environment
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          {environments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">You don't have any environments yet.</p>
              <button
                onClick={handleCreateClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Environment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {environments.map((env) => (
                <div
                  key={env.id}
                  onClick={() => handleEnvironmentSelect(env)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                >
                  <h3 className="font-medium text-gray-900 mb-2">{env.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-3">
                      {env.privacy === EnvironmentPrivacy.Private ? 'Private' : 
                       env.privacy === EnvironmentPrivacy.Shared ? 'Shared' : 'Global'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      env.status === 'active' ? 'bg-green-100 text-green-800' : 
                      env.status === 'archived' ? 'bg-gray-100 text-gray-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {env.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isCreateModalOpen && (
        <CreateEnvironmentModal
          accountId={currentAccount.id}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default EnvironmentSelectionPage;