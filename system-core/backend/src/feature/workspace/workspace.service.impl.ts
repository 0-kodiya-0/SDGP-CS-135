import {
    shareEmailToWorkspace,
    getWorkspaceEmails,
    formatEmailForWorkspace
} from './services/workspace-email.service';

import {
    shareFileToWorkspace,
    getWorkspaceFiles,
    formatFileForWorkspace
} from './services/workspace-files.service';

import {
    shareCalendarEventToWorkspace,
    getWorkspaceCalendarEvents,
    formatCalendarEventForWorkspace
} from './services/workspace-calendar.service';

import {
    shareContactToWorkspace,
    getWorkspaceContacts,
    formatContactForWorkspace
} from './services/workspace-contacts.service';

import {
    Workspace,
    WorkspaceContent,
    WorkspaceFeatureType,
    WorkspaceContentMetadata
} from './workspace.types';

/**
 * Share content to a workspace based on content type
 * This is a facade that routes to the appropriate service
 */
export const shareContentToWorkspaceByType = async (
    workspaceId: string,
    accountId: string,
    contentId: string,
    contentType: WorkspaceFeatureType,
    metadata: WorkspaceContentMetadata
): Promise<WorkspaceContent | null> => {
    switch (contentType) {
        case WorkspaceFeatureType.Email:
            return shareEmailToWorkspace(
                workspaceId,
                accountId,
                contentId,
                {
                    subject: metadata.title,
                    sender: metadata.sender,
                    date: metadata.createdAt,
                    snippet: metadata.description,
                    hasAttachment: metadata.hasAttachment,
                    labels: metadata.labels
                }
            );

        case WorkspaceFeatureType.Files:
            return shareFileToWorkspace(
                workspaceId,
                accountId,
                contentId,
                {
                    name: metadata.title,
                    description: metadata.description,
                    mimeType: metadata.fileType,
                    size: metadata.size,
                    createdTime: metadata.createdAt,
                    modifiedTime: metadata.modifiedAt,
                    thumbnailUrl: metadata.thumbnailUrl,
                    webViewLink: metadata.url,
                    iconLink: metadata.iconLink
                }
            );

        case WorkspaceFeatureType.Calendar:
            return shareCalendarEventToWorkspace(
                workspaceId,
                accountId,
                contentId,
                {
                    summary: metadata.title,
                    description: metadata.description,
                    location: metadata.location,
                    start: { dateTime: metadata.startDateTime },
                    end: { dateTime: metadata.endDateTime },
                    creator: metadata.creator,
                    organizer: metadata.organizer,
                    attendees: metadata.attendees,
                    recurrence: metadata.recurrence,
                    htmlLink: metadata.url
                }
            );

        case WorkspaceFeatureType.Contacts:
            return shareContactToWorkspace(
                workspaceId,
                accountId,
                contentId,
                {
                    name: metadata.title,
                    givenName: metadata.givenName,
                    familyName: metadata.familyName,
                    emailAddresses: metadata.emailAddresses,
                    phoneNumbers: metadata.phoneNumbers,
                    organizations: metadata.organizations,
                    addresses: metadata.addresses,
                    photoUrl: metadata.thumbnailUrl,
                    etag: metadata.etag
                }
            );

        default:
            console.error(`Unknown content type: ${contentType}`);
            return null;
    }
};

/**
 * Get content from a workspace by feature type
 * This is a facade that routes to the appropriate service
 */
export const getWorkspaceContentByType = async (
    workspaceId: string,
    contentType: WorkspaceFeatureType
): Promise<WorkspaceContent[]> => {
    switch (contentType) {
        case WorkspaceFeatureType.Email:
            return getWorkspaceEmails(workspaceId);

        case WorkspaceFeatureType.Files:
            return getWorkspaceFiles(workspaceId);

        case WorkspaceFeatureType.Calendar:
            return getWorkspaceCalendarEvents(workspaceId);

        case WorkspaceFeatureType.Contacts:
            return getWorkspaceContacts(workspaceId);

        default:
            console.error(`Unknown content type: ${contentType}`);
            return [];
    }
};

/**
 * Format content data for sharing to workspace
 * This is a facade that routes to the appropriate formatter
 */
export const formatContentForWorkspace = (
    contentType: WorkspaceFeatureType,
    originalContent: any
): any => {
    switch (contentType) {
        case WorkspaceFeatureType.Email:
            return formatEmailForWorkspace(originalContent);

        case WorkspaceFeatureType.Files:
            return formatFileForWorkspace(originalContent);

        case WorkspaceFeatureType.Calendar:
            return formatCalendarEventForWorkspace(originalContent);

        case WorkspaceFeatureType.Contacts:
            return formatContactForWorkspace(originalContent);

        default:
            console.error(`Unknown content type: ${contentType}`);
            return {};
    }
};