import {
    ShareContentRequest,
    WorkspaceFeatureType,
    WorkspaceContent
} from '../workspace.types';
import { shareContentToWorkspace, getWorkspaceContent } from '../workspace.service';

/**
 * Share a file to a workspace
 * @param workspaceId The workspace ID
 * @param accountId The account ID of the user sharing the file
 * @param fileId The Google Drive file ID
 * @param metadata Additional metadata about the file
 */
export const shareFileToWorkspace = async (
    workspaceId: string,
    accountId: string,
    fileId: string,
    metadata: {
        name?: string;
        description?: string;
        mimeType?: string;
        size?: number;
        createdTime?: string;
        modifiedTime?: string;
        thumbnailUrl?: string;
        webViewLink?: string;
        iconLink?: string;
    }
): Promise<WorkspaceContent | null> => {
    const request: ShareContentRequest = {
        contentId: fileId,
        contentType: WorkspaceFeatureType.Files,
        metadata: {
            title: metadata.name || 'Untitled File',
            description: metadata.description || '',
            createdAt: metadata.createdTime,
            modifiedAt: metadata.modifiedTime,
            fileType: metadata.mimeType,
            size: metadata.size,
            thumbnailUrl: metadata.thumbnailUrl,
            url: metadata.webViewLink,
            iconLink: metadata.iconLink
        }
    };

    return shareContentToWorkspace(workspaceId, accountId, request);
};

/**
 * Get all files shared in a workspace
 * @param workspaceId The workspace ID
 */
export const getWorkspaceFiles = async (
    workspaceId: string
): Promise<WorkspaceContent[]> => {
    return getWorkspaceContent(workspaceId, WorkspaceFeatureType.Files);
};

/**
 * Format a Google Drive file for workspace display
 * @param file The Google Drive file object
 */
export const formatFileForWorkspace = (file: any): {
    name: string;
    description: string;
    mimeType: string;
    size: number;
    createdTime: string;
    modifiedTime: string;
    thumbnailUrl: string;
    webViewLink: string;
    iconLink: string;
} => {
    return {
        name: file.name || 'Untitled File',
        description: file.description || '',
        mimeType: file.mimeType || '',
        size: file.size || 0,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        thumbnailUrl: file.thumbnailLink || '',
        webViewLink: file.webViewLink || '',
        iconLink: file.iconLink || ''
    };
};