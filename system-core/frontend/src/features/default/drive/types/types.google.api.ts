/**
 * Frontend type definitions for Google Drive API
 * Based on the backend drive.types.ts, but modified for frontend use
 */

// Define corpora type explicitly
export type DriveCorpora = 'user' | 'drive' | 'domain' | 'allDrives';

// Role and Type for permissions
export type PermissionRole = 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
export type PermissionType = 'user' | 'group' | 'domain' | 'anyone';

// Base file interface
export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
    createdTime?: string;
    modifiedTime?: string;
    size?: string;
    parents?: string[];
    shared?: boolean;
    sharingUser?: {
        displayName?: string;
        emailAddress?: string;
        photoLink?: string;
    };
    capabilities?: {
        canDelete?: boolean;
        canDownload?: boolean;
        canEdit?: boolean;
        canShare?: boolean;
        canRename?: boolean;
        canMove?: boolean;
        canCopy?: boolean;
    };
    description?: string;
    [key: string]: any; // For additional properties returned by the API
}

// Permission interface
export interface Permission {
    id: string;
    type: PermissionType;
    emailAddress?: string;
    domain?: string;
    role: PermissionRole;
    displayName?: string;
    photoLink?: string;
    deleted?: boolean;
    allowFileDiscovery?: boolean;
    expirationTime?: string;
    [key: string]: any; // For additional properties
}

// Response with pagination
export interface DriveFileList {
    files: DriveFile[];
    nextPageToken?: string;
}

export interface PermissionList {
    permissions: Permission[];
}

// Request interfaces

export interface GetFilesParams {
    q?: string;
    fields?: string;
    orderBy?: string;
    spaces?: string;
    includeItemsFromAllDrives?: boolean;
    supportsAllDrives?: boolean;
    corpora?: DriveCorpora;
    driveId?: string;
    includeTeamDriveItems?: boolean;
    teamDriveId?: string;
    maxResults?: number;
    pageToken?: string;
}

export interface GetFileParams {
    fields?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
    acknowledgeAbuse?: boolean;
}

export interface CreateFolderParams {
    name: string;
    parents?: string[];
    description?: string;
    fields?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface CreateFileParams {
    name: string;
    parents?: string[];
    mimeType?: string;
    description?: string;
    content?: string;
    fields?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface UpdateFileParams {
    name?: string;
    description?: string;
    mimeType?: string;
    addParents?: string;
    removeParents?: string;
    fields?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface DeleteFileParams {
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface SearchFilesParams extends GetFilesParams {}

export interface ShareFileParams {
    role: PermissionRole;
    type: PermissionType;
    emailAddress?: string;
    domain?: string;
    transferOwnership?: boolean;
    sendNotificationEmail?: boolean;
    emailMessage?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
    fields?: string;
}

export interface GetPermissionsParams {
    fields?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface DeletePermissionParams {
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

// Constants that may be useful in the frontend
export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
export const DEFAULT_FILE_FIELDS = 'id,name,mimeType,parents,size,modifiedTime,createdTime,webViewLink,iconLink,thumbnailLink,owners,shared,sharingUser,capabilities';