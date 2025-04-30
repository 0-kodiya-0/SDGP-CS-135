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
    DEFAULT_FILE_FIELDS,
    CreateFileRequestBody,
    UpdateFileRequestBody,
    CreatePermissionRequestBody
} from './drive.types';
import { ChatValidationError } from '../../../../types/response.types';

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
        const response = await this.drive.files.list({
            pageSize: params.maxResults || 100,
            pageToken: params.pageToken,
            q: params.q || "trashed = false", // Add default query to exclude trashed items
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
            nextPageToken: response.data.nextPageToken || undefined
        };
    }

    /**
     * Get a specific file by ID
     */
    async getFile(params: GetFileParams): Promise<DriveFile> {
        const response = await this.drive.files.get({
            fileId: params.fileId,
            fields: params.fields || DEFAULT_FILE_FIELDS,
            supportsAllDrives: params.supportsAllDrives,
            supportsTeamDrives: params.supportsTeamDrives,
            acknowledgeAbuse: params.acknowledgeAbuse
        });

        return response.data;
    }

    /**
     * Download file content as a readable stream
     */
    async downloadFile(fileId: string, acknowledgeAbuse = false): Promise<Readable> {
        const response = await this.drive.files.get({
            fileId,
            alt: 'media',
            acknowledgeAbuse,
            supportsAllDrives: true
        }, {
            responseType: 'stream'
        });

        return response.data as unknown as Readable;
    }

    /**
     * Create a new folder
     */
    async createFolder(params: CreateFolderParams): Promise<DriveFile> {
        const requestBody: CreateFileRequestBody = {
            name: params.name,
            mimeType: FOLDER_MIME_TYPE,
            parents: params.parents,
            description: params.description
        };

        const response = await this.drive.files.create({
            requestBody,
            fields: params.fields || DEFAULT_FILE_FIELDS,
            supportsAllDrives: params.supportsAllDrives,
            supportsTeamDrives: params.supportsTeamDrives
        });

        return response.data;
    }

    /**
     * Create a new file
     */
    async createFile(params: CreateFileParams): Promise<DriveFile> {
        const requestBody: CreateFileRequestBody = {
            name: params.name,
            mimeType: params.mimeType,
            parents: params.parents,
            description: params.description
        };

        const media = params.content
            ? { body: params.content }
            : undefined;

        const response = await this.drive.files.create({
            requestBody,
            media,
            fields: params.fields || DEFAULT_FILE_FIELDS,
            supportsAllDrives: params.supportsAllDrives,
            supportsTeamDrives: params.supportsTeamDrives
        });

        return response.data;
    }

    /**
     * Upload file content to Drive
     * Fixed to properly handle different types of content (Buffer, string, Readable)
     */
    async uploadFile(content: string | Buffer | Readable, params: CreateFileParams): Promise<DriveFile> {
        const requestBody: CreateFileRequestBody = {
            name: params.name,
            mimeType: params.mimeType,
            parents: params.parents,
            description: params.description
        };

        let mediaBody: any;

        // Handle different content types appropriately
        if (Buffer.isBuffer(content)) {
            // If content is a Buffer (which is likely from multer)
            mediaBody = {
                mimeType: params.mimeType,
                body: Readable.from(content)
            };
        } else if (content instanceof Readable) {
            // If content is already a Readable stream
            mediaBody = {
                mimeType: params.mimeType,
                body: content
            };
        } else if (typeof content === 'string') {
            // If content is a string
            mediaBody = {
                mimeType: params.mimeType,
                body: Readable.from(content)
            };
        } else {
            throw new ChatValidationError('Unsupported content type for upload');
        }

        const response = await this.drive.files.create({
            requestBody,
            media: mediaBody,
            fields: params.fields || DEFAULT_FILE_FIELDS,
            supportsAllDrives: params.supportsAllDrives,
            supportsTeamDrives: params.supportsTeamDrives
        });

        return response.data;
    }

    /**
     * Update an existing file
     */
    async updateFile(params: UpdateFileParams): Promise<DriveFile> {
        const requestBody: UpdateFileRequestBody = {};

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
    }

    /**
     * Delete a file or folder
     */
    async deleteFile(params: DeleteFileParams): Promise<void> {
        await this.drive.files.delete({
            fileId: params.fileId,
            supportsAllDrives: params.supportsAllDrives,
            supportsTeamDrives: params.supportsTeamDrives
        });
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
        const requestBody: CreatePermissionRequestBody = {
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
    }

    /**
     * List all permissions for a file
     */
    async listPermissions(params: GetPermissionsParams): Promise<PermissionList> {
        const response = await this.drive.permissions.list({
            fileId: params.fileId,
            fields: `permissions(${params.fields || '*'})`,
            supportsAllDrives: params.supportsAllDrives,
            supportsTeamDrives: params.supportsTeamDrives
        });

        return {
            items: response.data.permissions || []
        };
    }

    /**
     * Delete a permission from a file
     */
    async deletePermission(params: DeletePermissionParams): Promise<void> {
        await this.drive.permissions.delete({
            fileId: params.fileId,
            permissionId: params.permissionId,
            supportsAllDrives: params.supportsAllDrives,
            supportsTeamDrives: params.supportsTeamDrives
        });
    }
}