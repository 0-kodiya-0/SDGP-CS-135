import {
    ShareContentRequest,
    WorkspaceFeatureType,
    WorkspaceContent
} from '../workspace.types';
import { shareContentToWorkspace, getWorkspaceContent } from '../workspace.service';

/**
 * Share a contact to a workspace
 * @param workspaceId The workspace ID
 * @param accountId The account ID of the user sharing the contact
 * @param contactId The Google Contact resource name
 * @param metadata Additional metadata about the contact
 */
export const shareContactToWorkspace = async (
    workspaceId: string,
    accountId: string,
    contactId: string,
    metadata: {
        name?: string;
        givenName?: string;
        familyName?: string;
        emailAddresses?: Array<{ value: string, type?: string }>;
        phoneNumbers?: Array<{ value: string, type?: string }>;
        organizations?: Array<{ name: string, title?: string }>;
        addresses?: Array<{ formattedValue: string, type?: string }>;
        photoUrl?: string;
        etag?: string;
    }
): Promise<WorkspaceContent | null> => {
    const request: ShareContentRequest = {
        contentId: contactId,
        contentType: WorkspaceFeatureType.Contacts,
        metadata: {
            title: metadata.name || 'Unnamed Contact',
            description: metadata.organizations?.map(org => `${org.name}${org.title ? ` - ${org.title}` : ''}`).join(', ') || '',
            givenName: metadata.givenName,
            familyName: metadata.familyName,
            emailAddresses: metadata.emailAddresses,
            phoneNumbers: metadata.phoneNumbers,
            organizations: metadata.organizations,
            addresses: metadata.addresses,
            thumbnailUrl: metadata.photoUrl,
            etag: metadata.etag
        }
    };

    return shareContentToWorkspace(workspaceId, accountId, request);
};

/**
 * Get all contacts shared in a workspace
 * @param workspaceId The workspace ID
 */
export const getWorkspaceContacts = async (
    workspaceId: string
): Promise<WorkspaceContent[]> => {
    return getWorkspaceContent(workspaceId, WorkspaceFeatureType.Contacts);
};

/**
 * Format a Google Contact for workspace display
 * @param contact The Google Contact object
 */
export const formatContactForWorkspace = (contact: any): {
    name: string;
    givenName: string;
    familyName: string;
    emailAddresses: Array<{ value: string, type?: string }>;
    phoneNumbers: Array<{ value: string, type?: string }>;
    organizations: Array<{ name: string, title?: string }>;
    addresses: Array<{ formattedValue: string, type?: string }>;
    photoUrl: string;
    etag: string;
} => {
    // Extract name components
    const names = contact.names?.[0] || {};
    const givenName = names.givenName || '';
    const familyName = names.familyName || '';
    const displayName = names.displayName || `${givenName} ${familyName}`.trim() || 'Unnamed Contact';

    return {
        name: displayName,
        givenName,
        familyName,
        emailAddresses: contact.emailAddresses || [],
        phoneNumbers: contact.phoneNumbers || [],
        organizations: contact.organizations || [],
        addresses: contact.addresses || [],
        photoUrl: contact.photos?.[0]?.url || '',
        etag: contact.etag || ''
    };
};