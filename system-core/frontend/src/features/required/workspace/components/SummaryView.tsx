import React, { useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Plus, Settings, Users, Calendar, File, Mail, UserCheck } from 'lucide-react';
import { WorkspaceFeatureType } from '../types/workspace.types';
import { useTabs } from '../../tab_view';
import WorkspaceCalendar from './WorkspaceCalendar';
import WorkspaceContacts from './WorkspaceContacts';
import WorkspaceEmails from './WorkspaceEmails';
import WorkspaceFiles from './WorkspaceFiles';
import WorkspaceList from './WorkspaceList';
import WorkspaceAdmin from './WorkspaceAdmin';

interface SummaryViewProps {
    accountId: string;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ accountId }) => {
    const {
        workspaces,
        selectedWorkspace,
        contents,
        loading,
        error,
        selectWorkspace,
        fetchContents
    } = useWorkspace();

    const { addTab } = useTabs();

    // When component mounts, fetch content if a workspace is selected
    useEffect(() => {
        if (selectedWorkspace) {
            fetchContents(selectedWorkspace.id);
        }
    }, [selectedWorkspace, fetchContents]);

    // Open workspace creation tab
    const handleCreateWorkspace = () => {
        addTab('Create Workspace', <WorkspaceList accountId={accountId} createMode={true} />);
    };

    // Open admin panel in a tab
    const handleOpenAdmin = () => {
        if (!selectedWorkspace) return;
        addTab(
            `${selectedWorkspace.name} - Admin`,
            <WorkspaceAdmin workspaceId={selectedWorkspace.id} accountId={accountId} />
        );
    };

    // Open feature-specific tab
    const openFeatureTab = (feature: WorkspaceFeatureType) => {
        if (!selectedWorkspace) return;

        let title = '';
        let content: React.ReactNode;

        switch (feature) {
            case WorkspaceFeatureType.Email:
                title = `${selectedWorkspace.name} - Emails`;
                content = <WorkspaceEmails workspaceId={selectedWorkspace.id} />;
                break;
            case WorkspaceFeatureType.Files:
                title = `${selectedWorkspace.name} - Files`;
                content = <WorkspaceFiles workspaceId={selectedWorkspace.id} />;
                break;
            case WorkspaceFeatureType.Calendar:
                title = `${selectedWorkspace.name} - Calendar`;
                content = <WorkspaceCalendar workspaceId={selectedWorkspace.id} />;
                break;
            case WorkspaceFeatureType.Contacts:
                title = `${selectedWorkspace.name} - Contacts`;
                content = <WorkspaceContacts workspaceId={selectedWorkspace.id} />;
                break;
            default:
                return;
        }

        addTab(title, content);
    };

    // Count content by feature type
    const getContentCount = (featureType: WorkspaceFeatureType): number => {
        return contents.filter(content => content.contentType === featureType).length;
    };

    // Check if feature is enabled
    const isFeatureEnabled = (featureType: WorkspaceFeatureType): boolean => {
        if (!selectedWorkspace) return false;
        const feature = selectedWorkspace.features.find(f => f.type === featureType);
        return !!feature && feature.enabled;
    };

    // Render no workspace selected state
    if (!selectedWorkspace) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-semibold mb-6">No Workspace Selected</h2>

                {workspaces.length > 0 ? (
                    <div className="w-full max-w-md">
                        <p className="mb-4 text-gray-600">Please select a workspace from the list below:</p>
                        <div className="space-y-2 mb-6">
                            {workspaces.map(workspace => (
                                <button
                                    key={workspace.id}
                                    onClick={() => selectWorkspace(workspace.id)}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                                >
                                    <p className="font-medium">{workspace.name}</p>
                                    {workspace.description && (
                                        <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-md">
                        <p className="mb-4 text-gray-600">You don't have any workspaces yet. Create your first workspace to get started.</p>
                    </div>
                )}

                <button
                    onClick={handleCreateWorkspace}
                    className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Workspace
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Workspace header */}
            <header className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{selectedWorkspace.name}</h1>
                        {selectedWorkspace.description && (
                            <p className="text-gray-500 mt-1">{selectedWorkspace.description}</p>
                        )}
                    </div>
                    <button
                        onClick={handleOpenAdmin}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        title="Workspace Settings"
                    >
                        <Settings className="w-5 h-5" />
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
            {error && (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-red-500 text-center">
                        <p>Something went wrong:</p>
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Workspace content */}
            {!loading && !error && (
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email feature */}
                        <div
                            className={`border rounded-lg overflow-hidden ${!isFeatureEnabled(WorkspaceFeatureType.Email) ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between bg-blue-50 px-4 py-3 border-b">
                                <div className="flex items-center">
                                    <Mail className="w-5 h-5 text-blue-500 mr-2" />
                                    <h2 className="font-medium">Emails</h2>
                                </div>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {getContentCount(WorkspaceFeatureType.Email)}
                                </span>
                            </div>
                            <div className="p-4 bg-white">
                                {getContentCount(WorkspaceFeatureType.Email) > 0 ? (
                                    <div className="space-y-3">
                                        {contents
                                            .filter(content => content.contentType === WorkspaceFeatureType.Email)
                                            .slice(0, 3)
                                            .map(content => (
                                                <div key={content.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                                                    <p className="font-medium">{content.metadata.title || 'No Subject'}</p>
                                                    <p className="text-sm text-gray-500 truncate">{content.metadata.description || content.metadata.snippet || ''}</p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No emails shared to this workspace yet.</p>
                                )}
                                <button
                                    onClick={() => openFeatureTab(WorkspaceFeatureType.Email)}
                                    className="mt-4 w-full py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                    disabled={!isFeatureEnabled(WorkspaceFeatureType.Email)}
                                >
                                    View All Emails
                                </button>
                            </div>
                        </div>

                        {/* Files feature */}
                        <div
                            className={`border rounded-lg overflow-hidden ${!isFeatureEnabled(WorkspaceFeatureType.Files) ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between bg-green-50 px-4 py-3 border-b">
                                <div className="flex items-center">
                                    <File className="w-5 h-5 text-green-500 mr-2" />
                                    <h2 className="font-medium">Files</h2>
                                </div>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {getContentCount(WorkspaceFeatureType.Files)}
                                </span>
                            </div>
                            <div className="p-4 bg-white">
                                {getContentCount(WorkspaceFeatureType.Files) > 0 ? (
                                    <div className="space-y-3">
                                        {contents
                                            .filter(content => content.contentType === WorkspaceFeatureType.Files)
                                            .slice(0, 3)
                                            .map(content => (
                                                <div key={content.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                                                    <p className="font-medium">{content.metadata.title || 'Untitled File'}</p>
                                                    <p className="text-sm text-gray-500">{content.metadata.fileType || 'Unknown type'}</p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No files shared to this workspace yet.</p>
                                )}
                                <button
                                    onClick={() => openFeatureTab(WorkspaceFeatureType.Files)}
                                    className="mt-4 w-full py-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                    disabled={!isFeatureEnabled(WorkspaceFeatureType.Files)}
                                >
                                    View All Files
                                </button>
                            </div>
                        </div>

                        {/* Calendar feature */}
                        <div
                            className={`border rounded-lg overflow-hidden ${!isFeatureEnabled(WorkspaceFeatureType.Calendar) ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between bg-purple-50 px-4 py-3 border-b">
                                <div className="flex items-center">
                                    <Calendar className="w-5 h-5 text-purple-500 mr-2" />
                                    <h2 className="font-medium">Calendar</h2>
                                </div>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {getContentCount(WorkspaceFeatureType.Calendar)}
                                </span>
                            </div>
                            <div className="p-4 bg-white">
                                {getContentCount(WorkspaceFeatureType.Calendar) > 0 ? (
                                    <div className="space-y-3">
                                        {contents
                                            .filter(content => content.contentType === WorkspaceFeatureType.Calendar)
                                            .slice(0, 3)
                                            .map(content => (
                                                <div key={content.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                                                    <p className="font-medium">{content.metadata.title || 'Untitled Event'}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {content.metadata.startDateTime ? new Date(content.metadata.startDateTime).toLocaleDateString() : 'No date'}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No events shared to this workspace yet.</p>
                                )}
                                <button
                                    onClick={() => openFeatureTab(WorkspaceFeatureType.Calendar)}
                                    className="mt-4 w-full py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                    disabled={!isFeatureEnabled(WorkspaceFeatureType.Calendar)}
                                >
                                    View All Events
                                </button>
                            </div>
                        </div>

                        {/* Contacts feature */}
                        <div
                            className={`border rounded-lg overflow-hidden ${!isFeatureEnabled(WorkspaceFeatureType.Contacts) ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between bg-amber-50 px-4 py-3 border-b">
                                <div className="flex items-center">
                                    <UserCheck className="w-5 h-5 text-amber-500 mr-2" />
                                    <h2 className="font-medium">Contacts</h2>
                                </div>
                                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {getContentCount(WorkspaceFeatureType.Contacts)}
                                </span>
                            </div>
                            <div className="p-4 bg-white">
                                {getContentCount(WorkspaceFeatureType.Contacts) > 0 ? (
                                    <div className="space-y-3">
                                        {contents
                                            .filter(content => content.contentType === WorkspaceFeatureType.Contacts)
                                            .slice(0, 3)
                                            .map(content => (
                                                <div key={content.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                                                    <p className="font-medium">{content.metadata.title || 'Unnamed Contact'}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {content.metadata.emailAddresses?.[0]?.value || 'No email'}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No contacts shared to this workspace yet.</p>
                                )}
                                <button
                                    onClick={() => openFeatureTab(WorkspaceFeatureType.Contacts)}
                                    className="mt-4 w-full py-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
                                    disabled={!isFeatureEnabled(WorkspaceFeatureType.Contacts)}
                                >
                                    View All Contacts
                                </button>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="border rounded-lg overflow-hidden md:col-span-2">
                            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
                                <div className="flex items-center">
                                    <Users className="w-5 h-5 text-gray-500 mr-2" />
                                    <h2 className="font-medium">Team Members</h2>
                                </div>
                                <button
                                    onClick={handleOpenAdmin}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Manage
                                </button>
                            </div>
                            <div className="p-4 bg-white">
                                <p className="text-sm text-gray-500">
                                    Manage team members and permissions in the Workspace Admin section.
                                </p>
                                <button
                                    onClick={handleOpenAdmin}
                                    className="mt-4 w-full py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                                >
                                    Open Admin Panel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SummaryView;