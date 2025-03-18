import { drive_v3 } from 'googleapis';
import { GoogleListResponse, PaginationParams } from '../../types';

// Request types
export interface GetFilesParams extends PaginationParams {
    q?: string;
    fields?: string;
    orderBy?: string;
    spaces?: string;
    includeItemsFromAllDrives?: boolean;
    supportsAllDrives?: boolean;
    corpora?: 'user' | 'drive' | 'domain' | 'allDrives';
    driveId?: string;
    includeTeamDriveItems?: boolean;
    teamDriveId?: string;
}

export interface GetFileParams {
    fileId: string;
    fields?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
    acknowledgeAbuse?: boolean;
}

export interface CreateFolderParams {
    name: string;
    parents?: string[];
    mimeType?: string;
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
    fields?: string;
    content?: string | Blob | Buffer;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface UpdateFileParams {
    fileId: string;
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
    fileId: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface SearchFilesParams extends GetFilesParams { }

export interface ShareFileParams {
    fileId: string;
    role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
    type: 'user' | 'group' | 'domain' | 'anyone';
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
    fileId: string;
    fields?: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

export interface DeletePermissionParams {
    fileId: string;
    permissionId: string;
    supportsAllDrives?: boolean;
    supportsTeamDrives?: boolean;
}

// Response types
export type DriveFile = drive_v3.Schema$File;
export type DriveFileList = GoogleListResponse<DriveFile>;
export type Permission = drive_v3.Schema$Permission;
export type PermissionList = GoogleListResponse<Permission>;

// Constants
export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
export const DEFAULT_FILE_FIELDS = 'id,name,mimeType,parents,size,modifiedTime,createdTime,webViewLink,iconLink,thumbnailLink,owners,shared,sharingUser,capabilities';
export const EXTENDED_FILE_FIELDS = `${DEFAULT_FILE_FIELDS},appProperties,contentHints,copyRequiresWriterPermission,description,explicitlyTrashed,fileExtension,fullFileExtension,hasAugmentedPermissions,hasThumbnail,headRevisionId,isAppAuthorized,md5Checksum,originalFilename,ownedByMe,permissionIds,properties,quotaBytesUsed,sha1Checksum,sha256Checksum,shared,sharedWithMeTime,sharingUser,shortcutDetails,spaces,starred,teamDriveId,trashed,trashedTime,trashingUser,version,videoMediaMetadata,viewedByMe,viewedByMeTime,viewersCanCopyContent,webContentLink,webViewLink,writersCanShare`;