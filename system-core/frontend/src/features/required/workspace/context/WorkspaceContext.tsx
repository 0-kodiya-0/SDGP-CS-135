import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../conf/axios';
import {
    Workspace,
    WorkspaceMember,
    WorkspaceContent,
    WorkspaceFeatureType,
    CreateWorkspaceRequest,
    UpdateWorkspaceRequest,
    AddWorkspaceMemberRequest,
    ShareContentRequest
} from '../types/workspace.types';

interface WorkspaceContextType {
    workspaces: Workspace[];
    selectedWorkspace: Workspace | null;
    members: WorkspaceMember[];
    contents: WorkspaceContent[];
    loading: boolean;
    error: string | null;

    // Workspace management
    fetchWorkspaces: () => Promise<void>;
    getWorkspaceById: (workspaceId: string) => Promise<Workspace | null>;
    selectWorkspace: (workspaceId: string) => void;
    createWorkspace: (data: CreateWorkspaceRequest) => Promise<Workspace | null>;
    updateWorkspace: (workspaceId: string, data: UpdateWorkspaceRequest) => Promise<Workspace | null>;
    deleteWorkspace: (workspaceId: string) => Promise<boolean>;

    // Member management
    fetchMembers: (workspaceId: string) => Promise<void>;
    addMember: (workspaceId: string, data: AddWorkspaceMemberRequest) => Promise<WorkspaceMember | null>;
    updateMember: (workspaceId: string, accountId: string, data: any) => Promise<WorkspaceMember | null>;
    removeMember: (workspaceId: string, accountId: string) => Promise<boolean>;

    // Content management
    fetchContents: (workspaceId: string, type?: WorkspaceFeatureType) => Promise<void>;
    shareContent: (workspaceId: string, data: ShareContentRequest) => Promise<WorkspaceContent | null>;
    removeContent: (workspaceId: string, contentId: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [contents, setContents] = useState<WorkspaceContent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all workspaces for the current user
    const fetchWorkspaces = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/workspace`, {
                withCredentials: true
            });

            if (response.data.success) {
                setWorkspaces(response.data.data.workspaces);
            } else {
                setError(response.data.error?.message || 'Failed to fetch workspaces');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching workspaces');
        } finally {
            setLoading(false);
        }
    }, []);

    // Get a specific workspace by ID
    const getWorkspaceById = useCallback(async (workspaceId: string): Promise<Workspace | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/workspace/${workspaceId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                const workspace = response.data.data;

                // If this is the current selected workspace, update it
                if (selectedWorkspace?.id === workspaceId) {
                    setSelectedWorkspace(workspace);
                }

                // Update workspace in the list if it exists
                setWorkspaces(prev =>
                    prev.map(w => w.id === workspaceId ? workspace : w)
                );

                return workspace;
            } else {
                setError(response.data.error?.message || 'Failed to fetch workspace');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching workspace');
            return null;
        } finally {
            setLoading(false);
        }
    }, [selectedWorkspace]);

    // Select a workspace
    const selectWorkspace = useCallback((workspaceId: string) => {
        const workspace = workspaces.find(w => w.id === workspaceId) || null;
        setSelectedWorkspace(workspace);

        // If a workspace is selected, fetch its members and contents
        if (workspace) {
            fetchMembers(workspaceId);
            fetchContents(workspaceId);
        }
    }, [workspaces]);

    // Create a new workspace
    const createWorkspace = useCallback(async (data: CreateWorkspaceRequest): Promise<Workspace | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/workspace`, data, {
                withCredentials: true
            });

            if (response.data.success) {
                const newWorkspace = response.data.data;
                setWorkspaces(prev => [...prev, newWorkspace]);
                return newWorkspace;
            } else {
                setError(response.data.error?.message || 'Failed to create workspace');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while creating workspace');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update a workspace
    const updateWorkspace = useCallback(async (
        workspaceId: string,
        data: UpdateWorkspaceRequest
    ): Promise<Workspace | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.put(`${API_BASE_URL}/workspace/${workspaceId}`, data, {
                withCredentials: true
            });

            if (response.data.success) {
                const updatedWorkspace = response.data.data;

                // Update workspaces list
                setWorkspaces(prev =>
                    prev.map(w => w.id === workspaceId ? updatedWorkspace : w)
                );

                // Update selected workspace if it's the one being updated
                if (selectedWorkspace?.id === workspaceId) {
                    setSelectedWorkspace(updatedWorkspace);
                }

                return updatedWorkspace;
            } else {
                setError(response.data.error?.message || 'Failed to update workspace');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while updating workspace');
            return null;
        } finally {
            setLoading(false);
        }
    }, [selectedWorkspace]);

    // Delete a workspace
    const deleteWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.delete(`${API_BASE_URL}/workspace/${workspaceId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                // Remove from workspaces list
                setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));

                // Clear selected workspace if it's the one being deleted
                if (selectedWorkspace?.id === workspaceId) {
                    setSelectedWorkspace(null);
                }

                return true;
            } else {
                setError(response.data.error?.message || 'Failed to delete workspace');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while deleting workspace');
            return false;
        } finally {
            setLoading(false);
        }
    }, [selectedWorkspace]);

    // Fetch members of a workspace
    const fetchMembers = useCallback(async (workspaceId: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/workspace/${workspaceId}/members`, {
                withCredentials: true
            });

            if (response.data.success) {
                setMembers(response.data.data.members);
            } else {
                setError(response.data.error?.message || 'Failed to fetch workspace members');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching workspace members');
        } finally {
            setLoading(false);
        }
    }, []);

    // Add a member to a workspace
    const addMember = useCallback(async (
        workspaceId: string,
        data: AddWorkspaceMemberRequest
    ): Promise<WorkspaceMember | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/workspace/${workspaceId}/members`, data, {
                withCredentials: true
            });

            if (response.data.success) {
                const newMember = response.data.data;
                setMembers(prev => [...prev, newMember]);
                return newMember;
            } else {
                setError(response.data.error?.message || 'Failed to add member');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while adding member');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update a workspace member
    const updateMember = useCallback(async (
        workspaceId: string,
        accountId: string,
        data: any
    ): Promise<WorkspaceMember | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.put(
                `${API_BASE_URL}/workspace/${workspaceId}/members/${accountId}`,
                data,
                { withCredentials: true }
            );

            if (response.data.success) {
                const updatedMember = response.data.data;
                setMembers(prev =>
                    prev.map(m => m.accountId === accountId ? updatedMember : m)
                );
                return updatedMember;
            } else {
                setError(response.data.error?.message || 'Failed to update member');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while updating member');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Remove a member from a workspace
    const removeMember = useCallback(async (
        workspaceId: string,
        accountId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.delete(
                `${API_BASE_URL}/workspace/${workspaceId}/members/${accountId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setMembers(prev => prev.filter(m => m.accountId !== accountId));
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to remove member');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while removing member');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch contents of a workspace
    const fetchContents = useCallback(async (
        workspaceId: string,
        type?: WorkspaceFeatureType
    ) => {
        setLoading(true);
        setError(null);

        try {
            let url = `${API_BASE_URL}/workspace/${workspaceId}/content`;

            // If a specific content type is provided, use the feature-specific endpoint
            if (type) {
                url = `${API_BASE_URL}/workspace/${workspaceId}/content/${type}`;
            }

            const response = await axios.get(url, {
                withCredentials: true
            });

            if (response.data.success) {
                setContents(response.data.data.contents);
            } else {
                setError(response.data.error?.message || 'Failed to fetch workspace contents');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching workspace contents');
        } finally {
            setLoading(false);
        }
    }, []);

    // Share content to a workspace
    const shareContent = useCallback(async (
        workspaceId: string,
        data: ShareContentRequest
    ): Promise<WorkspaceContent | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/workspace/${workspaceId}/content/${data.contentType}`,
                data,
                { withCredentials: true }
            );

            if (response.data.success) {
                const newContent = response.data.data;
                setContents(prev => [...prev, newContent]);
                return newContent;
            } else {
                setError(response.data.error?.message || 'Failed to share content');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while sharing content');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Remove content from a workspace
    const removeContent = useCallback(async (
        workspaceId: string,
        contentId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.delete(
                `${API_BASE_URL}/workspace/${workspaceId}/content/${contentId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setContents(prev => prev.filter(c => c.id !== contentId));
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to remove content');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while removing content');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Load workspaces when component mounts
    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const value = {
        workspaces,
        selectedWorkspace,
        members,
        contents,
        loading,
        error,
        fetchWorkspaces,
        getWorkspaceById,
        selectWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        fetchMembers,
        addMember,
        updateMember,
        removeMember,
        fetchContents,
        shareContent,
        removeContent
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = (): WorkspaceContextType => {
    const context = useContext(WorkspaceContext);

    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }

    return context;
};