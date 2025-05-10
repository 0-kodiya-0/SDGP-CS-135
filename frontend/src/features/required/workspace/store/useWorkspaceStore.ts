import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  addWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt'>) => void;
  selectWorkspace: (workspaceId: string) => void;
  deselectWorkspace: () => void;
  deleteWorkspace: (workspaceId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      selectedWorkspace: null,
      addWorkspace: (workspace) => {
        const newWorkspace: Workspace = {
          ...workspace,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
        }));
      },
      selectWorkspace: (workspaceId) => {
        set((state) => ({
          selectedWorkspace: state.workspaces.find((w) => w.id === workspaceId) || null,
        }));
      },
      deselectWorkspace: () => {
        set({ selectedWorkspace: null });
      },
      deleteWorkspace: (workspaceId) => {
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
          selectedWorkspace: state.selectedWorkspace?.id === workspaceId ? null : state.selectedWorkspace,
        }));
      },
    }),
    {
      name: 'workspace-storage',
    }
  )
); 