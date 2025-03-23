import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Trash2, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { WorkspaceFeatureType, WorkspaceContent } from '../types/workspace.types';

// Import feature-specific components
import WorkspaceEmails from './WorkspaceEmails';
import WorkspaceFiles from './WorkspaceFiles';
import WorkspaceCalendar from './WorkspaceCalendar';
import WorkspaceContacts from './WorkspaceContacts';

interface ExpandViewProps {
    accountId: string;
}

export const ExpandView: React.FC<ExpandViewProps> = ({ accountId }) => {
    const { workspaceId, featureType } = useParams<{ workspaceId: string; featureType: WorkspaceFeatureType }>();
    const navigate = useNavigate();
    const { selectedWorkspace, selectWorkspace } = useWorkspace();
    const [contentType, setContentType] = useState<WorkspaceFeatureType>(
        (featureType as WorkspaceFeatureType) || WorkspaceFeatureType.Email
    );

    // Select the workspace when component mounts
    useEffect(() => {
        if (workspaceId && (!selectedWorkspace || selectedWorkspace.id !== workspaceId)) {
            selectWorkspace(workspaceId);
        }
    }, [workspaceId, selectedWorkspace, selectWorkspace]);

    // Update content type when URL param changes
    useEffect(() => {
        if (featureType && Object.values(WorkspaceFeatureType).includes(featureType as WorkspaceFeatureType)) {
            setContentType(featureType as WorkspaceFeatureType);
        }
    }, [featureType]);

    // Navigate back to summary view
    const handleBackToSummary = () => {
        navigate(`/app/${accountId}/workspace`);
    };

    // Generic function to render the feature-specific component
    const renderFeatureComponent = () => {
        if (!selectedWorkspace) return null;

        switch (contentType) {
            case WorkspaceFeatureType.Email:
                return <WorkspaceEmails workspaceId={selectedWorkspace.id} />;
            case WorkspaceFeatureType.Files:
                return <WorkspaceFiles workspaceId={selectedWorkspace.id} />;
            case WorkspaceFeatureType.Calendar:
                return <WorkspaceCalendar workspaceId={selectedWorkspace.id} />;
            case WorkspaceFeatureType.Contacts:
                return <WorkspaceContacts workspaceId={selectedWorkspace.id} />;
            default:
                return <div>Feature not found</div>;
        }
    };

    // Get feature title
    const getFeatureTitle = () => {
        switch (contentType) {
            case WorkspaceFeatureType.Email:
                return 'Emails';
            case WorkspaceFeatureType.Files:
                return 'Files';
            case WorkspaceFeatureType.Calendar:
                return 'Calendar';
            case WorkspaceFeatureType.Contacts:
                return 'Contacts';
            default:
                return 'Feature';
        }
    };

    // If no workspace is selected, show loading or error
    if (!selectedWorkspace) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                <p>Loading workspace...</p>
            </div>
        );
    }

    // Check if feature is enabled
    const isFeatureEnabled = selectedWorkspace.features.some(
        f => f.type === contentType && f.enabled
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={handleBackToSummary}
                            className="mr-4 p-1 rounded-full hover:bg-gray-100"
                            title="Back to Workspace"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold flex items-center">
                                {selectedWorkspace.name} - {getFeatureTitle()}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">{selectedWorkspace.description}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        {/* Feature-specific actions could go here */}
                    </div>
                </div>
            </header>

            {/* Feature is disabled warning */}
            {!isFeatureEnabled && (
                <div className="bg-amber-50 p-4 border-b border-amber-200">
                    <div className="flex items-center text-amber-800">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <p>This feature is disabled in the workspace. Enable it in workspace settings.</p>
                    </div>
                </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-auto">
                {isFeatureEnabled ? (
                    renderFeatureComponent()
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Feature Disabled</h2>
                        <p className="text-gray-600 max-w-md">
                            This feature is currently disabled in the workspace.
                            A workspace administrator can enable it in the workspace settings.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpandView;