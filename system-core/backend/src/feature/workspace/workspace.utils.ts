import { v4 as uuidv4 } from 'uuid';
import {
    Workspace,
    WorkspaceMember,
    WorkspaceContent,
    WorkspaceFeatureType,
    WorkspaceRole,
    WorkspacePermissionOperation,
    WorkspacePermission
} from './workspace.types';
import { WorkspaceDocument, WorkspaceMemberDocument, WorkspaceContentDocument } from './workspace.model';

/**
 * Generate a new unique workspace ID
 */
export const generateWorkspaceId = (): string => {
    return `ws_${uuidv4()}`;
};

/**
 * Generate a new unique content ID
 */
export const generateContentId = (): string => {
    return `wsc_${uuidv4()}`;
};

/**
 * Convert Mongoose document to Workspace type
 */
export const toWorkspace = (doc: WorkspaceDocument | null): Workspace | null => {
    if (!doc) return null;

    const mongoDoc = doc.toObject ? doc.toObject() : doc;

    const workspace: Workspace = {
        id: mongoDoc.id,
        name: mongoDoc.name,
        description: mongoDoc.description,
        created: mongoDoc.created,
        updated: mongoDoc.updated,
        ownerId: mongoDoc.ownerId,
        features: mongoDoc.features
    };

    return workspace;
};

/**
 * Convert Mongoose document to WorkspaceMember type
 */
export const toWorkspaceMember = (doc: WorkspaceMemberDocument | null): WorkspaceMember | null => {
    if (!doc) return null;

    const mongoDoc = doc.toObject ? doc.toObject() : doc;

    const member: WorkspaceMember = {
        workspaceId: mongoDoc.workspaceId,
        accountId: mongoDoc.accountId,
        role: mongoDoc.role,
        joinedAt: mongoDoc.joinedAt,
        permissions: mongoDoc.permissions
    };

    return member;
};

/**
 * Convert Mongoose document to WorkspaceContent type
 */
export const toWorkspaceContent = (doc: WorkspaceContentDocument | null): WorkspaceContent | null => {
    if (!doc) return null;

    const mongoDoc = doc.toObject ? doc.toObject() : doc;

    const content: WorkspaceContent = {
        id: mongoDoc.id,
        workspaceId: mongoDoc.workspaceId,
        contentType: mongoDoc.contentType,
        contentId: mongoDoc.contentId,
        sharedBy: mongoDoc.sharedBy,
        sharedAt: mongoDoc.sharedAt,
        metadata: mongoDoc.metadata || {}
    };

    return content;
};

/**
 * Get default permissions based on role
 */
export const getDefaultPermissions = (role: WorkspaceRole): WorkspacePermission[] => {
    const allFeatures = Object.values(WorkspaceFeatureType);

    switch (role) {
        case WorkspaceRole.Owner:
        case WorkspaceRole.Admin:
            // All permissions for all features
            return allFeatures.map(feature => ({
                feature,
                operations: Object.values(WorkspacePermissionOperation)
            }));

        case WorkspaceRole.Editor:
            // Read, write, share for all features
            return allFeatures.map(feature => ({
                feature,
                operations: [
                    WorkspacePermissionOperation.Read,
                    WorkspacePermissionOperation.Write,
                    WorkspacePermissionOperation.Share
                ]
            }));

        case WorkspaceRole.Viewer:
        default:
            // Read-only for all features
            return allFeatures.map(feature => ({
                feature,
                operations: [WorkspacePermissionOperation.Read]
            }));
    }
};

/**
 * Check if user has permission for a specific operation on a feature
 */
export const hasPermission = (
    member: WorkspaceMember,
    feature: WorkspaceFeatureType,
    operation: WorkspacePermissionOperation
): boolean => {
    // Owners and admins always have all permissions
    if (member.role === WorkspaceRole.Owner || member.role === WorkspaceRole.Admin) {
        return true;
    }

    // Find the specific feature permission
    const featurePermission = member.permissions.find(p => p.feature === feature);
    if (!featurePermission) return false;

    // Check if the operation is allowed
    return featurePermission.operations.includes(operation);
};

/**
 * Get formatted timestamp for current time
 */
export const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
};

/**
 * Get default workspace features (all enabled)
 */
export const getDefaultWorkspaceFeatures = (): { type: WorkspaceFeatureType, enabled: boolean }[] => {
    return Object.values(WorkspaceFeatureType).map(type => ({
        type,
        enabled: true
    }));
};