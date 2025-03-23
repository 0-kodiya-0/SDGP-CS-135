import express from 'express';
import {
    createWorkspaceController,
    getUserWorkspacesController,
    getWorkspaceController,
    updateWorkspaceController,
    deleteWorkspaceController,
    getWorkspaceMembersController,
    addWorkspaceMemberController,
    updateWorkspaceMemberController,
    removeWorkspaceMemberController,
    shareContentController,
    getWorkspaceContentController,
    removeContentController
} from './workspace.controller';
import {
    validateWorkspaceAccess,
    validateWorkspaceAdminAccess,
    validateFeaturePermission,
    validateContentOwnership
} from './workspace.middleware';
import {
    WorkspaceFeatureType,
    WorkspacePermissionOperation
} from './workspace.types';

export const router = express.Router();

// Workspace management
router.post('/', createWorkspaceController);
router.get('/', getUserWorkspacesController);
router.get('/:workspaceId', validateWorkspaceAccess, getWorkspaceController);
router.put('/:workspaceId', validateWorkspaceAdminAccess, updateWorkspaceController);
router.delete('/:workspaceId', validateWorkspaceAdminAccess, deleteWorkspaceController);

// Member management
router.get('/:workspaceId/members', validateWorkspaceAccess, getWorkspaceMembersController);
router.post('/:workspaceId/members', validateWorkspaceAdminAccess, addWorkspaceMemberController);
router.put('/:workspaceId/members/:accountId', validateWorkspaceAdminAccess, updateWorkspaceMemberController);
router.delete('/:workspaceId/members/:accountId', validateWorkspaceAdminAccess, removeWorkspaceMemberController);

// Content management
router.get('/:workspaceId/content',
    validateWorkspaceAccess,
    getWorkspaceContentController
);

// Feature-specific content endpoints
// Email content
router.post('/:workspaceId/content/email',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Email, WorkspacePermissionOperation.Write),
    shareContentController
);

// File content
router.post('/:workspaceId/content/files',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Files, WorkspacePermissionOperation.Write),
    shareContentController
);

// Calendar content
router.post('/:workspaceId/content/calendar',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Calendar, WorkspacePermissionOperation.Write),
    shareContentController
);

// Contact content
router.post('/:workspaceId/content/contacts',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Contacts, WorkspacePermissionOperation.Write),
    shareContentController
);

// Generic content deletion endpoint
router.delete('/:workspaceId/content/:contentId',
    validateWorkspaceAccess,
    validateContentOwnership(WorkspaceFeatureType.Email), // Default to email, will be overridden based on content type
    removeContentController
);

// Feature-specific content retrieval
router.get('/:workspaceId/content/email',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Email, WorkspacePermissionOperation.Read),
    (req, res, next) => {
        req.query.type = WorkspaceFeatureType.Email;
        next();
    },
    getWorkspaceContentController
);

router.get('/:workspaceId/content/files',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Files, WorkspacePermissionOperation.Read),
    (req, res, next) => {
        req.query.type = WorkspaceFeatureType.Files;
        next();
    },
    getWorkspaceContentController
);

router.get('/:workspaceId/content/calendar',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Calendar, WorkspacePermissionOperation.Read),
    (req, res, next) => {
        req.query.type = WorkspaceFeatureType.Calendar;
        next();
    },
    getWorkspaceContentController
);

router.get('/:workspaceId/content/contacts',
    validateWorkspaceAccess,
    validateFeaturePermission(WorkspaceFeatureType.Contacts, WorkspacePermissionOperation.Read),
    (req, res, next) => {
        req.query.type = WorkspaceFeatureType.Contacts;
        next();
    },
    getWorkspaceContentController
);