import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Check, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { CreateWorkspaceRequest, WorkspaceFeatureType } from '../types/workspace.types';
import SummaryView from './SummaryView';
import { useTabs } from '../../tab_view';

interface WorkspaceListProps {
  accountId: string;
  createMode?: boolean;
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({ accountId, createMode = false }) => {
  const { workspaces, loading, error, fetchWorkspaces, createWorkspace, selectWorkspace } = useWorkspace();
  const [isCreating, setIsCreating] = useState(createMode);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabledFeatures, setEnabledFeatures] = useState<WorkspaceFeatureType[]>(
    Object.values(WorkspaceFeatureType)
  );
  const { addTab } = useTabs();

  // Fetch workspaces when component mounts
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Toggle feature enabled/disabled
  const toggleFeature = (feature: WorkspaceFeatureType) => {
    if (enabledFeatures.includes(feature)) {
      setEnabledFeatures(enabledFeatures.filter(f => f !== feature));
    } else {
      setEnabledFeatures([...enabledFeatures, feature]);
    }
  };

  // Handle form submission to create workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return; // Name is required
    }
    
    const request: CreateWorkspaceRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      features: Object.values(WorkspaceFeatureType).map(type => ({
        type,
        enabled: enabledFeatures.includes(type)
      }))
    };
    
    try {
      const newWorkspace = await createWorkspace(request);
      
      if (newWorkspace) {
        // Reset form
        setName('');
        setDescription('');
        setEnabledFeatures(Object.values(WorkspaceFeatureType));
        setIsCreating(false);
        
        // Select the new workspace
        selectWorkspace(newWorkspace.id);
        
        // Open the workspace summary tab
        addTab(`Workspace: ${newWorkspace.name}`, <SummaryView accountId={accountId} />);
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  // Handle workspace selection
  const handleSelectWorkspace = (workspaceId: string) => {
    // Find the workspace to get its name
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;
    
    // Select this workspace in the context
    selectWorkspace(workspaceId);
    
    // Open the workspace summary in a new tab
    addTab(`Workspace: ${workspace.name}`, <SummaryView accountId={accountId} />);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Workspaces</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Workspace
          </button>
        </div>
      </header>

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-red-500 text-center">
            <p>Failed to load workspaces:</p>
            <p className="font-medium">{error}</p>
            <button
              onClick={() => fetchWorkspaces()}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Create workspace form */}
      {isCreating && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleCreateWorkspace}>
            <h2 className="text-lg font-medium mb-4">Create New Workspace</h2>
            
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Workspace Name*
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter workspace name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter workspace description"
                rows={3}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <p className="block text-sm font-medium text-gray-700 mb-2">Enabled Features</p>
              <div className="space-y-2">
                {Object.values(WorkspaceFeatureType).map(feature => (
                  <div key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`feature-${feature}`}
                      checked={enabledFeatures.includes(feature)}
                      onChange={() => toggleFeature(feature)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor={`feature-${feature}`} className="ml-2 text-sm text-gray-700">
                      {feature.charAt(0).toUpperCase() + feature.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!name.trim()}
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workspaces list */}
      {!loading && !error && (
        <div className="flex-1 overflow-auto p-4">
          {workspaces.length === 0 && !isCreating ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any workspaces yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Your First Workspace
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.map(workspace => (
                <div
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace.id)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{workspace.name}</h3>
                      {workspace.description && (
                        <p className="text-gray-500 mt-1">{workspace.description}</p>
                      )}
                      <div className="flex mt-2 space-x-2">
                        {workspace.features
                          .filter(f => f.enabled)
                          .map(feature => (
                            <span 
                              key={feature.type}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {feature.type}
                            </span>
                          ))}
                        {workspace.features
                          .filter(f => !f.enabled)
                          .map(feature => (
                            <span 
                              key={feature.type}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
                            >
                              <X className="w-3 h-3 mr-1" />
                              {feature.type}
                            </span>
                          ))}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceList;