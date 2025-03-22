import express from 'express';
import { DriveController } from './drive.controller';
import multer from 'multer';
import { googleApiAuth } from '../../middleware';

// Set up multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB size limit
    }
});

const router = express.Router({ mergeParams: true });

// Files endpoints
router.get(
    '/files',
    googleApiAuth('drive', 'readonly'),
    DriveController.listFiles
);

router.get(
    '/files/search',
    googleApiAuth('drive', 'readonly'),
    DriveController.searchFiles
);

router.get(
    '/files/:fileId',
    googleApiAuth('drive', 'readonly'),
    DriveController.getFile
);

router.get(
    '/files/:fileId/download',
    googleApiAuth('drive', 'readonly'),
    DriveController.downloadFile
);

router.post(
    '/files',
    googleApiAuth('drive', 'file'),
    DriveController.createFile
);

router.post(
    '/files/upload',
    googleApiAuth('drive', 'file'),
    upload.single('file'),
    DriveController.uploadFile
);

router.post(
    '/folders',
    googleApiAuth('drive', 'file'),
    DriveController.createFolder
);

router.put(
    '/files/:fileId',
    googleApiAuth('drive', 'file'),
    DriveController.updateFile
);

router.delete(
    '/files/:fileId',
    googleApiAuth('drive', 'file'),
    DriveController.deleteFile
);

// Permissions endpoints
router.get(
    '/files/:fileId/permissions',
    googleApiAuth('drive', 'readonly'),
    DriveController.listPermissions
);

router.post(
    '/files/:fileId/permissions',
    googleApiAuth('drive', 'file'),
    DriveController.shareFile
);

router.delete(
    '/files/:fileId/permissions/:permissionId',
    googleApiAuth('drive', 'file'),
    DriveController.deletePermission
);

export default router;