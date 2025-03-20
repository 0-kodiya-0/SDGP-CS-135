import { drive_v3 } from 'googleapis';
import { GoogleListResponse, PaginationParams } from '../../types';
import { Readable } from 'stream';

// Define corpora type explicitly
export type DriveCorpora = 'user' | 'drive' | 'domain' | 'allDrives';

// Role and Type for permissions
export type PermissionRole = 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
export type PermissionType = 'user' | 'group' | 'domain' | 'anyone';

// Request types
export interface GetFilesParams extends PaginationParams {
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
    content?: string | Buffer | Readable;
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

// Request body interfaces for better type safety
export interface CreateFileRequestBody {
    name: string;
    mimeType?: string;
    parents?: string[];
    description?: string;
    [key: string]: unknown;
}

export interface UpdateFileRequestBody {
    name?: string;
    description?: string;
    mimeType?: string;
    [key: string]: unknown;
}

export interface CreatePermissionRequestBody {
    role: PermissionRole;
    type: PermissionType;
    emailAddress?: string;
    domain?: string;
    [key: string]: unknown;
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