import express from 'express';
import multer from 'multer';
import { googleApiAuth } from '../../middleware';
import { createFile, createFolder, deleteFile, deletePermission, downloadFile, getFile, listFiles, listPermissions, searchFiles, shareFile, updateFile, uploadFile } from './drive.controller';

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
    listFiles
);

router.get(
    '/files/search',
    googleApiAuth('drive', 'readonly'),
    searchFiles
);

router.get(
    '/files/:fileId',
    googleApiAuth('drive', 'readonly'),
    getFile
);

router.get(
    '/files/:fileId/download',
    googleApiAuth('drive', 'readonly'),
    downloadFile
);

router.post(
    '/files',
    googleApiAuth('drive', 'file'),
    createFile
);

router.post(
    '/files/upload',
    googleApiAuth('drive', 'file'),
    upload.single('file'),
    uploadFile
);

router.post(
    '/folders',
    googleApiAuth('drive', 'file'),
    createFolder
);

router.put(
    '/files/:fileId',
    googleApiAuth('drive', 'file'),
    updateFile
);

router.delete(
    '/files/:fileId',
    googleApiAuth('drive', 'file'),
    deleteFile
);

// Permissions endpoints
router.get(
    '/files/:fileId/permissions',
    googleApiAuth('drive', 'readonly'),
    listPermissions
);

router.post(
    '/files/:fileId/permissions',
    googleApiAuth('drive', 'file'),
    shareFile
);

router.delete(
    '/files/:fileId/permissions/:permissionId',
    googleApiAuth('drive', 'file'),
    deletePermission
);

export default router;