import {
    ShareContentRequest,
    WorkspaceFeatureType,
    WorkspaceContent
} from '../workspace.types';
import { shareContentToWorkspace, getWorkspaceContent } from '../workspace.service';

/**
 * Share an email to a workspace
 * @param workspaceId The workspace ID
 * @param accountId The account ID of the user sharing the email
 * @param emailId The Gmail message ID
 * @param metadata Additional metadata about the email
 */
export const shareEmailToWorkspace = async (
    workspaceId: string,
    accountId: string,
    emailId: string,
    metadata: {
        subject?: string;
        sender?: string;
        date?: string;
        snippet?: string;
        hasAttachment?: boolean;
        labels?: string[];
    }
): Promise<WorkspaceContent | null> => {
    const request: ShareContentRequest = {
        contentId: emailId,
        contentType: WorkspaceFeatureType.Email,
        metadata: {
            title: metadata.subject || 'No Subject',
            description: metadata.snippet || '',
            createdAt: metadata.date,
            sender: metadata.sender,
            hasAttachment: metadata.hasAttachment || false,
            labels: metadata.labels || []
        }
    };

    return shareContentToWorkspace(workspaceId, accountId, request);
};

/**
 * Get all emails shared in a workspace
 * @param workspaceId The workspace ID
 */
export const getWorkspaceEmails = async (
    workspaceId: string
): Promise<WorkspaceContent[]> => {
    return getWorkspaceContent(workspaceId, WorkspaceFeatureType.Email);
};

/**
 * Format a Gmail message for workspace display
 * @param message The Gmail message object
 */
export const formatEmailForWorkspace = (message: any): {
    subject: string;
    sender: string;
    date: string;
    snippet: string;
    hasAttachment: boolean;
    labels: string[];
} => {
    // Extract headers
    const headers = message.payload?.headers || [];

    // Find specific headers
    const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
    const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
    const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

    // Check for attachments
    const hasAttachment = !!(message.payload?.parts?.some((part: any) => part.filename && part.filename.length > 0));

    return {
        subject,
        sender: from,
        date,
        snippet: message.snippet || '',
        hasAttachment,
        labels: message.labelIds || []
    };
};