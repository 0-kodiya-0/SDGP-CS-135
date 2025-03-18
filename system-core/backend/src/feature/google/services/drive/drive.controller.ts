import { Response } from 'express';
import {
    GetFilesParams,
    GetFileParams,
    CreateFolderParams,
    CreateFileParams,
    UpdateFileParams,
    DeleteFileParams,
    SearchFilesParams,
    ShareFileParams,
    GetPermissionsParams,
    DeletePermissionParams
} from './drive.types';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { DriveService } from './drive.service';

/**
 * Controller for Drive API endpoints
 */
export class DriveController {
    /**
     * List files and folders
     */
    static async listFiles(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: GetFilesParams = {
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
                pageToken: req.query.pageToken as string,
                q: req.query.q as string,
                fields: req.query.fields as string,
                orderBy: req.query.orderBy as string,
                spaces: req.query.spaces as string,
                includeItemsFromAllDrives: req.query.includeItemsFromAllDrives === 'true',
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                corpora: req.query.corpora as any,
                driveId: req.query.driveId as string,
                includeTeamDriveItems: req.query.includeTeamDriveItems === 'true',
                teamDriveId: req.query.teamDriveId as string
            };

            // Create service and get files
            const driveService = new DriveService(req.googleAuth);
            const files = await driveService.listFiles(params);

            sendSuccess(res, 200, {
                files: files.items,
                nextPageToken: files.nextPageToken
            });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Get a specific file by ID
     */
    static async getFile(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const fileId = req.params.fileId;

            if (!fileId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File ID is required');
            }

            // Extract parameters
            const params: GetFileParams = {
                fileId,
                fields: req.query.fields as string,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true',
                acknowledgeAbuse: req.query.acknowledgeAbuse === 'true'
            };

            // Create service and get file
            const driveService = new DriveService(req.googleAuth);
            const file = await driveService.getFile(params);

            sendSuccess(res, 200, { file });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Download a file
     */
    static async downloadFile(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const fileId = req.params.fileId;

            if (!fileId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File ID is required');
            }

            const acknowledgeAbuse = req.query.acknowledgeAbuse === 'true';

            // Create service and download file
            const driveService = new DriveService(req.googleAuth);

            // First get file metadata to set content type and filename
            const file = await driveService.getFile({
                fileId,
                fields: 'name,mimeType'
            });

            // Then get the file content as a stream
            const fileStream = await driveService.downloadFile(fileId, acknowledgeAbuse);

            // Set appropriate headers for download
            res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

            // Pipe the file stream to the response
            fileStream.pipe(res);
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Create a new folder
     */
    static async createFolder(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const { name, parents, description } = req.body;

            if (!name) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Folder name is required');
            }

            // Create folder params
            const params: CreateFolderParams = {
                name,
                parents: parents ? (Array.isArray(parents) ? parents : [parents]) : undefined,
                description,
                fields: req.query.fields as string,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create service and create folder
            const driveService = new DriveService(req.googleAuth);
            const folder = await driveService.createFolder(params);

            sendSuccess(res, 201, { folder });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Create a new empty file
     */
    static async createFile(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const { name, parents, mimeType, description, content } = req.body;

            if (!name) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File name is required');
            }

            // Create file params
            const params: CreateFileParams = {
                name,
                parents: parents ? (Array.isArray(parents) ? parents : [parents]) : undefined,
                mimeType,
                description,
                content,
                fields: req.query.fields as string,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create service and create file
            const driveService = new DriveService(req.googleAuth);
            const file = await driveService.createFile(params);

            sendSuccess(res, 201, { file });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Upload a file
     */
    static async uploadFile(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Access file from the request
            if (!req.file && !req.files) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'No file uploaded');
            }

            // Get file from request
            const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : req.files.file);

            if (!uploadedFile) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'No file could be processed');
            }

            // Get parameters from form data or body
            const name = req.body.name || uploadedFile.originalname;
            const parents = req.body.parents ? (Array.isArray(req.body.parents) ? req.body.parents : [req.body.parents]) : undefined;
            const mimeType = req.body.mimeType || uploadedFile.mimetype;
            const description = req.body.description;

            // Create file params
            const params: CreateFileParams = {
                name,
                parents,
                mimeType,
                description,
                fields: req.query.fields as string,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create readable stream from file buffer
            const fileBuffer = uploadedFile.buffer;
            const content = fileBuffer;

            // Create service and upload file
            const driveService = new DriveService(req.googleAuth);
            const file = await driveService.uploadFile(content, params);

            sendSuccess(res, 201, { file });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Update an existing file
     */
    static async updateFile(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const fileId = req.params.fileId;

            if (!fileId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File ID is required');
            }

            const { name, description, mimeType, addParents, removeParents } = req.body;

            // Create update params
            const params: UpdateFileParams = {
                fileId,
                name,
                description,
                mimeType,
                addParents,
                removeParents,
                fields: req.query.fields as string,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create service and update file
            const driveService = new DriveService(req.googleAuth);
            const file = await driveService.updateFile(params);

            sendSuccess(res, 200, { file });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Delete a file or folder
     */
    static async deleteFile(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const fileId = req.params.fileId;

            if (!fileId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File ID is required');
            }

            // Create delete params
            const params: DeleteFileParams = {
                fileId,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create service and delete file
            const driveService = new DriveService(req.googleAuth);
            await driveService.deleteFile(params);

            sendSuccess(res, 200, { message: 'File deleted successfully' });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Search for files and folders
     */
    static async searchFiles(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: SearchFilesParams = {
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
                pageToken: req.query.pageToken as string,
                q: req.query.q as string,
                fields: req.query.fields as string,
                orderBy: req.query.orderBy as string,
                spaces: req.query.spaces as string,
                includeItemsFromAllDrives: req.query.includeItemsFromAllDrives === 'true',
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                corpora: req.query.corpora as any,
                driveId: req.query.driveId as string,
                includeTeamDriveItems: req.query.includeTeamDriveItems === 'true',
                teamDriveId: req.query.teamDriveId as string
            };

            // Create service and search files
            const driveService = new DriveService(req.googleAuth);
            const files = await driveService.searchFiles(params);

            sendSuccess(res, 200, {
                files: files.items,
                nextPageToken: files.nextPageToken
            });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Share a file with another user
     */
    static async shareFile(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const fileId = req.params.fileId;

            if (!fileId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File ID is required');
            }

            const { role, type, emailAddress, domain, transferOwnership, sendNotificationEmail, emailMessage } = req.body;

            if (!role || !type) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Role and type are required');
            }

            if (type === 'user' && !emailAddress) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Email address is required for user type');
            }

            if (type === 'domain' && !domain) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Domain is required for domain type');
            }

            // Create share params
            const params: ShareFileParams = {
                fileId,
                role,
                type,
                emailAddress,
                domain,
                transferOwnership,
                sendNotificationEmail,
                emailMessage,
                fields: req.query.fields as string,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create service and share file
            const driveService = new DriveService(req.googleAuth);
            const permission = await driveService.shareFile(params);

            sendSuccess(res, 200, { permission });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * List all permissions for a file
     */
    static async listPermissions(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const fileId = req.params.fileId;

            if (!fileId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File ID is required');
            }

            // Create permission params
            const params: GetPermissionsParams = {
                fileId,
                fields: req.query.fields as string,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create service and list permissions
            const driveService = new DriveService(req.googleAuth);
            const permissions = await driveService.listPermissions(params);

            sendSuccess(res, 200, { permissions: permissions.items });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Delete a permission from a file
     */
    static async deletePermission(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const fileId = req.params.fileId;
            const permissionId = req.params.permissionId;

            if (!fileId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'File ID is required');
            }

            if (!permissionId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Permission ID is required');
            }

            // Create permission params
            const params: DeletePermissionParams = {
                fileId,
                permissionId,
                supportsAllDrives: req.query.supportsAllDrives === 'true',
                supportsTeamDrives: req.query.supportsTeamDrives === 'true'
            };

            // Create service and delete permission
            const driveService = new DriveService(req.googleAuth);
            await driveService.deletePermission(params);

            sendSuccess(res, 200, { message: 'Permission deleted successfully' });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }
}