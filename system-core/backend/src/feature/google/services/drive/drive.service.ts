import { google, drive_v3 } from 'googleapis';
import { Auth } from 'googleapis';
import { Readable } from 'stream';
import {
    DriveFile,
    DriveFileList,
    GetFilesParams,
    GetFileParams,
    CreateFolderParams,
    CreateFileParams,
    UpdateFileParams,
    DeleteFileParams,
    SearchFilesParams,
    ShareFileParams,
    GetPermissionsParams,
    DeletePermissionParams,
    Permission,
    PermissionList,
    FOLDER_MIME_TYPE,
    DEFAULT_FILE_FIELDS
} from './drive.types';

/**
 * Drive API Service
 * Contains methods to interact with Google Drive API
 */
export class DriveService {
    private drive: drive_v3.Drive;

    constructor(auth: Auth.OAuth2Client) {
        this.drive = google.drive({ version: 'v3', auth });
    }

    /**
     * List files and folders
     */
    async listFiles(params: GetFilesParams = {}): Promise<DriveFileList> {
        try {
            const response = await this.drive.files.list({
                pageSize: params.maxResults || 100,
                pageToken: params.pageToken,
                q: params.q,
                fields: `nextPageToken, files(${params.fields || DEFAULT_FILE_FIELDS})`,
                orderBy: params.orderBy,
                spaces: params.spaces,
                includeItemsFromAllDrives: params.includeItemsFromAllDrives,
                supportsAllDrives: params.supportsAllDrives,
                corpora: params.corpora,
                driveId: params.driveId,
                includeTeamDriveItems: params.includeTeamDriveItems,
                teamDriveId: params.teamDriveId
            });

            return {
                items: response.data.files || [],
                nextPageToken: response.data.nextPageToken
            };
        } catch (error) {
            console.error('Error listing Drive files:', error);
            throw error;
        }
    }

    /**
     * Get a specific file by ID
     */
    async getFile(params: GetFileParams): Promise<DriveFile> {
        try {
            const response = await this.drive.files.get({
                fileId: params.fileId,
                fields: params.fields || DEFAULT_FILE_FIELDS,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives,
                acknowledgeAbuse: params.acknowledgeAbuse
            });

            return response.data;
        } catch (error) {
            console.error(`Error getting Drive file ${params.fileId}:`, error);
            throw error;
        }
    }

    /**
     * Download file content as a readable stream
     */
    async downloadFile(fileId: string, acknowledgeAbuse = false): Promise<Readable> {
        try {
            const response = await this.drive.files.get({
                fileId,
                alt: 'media',
                acknowledgeAbuse,
                supportsAllDrives: true
            }, {
                responseType: 'stream'
            });

            return response.data as unknown as Readable;
        } catch (error) {
            console.error(`Error downloading Drive file ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Create a new folder
     */
    async createFolder(params: CreateFolderParams): Promise<DriveFile> {
        try {
            const response = await this.drive.files.create({
                requestBody: {
                    name: params.name,
                    mimeType: FOLDER_MIME_TYPE,
                    parents: params.parents,
                    description: params.description
                },
                fields: params.fields || DEFAULT_FILE_FIELDS,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives
            });

            return response.data;
        } catch (error) {
            console.error('Error creating Drive folder:', error);
            throw error;
        }
    }

    /**
     * Create a new file
     */
    async createFile(params: CreateFileParams): Promise<DriveFile> {
        try {
            const requestBody: any = {
                name: params.name,
                mimeType: params.mimeType,
                parents: params.parents,
                description: params.description
            };

            let media = undefined;

            if (params.content) {
                media = {
                    body: params.content
                };
            }

            const response = await this.drive.files.create({
                requestBody,
                media,
                fields: params.fields || DEFAULT_FILE_FIELDS,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives
            });

            return response.data;
        } catch (error) {
            console.error('Error creating Drive file:', error);
            throw error;
        }
    }

    /**
     * Upload file content to Drive
     */
    async uploadFile(content: string | Buffer | Readable, params: CreateFileParams): Promise<DriveFile> {
        try {
            const requestBody: any = {
                name: params.name,
                mimeType: params.mimeType,
                parents: params.parents,
                description: params.description
            };

            const media = {
                body: content
            };

            const response = await this.drive.files.create({
                requestBody,
                media,
                fields: params.fields || DEFAULT_FILE_FIELDS,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives
            });

            return response.data;
        } catch (error) {
            console.error('Error uploading Drive file:', error);
            throw error;
        }
    }

    /**
     * Update an existing file
     */
    async updateFile(params: UpdateFileParams): Promise<DriveFile> {
        try {
            const requestBody: any = {};

            if (params.name !== undefined) requestBody.name = params.name;
            if (params.description !== undefined) requestBody.description = params.description;
            if (params.mimeType !== undefined) requestBody.mimeType = params.mimeType;

            const response = await this.drive.files.update({
                fileId: params.fileId,
                requestBody,
                addParents: params.addParents,
                removeParents: params.removeParents,
                fields: params.fields || DEFAULT_FILE_FIELDS,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives
            });

            return response.data;
        } catch (error) {
            console.error(`Error updating Drive file ${params.fileId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a file or folder
     */
    async deleteFile(params: DeleteFileParams): Promise<void> {
        try {
            await this.drive.files.delete({
                fileId: params.fileId,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives
            });
        } catch (error) {
            console.error(`Error deleting Drive file ${params.fileId}:`, error);
            throw error;
        }
    }

    /**
     * Search for files and folders
     */
    async searchFiles(params: SearchFilesParams): Promise<DriveFileList> {
        return this.listFiles(params);
    }

    /**
     * Share a file with another user
     */
    async shareFile(params: ShareFileParams): Promise<Permission> {
        try {
            const requestBody: any = {
                role: params.role,
                type: params.type
            };

            if (params.emailAddress) requestBody.emailAddress = params.emailAddress;
            if (params.domain) requestBody.domain = params.domain;

            const response = await this.drive.permissions.create({
                fileId: params.fileId,
                requestBody,
                transferOwnership: params.transferOwnership,
                sendNotificationEmail: params.sendNotificationEmail,
                emailMessage: params.emailMessage,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives,
                fields: params.fields
            });

            return response.data;
        } catch (error) {
            console.error(`Error sharing Drive file ${params.fileId}:`, error);
            throw error;
        }
    }

    /**
     * List all permissions for a file
     */
    async listPermissions(params: GetPermissionsParams): Promise<PermissionList> {
        try {
            const response = await this.drive.permissions.list({
                fileId: params.fileId,
                fields: `permissions(${params.fields || '*'})`,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives
            });

            return {
                items: response.data.permissions || []
            };
        } catch (error) {
            console.error(`Error listing permissions for Drive file ${params.fileId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a permission from a file
     */
    async deletePermission(params: DeletePermissionParams): Promise<void> {
        try {
            await this.drive.permissions.delete({
                fileId: params.fileId,
                permissionId: params.permissionId,
                supportsAllDrives: params.supportsAllDrives,
                supportsTeamDrives: params.supportsTeamDrives
            });
        } catch (error) {
            console.error(`Error deleting permission ${params.permissionId} from Drive file ${params.fileId}:`, error);
            throw error;
        }
    }
}