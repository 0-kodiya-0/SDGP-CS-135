import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useFeatureStore, FeatureType } from '../../left_navigation/store/useFeatureStore';
import { useState } from 'react';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { DeleteWorkspaceDialog } from './DeleteWorkspaceDialog';

export function WorkspaceView() {
  const { selectFeature } = useFeatureStore();
  const { workspaces, selectedWorkspace, addWorkspace, selectWorkspace, deselectWorkspace, deleteWorkspace } = useWorkspaceStore();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleBack = () => {
    if (selectedWorkspace) {
      deselectWorkspace();
      selectFeature('workspace' as FeatureType);
    } else {
      selectFeature('default' as FeatureType);
    }
  };

  const handleCreateWorkspace = () => {
    setIsCreateFormOpen(true);
  };

  const handleCreateWorkspaceSubmit = (name: string, description: string) => {
    addWorkspace({ name, description });
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    selectFeature('workspace-contacts' as FeatureType);
  };

  const handleDeleteClick = (workspaceId: string, workspaceName: string) => {
    setWorkspaceToDelete({ id: workspaceId, name: workspaceName });
  };

  const handleDeleteConfirm = () => {
    if (workspaceToDelete) {
      deleteWorkspace(workspaceToDelete.id);
      setWorkspaceToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-4 items-center">
        <button
          className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
          onClick={handleBack}
          title={selectedWorkspace ? "Back to workspaces" : "Back to main menu"}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        {!selectedWorkspace && (
          <button
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
            onClick={handleCreateWorkspace}
            title="Create new workspace"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
        {!selectedWorkspace && workspaces.map((workspace) => (
          <div key={workspace.id} className="relative group">
            <button
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
              onClick={() => handleWorkspaceSelect(workspace.id)}
              title={workspace.name}
            >
              <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
            </button>
            <button
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(workspace.id, workspace.name);
              }}
              title="Delete workspace"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <CreateWorkspaceForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onCreateWorkspace={handleCreateWorkspaceSubmit}
      />
      <DeleteWorkspaceDialog
        isOpen={!!workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        workspaceName={workspaceToDelete?.name || ''}
      />
    </>
  );
} 