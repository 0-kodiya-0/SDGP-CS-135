import React from 'react';
import { Shield } from 'lucide-react';
import { ServiceType, ScopeLevel } from '../types/types.google.api';

interface PermissionRequestProps {
    serviceType: ServiceType;
    requiredScopes: ScopeLevel[];
    loading: boolean;
    error: string | null;
    onRequestPermission: () => void;
    title?: string;
    description?: string;
    accountId?: string; // This is no longer used but kept for compatibility
}

// Helper function to generate appropriate descriptions based on service and scopes
function getScopeDescription(service: ServiceType, scopes: ScopeLevel[]): string {
    const hasFullAccess = scopes.includes('full');
    const hasReadOnly = scopes.includes('readonly');
    const hasSend = scopes.includes('send');
    const hasCompose = scopes.includes('compose');
    const hasEvents = scopes.includes('events');
    const hasFile = scopes.includes('file');
    const hasCreate = scopes.includes('create');
    const hasEdit = scopes.includes('edit');

    switch (service) {
        case 'gmail':
            if (hasFullAccess) {
                return "To use Gmail features, we need your permission to access your emails, labels, and send messages on your behalf.";
            } else if (hasSend && hasReadOnly) {
                return "To use Gmail features, we need your permission to read your emails and send messages on your behalf.";
            } else if (hasReadOnly) {
                return "To use Gmail features, we need your permission to read your emails and labels.";
            } else if (hasSend) {
                return "To use Gmail features, we need your permission to send emails on your behalf.";
            } else if (hasCompose) {
                return "To use Gmail features, we need your permission to create draft emails.";
            }
            break;

        case 'calendar':
            if (hasFullAccess) {
                return "To use Calendar features, we need your permission to read and update your calendar events.";
            } else if (hasEvents) {
                return "To use Calendar features, we need your permission to add events to your calendar.";
            } else if (hasReadOnly) {
                return "To use Calendar features, we need your permission to read your calendar events.";
            }
            break;

        case 'drive':
            if (hasFullAccess) {
                return "To use Drive features, we need your permission to access and modify files in your Google Drive.";
            } else if (hasFile) {
                return "To use Drive features, we need your permission to access and modify files created by this app.";
            } else if (hasReadOnly) {
                return "To use Drive features, we need your permission to access files in your Google Drive.";
            }
            break;

        case 'docs':
        case 'sheets':
            if (hasFullAccess) {
                return `To use ${service === 'docs' ? 'Docs' : 'Sheets'} features, we need your permission to access and modify your ${service === 'docs' ? 'documents' : 'spreadsheets'}.`;
            } else if (hasCreate || hasEdit) {
                return `To use ${service === 'docs' ? 'Docs' : 'Sheets'} features, we need your permission to create or edit ${service === 'docs' ? 'documents' : 'spreadsheets'}.`;
            } else if (hasReadOnly) {
                return `To use ${service === 'docs' ? 'Docs' : 'Sheets'} features, we need your permission to read your ${service === 'docs' ? 'documents' : 'spreadsheets'}.`;
            }
            break;

        case 'people':
            if (hasFullAccess) {
                return "To use Contacts features, we need your permission to access and modify your contacts.";
            } else if (hasReadOnly) {
                return "To use Contacts features, we need your permission to read your contacts.";
            }
            break;

        case 'meet':
            if (hasFullAccess) {
                return "To use Meet features, we need your permission to schedule and manage video meetings.";
            } else if (hasReadOnly) {
                return "To use Meet features, we need your permission to read your scheduled meetings.";
            }
            break;
    }

    // Generic fallback
    return `To use ${service.charAt(0).toUpperCase() + service.slice(1)} features, we need additional permissions from your Google account.`;
}

export const GooglePermissionRequest: React.FC<PermissionRequestProps> = ({
    serviceType,
    requiredScopes,
    loading,
    error,
    onRequestPermission,
    title,
    description
}) => {
    // Formatted service name (first letter uppercase)
    const serviceName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);

    // Default title and description
    const defaultTitle = `${serviceName} Access Required`;
    const defaultDescription = getScopeDescription(serviceType, requiredScopes);

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <Shield className="w-16 h-16 text-blue-500 mb-4" />

            <h2 className="text-xl font-semibold mb-2">
                {title || defaultTitle}
            </h2>

            <p className="text-gray-600 text-center mb-6">
                {description || defaultDescription}
            </p>

            <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                onClick={onRequestPermission}
                disabled={loading}
            >
                {loading ? 'Requesting Access...' : `Grant ${serviceName} Access`}
            </button>

            {error && (
                <p className="text-red-500 mt-4 text-sm">
                    Error: {error}
                </p>
            )}

            <p className="text-amber-600 mt-4 text-sm">
                Please accept the permission request in the popup window. If you don't see it, check if it was blocked by your browser.
            </p>
        </div>
    );
};