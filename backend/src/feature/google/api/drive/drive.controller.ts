import { Response, Express, NextFunction } from 'express';
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
    DeletePermissionParams,
    DriveCorpora
} from './drive.types';
import { BadRequestError, JsonSuccess } from '../../../../types/response.types';
import { asyncHandler } from '../../../../utils/response';
import { GoogleApiRequest } from '../../types';
import { DriveService } from './drive.service';
import { Auth } from 'googleapis';

type MulterFile = Express.Multer.File;

/**
 * Extended Express.Request with Multer file support
 */
interface DriveRequest extends GoogleApiRequest {
    file?: MulterFile;
    files?: {
        [fieldname: string]: MulterFile[];
    } | MulterFile[];
}

export const listFiles = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

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
        corpora: req.query.corpora as DriveCorpora,
        driveId: req.query.driveId as string,
        includeTeamDriveItems: req.query.includeTeamDriveItems === 'true',
        teamDriveId: req.query.teamDriveId as string
    };

    // Create service and get files
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const files = await driveService.listFiles(params);

    next(new JsonSuccess({
        files: files.items,
        nextPageToken: files.nextPageToken
    }));
});

/**
 * Get a specific file by ID
 */
export const getFile = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const fileId = req.params.fileId;

    if (!fileId) {
        throw new BadRequestError('File ID is required');
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
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const file = await driveService.getFile(params);

    next(new JsonSuccess({ file }));
});

/**
 * Download a file
 */
export const downloadFile = asyncHandler(async (req: GoogleApiRequest, res: Response) => {

    const fileId = req.params.fileId;

    if (!fileId) {
        throw new BadRequestError('File ID is required');
    }

    const acknowledgeAbuse = req.query.acknowledgeAbuse === 'true';

    // Create service and download file
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);

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
});

/**
 * Create a new folder
 */
export const createFolder = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const { name, parents, description } = req.body;

    if (!name) {
        throw new BadRequestError('Folder name is required');
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
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const folder = await driveService.createFolder(params);

    next(new JsonSuccess({ folder }, 201));
});

/**
 * Create a new empty file
 */
export const createFile = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const { name, parents, mimeType, description, content } = req.body;

    if (!name) {
        throw new BadRequestError('File name is required');
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
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const file = await driveService.createFile(params);

    next(new JsonSuccess({ file }, 201));
});

/**
 * Upload a file
 */
export const uploadFile = asyncHandler(async (req: DriveRequest, res: Response, next: NextFunction) => {

    // Access file from the request
    if (!req.file && !req.files) {
        throw new BadRequestError('No file uploaded');
    }

    let uploadedFile: MulterFile | undefined;

    // Get file from request - handling different multer configurations
    if (req.file) {
        // Single file upload
        uploadedFile = req.file;
    } else if (req.files) {
        // Multiple files or fields
        if (Array.isArray(req.files)) {
            // Array of files (multiple upload)
            uploadedFile = req.files[0];
        } else {
            // Object of fields (fields upload)
            const fileArray = req.files.file;
            if (fileArray && fileArray.length > 0) {
                uploadedFile = fileArray[0];
            }
        }
    }

    if (!uploadedFile) {
        throw new BadRequestError('No file could be processed');
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

    // Get file buffer
    const fileBuffer = uploadedFile.buffer;

    // Create service and upload file
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const file = await driveService.uploadFile(fileBuffer, params);

    next(new JsonSuccess({ file }, 201));
});

/**
 * Update an existing file
 */
export const updateFile = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const fileId = req.params.fileId;

    if (!fileId) {
        throw new BadRequestError('File ID is required');
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
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const file = await driveService.updateFile(params);

    next(new JsonSuccess({ file }));
});

/**
 * Delete a file or folder
 */
export const deleteFile = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const fileId = req.params.fileId;

    if (!fileId) {
        throw new BadRequestError('File ID is required');
    }

    // Create delete params
    const params: DeleteFileParams = {
        fileId,
        supportsAllDrives: req.query.supportsAllDrives === 'true',
        supportsTeamDrives: req.query.supportsTeamDrives === 'true'
    };

    // Create service and delete file
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    await driveService.deleteFile(params);

    next(new JsonSuccess({ message: 'File deleted successfully' }));
});

/**
 * Search for files and folders
 */
export const searchFiles = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

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
        corpora: req.query.corpora as DriveCorpora,
        driveId: req.query.driveId as string,
        includeTeamDriveItems: req.query.includeTeamDriveItems === 'true',
        teamDriveId: req.query.teamDriveId as string
    };

    // Create service and search files
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const files = await driveService.searchFiles(params);

    next(new JsonSuccess({
        files: files.items,
        nextPageToken: files.nextPageToken
    }));
});

/**
 * Share a file with another user
 */
export const shareFile = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const fileId = req.params.fileId;

    if (!fileId) {
        throw new BadRequestError('File ID is required');
    }

    const { role, type, emailAddress, domain, transferOwnership, sendNotificationEmail, emailMessage } = req.body;

    if (!role || !type) {
        throw new BadRequestError('Role and type are required');
    }

    if (type === 'user' && !emailAddress) {
        throw new BadRequestError('Email address is required for user type');
    }

    if (type === 'domain' && !domain) {
        throw new BadRequestError('Domain is required for domain type');
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
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const permission = await driveService.shareFile(params);

    next(new JsonSuccess({ permission }));
});

/**
 * List all permissions for a file
 */
export const listPermissions = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const fileId = req.params.fileId;

    if (!fileId) {
        throw new BadRequestError('File ID is required');
    }

    // Create permission params
    const params: GetPermissionsParams = {
        fileId,
        fields: req.query.fields as string,
        supportsAllDrives: req.query.supportsAllDrives === 'true',
        supportsTeamDrives: req.query.supportsTeamDrives === 'true'
    };

    // Create service and list permissions
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    const permissions = await driveService.listPermissions(params);

    next(new JsonSuccess({ permissions: permissions.items }));
});

/**
 * Delete a permission from a file
 */
export const deletePermission = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {

    const fileId = req.params.fileId;
    const permissionId = req.params.permissionId;

    if (!fileId) {
        throw new BadRequestError('File ID is required');
    }

    if (!permissionId) {
        throw new BadRequestError('Permission ID is required');
    }

    // Create permission params
    const params: DeletePermissionParams = {
        fileId,
        permissionId,
        supportsAllDrives: req.query.supportsAllDrives === 'true',
        supportsTeamDrives: req.query.supportsTeamDrives === 'true'
    };

    // Create service and delete permission
    const driveService = new DriveService(req.googleAuth as Auth.OAuth2Client);
    await driveService.deletePermission(params);

    next(new JsonSuccess({ message: 'Permission deleted successfully' }));
});