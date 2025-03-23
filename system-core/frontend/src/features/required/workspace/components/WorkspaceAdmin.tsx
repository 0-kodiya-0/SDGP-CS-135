import React, { useEffect, useState } from 'react';
import { Settings, Users, Trash2, Edit, Save, X, PlusCircle } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { WorkspaceFeatureType, WorkspaceRole, WorkspaceMember } from '../types/workspace.types';

interface WorkspaceAdminProps {
    workspaceId: string;
    accountId: string;
}

const WorkspaceAdmin: React.FC<WorkspaceAdminProps> = ({ workspaceId, accountId }) => {
    const {
        selectedWorkspace,
        members,
        loading,
        error,
        getWorkspaceById,
        fetchMembers,
        updateWorkspace,
        addMember,
        updateMember,
        removeMember
    } = useWorkspace();

    const [activeTab, setActiveTab] = useState<'general' | 'members' | 'features'>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');
    const [workspaceDescription, setWorkspaceDescription] = useState('');
    const [enabledFeatures, setEnabledFeatures] = useState<WorkspaceFeatureType[]>([]);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<WorkspaceRole>(WorkspaceRole.Viewer);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingMemberRole, setEditingMemberRole] = useState<WorkspaceRole>(WorkspaceRole.Viewer);

    // Load workspace and members
    useEffect(() => {
        if (workspaceId) {
            getWorkspaceById(workspaceId);
            fetchMembers(workspaceId);
        }
    }, [workspaceId, getWorkspaceById, fetchMembers]);

    // Update form state when workspace is loaded or changed
    useEffect(() => {
        if (selectedWorkspace) {
            setWorkspaceName(selectedWorkspace.name);
            setWorkspaceDescription(selectedWorkspace.description || '');
            setEnabledFeatures(
                selectedWorkspace.features
                    .filter(f => f.enabled)
                    .map(f => f.type)
            );
        }
    }, [selectedWorkspace]);

    // Toggle feature enabled/disabled
    const toggleFeature = (feature: WorkspaceFeatureType) => {
        if (enabledFeatures.includes(feature)) {
            setEnabledFeatures(enabledFeatures.filter(f => f !== feature));
        } else {
            setEnabledFeatures([...enabledFeatures, feature]);
        }
    };

    // Save workspace changes
    const handleSaveWorkspace = async () => {
        if (!selectedWorkspace) return;

        try {
            await updateWorkspace(selectedWorkspace.id, {
                name: workspaceName,
                description: workspaceDescription,
                features: Object.values(WorkspaceFeatureType).map(type => ({
                    type,
                    enabled: enabledFeatures.includes(type)
                }))
            });

            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update workspace:', err);
        }
    };

    // Cancel editing
    const handleCancelEdit = () => {
        if (selectedWorkspace) {
            setWorkspaceName(selectedWorkspace.name);
            setWorkspaceDescription(selectedWorkspace.description || '');
            setEnabledFeatures(
                selectedWorkspace.features
                    .filter(f => f.enabled)
                    .map(f => f.type)
            );
        }

        setIsEditing(false);
    };

    // Add new member
    const handleAddMember = async () => {
        if (!workspaceId || !newMemberEmail.trim()) return;

        try {
            await addMember(workspaceId, {
                accountId: newMemberEmail.trim(), // Using email as accountId for simplicity
                role: newMemberRole
            });

            // Reset form
            setNewMemberEmail('');
            setNewMemberRole(WorkspaceRole.Viewer);
            setIsAddingMember(false);

            // Refresh member list
            fetchMembers(workspaceId);
        } catch (err) {
            console.error('Failed to add member:', err);
        }
    };

    // Start editing a member's role
    const handleEditMember = (member: WorkspaceMember) => {
        setEditingMemberId(member.accountId);
        setEditingMemberRole(member.role);
    };

    // Save member role changes
    const handleSaveMemberEdit = async (member: WorkspaceMember) => {
        if (!workspaceId || !editingMemberId) return;

        try {
            await updateMember(workspaceId, member.accountId, {
                role: editingMemberRole
            });

            // Reset editing state
            setEditingMemberId(null);

            // Refresh member list
            fetchMembers(workspaceId);
        } catch (err) {
            console.error('Failed to update member:', err);
        }
    };

    // Cancel member editing
    const handleCancelMemberEdit = () => {
        setEditingMemberId(null);
    };

    // Remove a member
    const handleRemoveMember = async (member: WorkspaceMember) => {
        if (!workspaceId) return;

        if (window.confirm(`Are you sure you want to remove ${member.accountId} from this workspace?`)) {
            try {
                await removeMember(workspaceId, member.accountId);

                // Refresh member list
                fetchMembers(workspaceId);
            } catch (err) {
                console.error('Failed to remove member:', err);
            }
        }
    };

    // Get role display name
    const getRoleDisplayName = (role: WorkspaceRole): string => {
        switch (role) {
            case WorkspaceRole.Owner:
                return 'Owner';
            case WorkspaceRole.Admin:
                return 'Admin';
            case WorkspaceRole.Editor:
                return 'Editor';
            case WorkspaceRole.Viewer:
                return 'Viewer';
            default:
                return role;
        }
    };

    // Get role color class
    const getRoleColorClass = (role: WorkspaceRole): string => {
        switch (role) {
            case WorkspaceRole.Owner:
                return 'bg-purple-100 text-purple-800';
            case WorkspaceRole.Admin:
                return 'bg-red-100 text-red-800';
            case WorkspaceRole.Editor:
                return 'bg-blue-100 text-blue-800';
            case WorkspaceRole.Viewer:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!selectedWorkspace || loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-red-500 text-center">
                    <p>Failed to load workspace:</p>
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center">
                    <Settings className="w-6 h-6 text-gray-400 mr-3" />
                    <h1 className="text-xl font-semibold">
                        {selectedWorkspace.name} - Admin
                    </h1>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 font-medium text-sm ${activeTab === 'general'
                                ? 'text-blue-600 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        General Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-4 py-2 font-medium text-sm ${activeTab === 'members'
                                ? 'text-blue-600 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Members
                    </button>
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`px-4 py-2 font-medium text-sm ${activeTab === 'features'
                                ? 'text-blue-600 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Features
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {/* General Settings Tab */}
                {activeTab === 'general' && (
                    <div>
                        <div className="flex justify-between mb-6">
                            <h2 className="text-lg font-medium">Workspace Settings</h2>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1 flex items-center text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                </button>
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 flex items-center text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveWorkspace}
                                        className="px-3 py-1 flex items-center text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        <Save className="w-4 h-4 mr-1" />
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Workspace Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={workspaceName}
                                            onChange={(e) => setWorkspaceName(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{selectedWorkspace.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={workspaceDescription}
                                            onChange={(e) => setWorkspaceDescription(e.target.value)}
                                            rows={3}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-600">{selectedWorkspace.description || 'No description'}</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Created: {new Date(selectedWorkspace.created).toLocaleDateString()}
                                    <br />
                                    Last updated: {new Date(selectedWorkspace.updated).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div>
                        <div className="flex justify-between mb-6">
                            <h2 className="text-lg font-medium">Workspace Members</h2>
                            <button
                                onClick={() => setIsAddingMember(true)}
                                className="px-3 py-1 flex items-center text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Add Member
                            </button>
                        </div>

                        {/* Add Member Form */}
                        {isAddingMember && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-md font-medium mb-3">Add New Member</h3>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={newMemberEmail}
                                            onChange={(e) => setNewMemberEmail(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value as WorkspaceRole)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={WorkspaceRole.Admin}>Admin</option>
                                            <option value={WorkspaceRole.Editor}>Editor</option>
                                            <option value={WorkspaceRole.Viewer}>Viewer</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end space-x-2">
                                    <button
                                        onClick={() => setIsAddingMember(false)}
                                        className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMember}
                                        disabled={!newMemberEmail.trim()}
                                        className={`px-3 py-1.5 rounded ${newMemberEmail.trim()
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-blue-300 text-white cursor-not-allowed'
                                            }`}
                                    >
                                        Add Member
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Members List */}
                        {members.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No members found</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Member
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {members.map(member => (
                                                <tr key={member.accountId}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {member.accountId}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {editingMemberId === member.accountId ? (
                                                            <select
                                                                value={editingMemberRole}
                                                                onChange={(e) => setEditingMemberRole(e.target.value as WorkspaceRole)}
                                                                className="p-1 text-sm border border-gray-300 rounded"
                                                                disabled={member.role === WorkspaceRole.Owner}
                                                            >
                                                                <option value={WorkspaceRole.Admin}>Admin</option>
                                                                <option value={WorkspaceRole.Editor}>Editor</option>
                                                                <option value={WorkspaceRole.Viewer}>Viewer</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColorClass(member.role)}`}>
                                                                {getRoleDisplayName(member.role)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(member.joinedAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {member.role !== WorkspaceRole.Owner && (
                                                            <>
                                                                {editingMemberId === member.accountId ? (
                                                                    <div className="flex justify-end space-x-2">
                                                                        <button
                                                                            onClick={() => handleCancelMemberEdit()}
                                                                            className="text-gray-600 hover:text-gray-900"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSaveMemberEdit(member)}
                                                                            className="text-blue-600 hover:text-blue-900"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex justify-end space-x-3">
                                                                        <button
                                                                            onClick={() => handleEditMember(member)}
                                                                            className="text-blue-600 hover:text-blue-900"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRemoveMember(member)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                    <div>
                        <div className="flex justify-between mb-6">
                            <h2 className="text-lg font-medium">Workspace Features</h2>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1 flex items-center text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                </button>
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 flex items-center text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveWorkspace}
                                        className="px-3 py-1 flex items-center text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        <Save className="w-4 h-4 mr-1" />
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Feature
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.values(WorkspaceFeatureType).map(feature => {
                                        const isEnabled = isEditing
                                            ? enabledFeatures.includes(feature)
                                            : selectedWorkspace.features.some(f => f.type === feature && f.enabled);

                                        return (
                                            <tr key={feature}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {feature.charAt(0).toUpperCase() + feature.slice(1)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isEditing ? (
                                                        <label className="inline-flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={enabledFeatures.includes(feature)}
                                                                onChange={() => toggleFeature(feature)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-900">
                                                                {enabledFeatures.includes(feature) ? 'Enabled' : 'Disabled'}
                                                            </span>
                                                        </label>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {isEnabled ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {isEditing && (
                            <p className="text-sm text-gray-500 mt-4">
                                Disabling a feature will hide it from the workspace but won't delete any shared content.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceAdmin;