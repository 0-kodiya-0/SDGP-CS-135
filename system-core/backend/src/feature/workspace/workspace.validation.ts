import {
    Workspace,
    WorkspaceMember,
    WorkspaceContent,
    WorkspaceRole,
    WorkspaceFeatureType,
    WorkspacePermissionOperation,
    WorkspacePermission,
    CreateWorkspaceRequest,
    UpdateWorkspaceRequest,
    AddWorkspaceMemberRequest,
    UpdateWorkspaceMemberRequest,
    ShareContentRequest
} from './workspace.types';

/**
 * Validate workspace feature type
 */
export const validateFeatureType = (type: any): type is WorkspaceFeatureType => {
    return Object.values(WorkspaceFeatureType).includes(type);
};

/**
 * Validate workspace role
 */
export const validateRole = (role: any): role is WorkspaceRole => {
    return Object.values(WorkspaceRole).includes(role);
};

/**
 * Validate permission operation
 */
export const validatePermissionOperation = (operation: any): operation is WorkspacePermissionOperation => {
    return Object.values(WorkspacePermissionOperation).includes(operation);
};

/**
 * Validate workspace permission
 */
export const validatePermission = (permission: any): permission is WorkspacePermission => {
    return (
        permission !== null &&
        typeof permission === 'object' &&
        validateFeatureType(permission.feature) &&
        Array.isArray(permission.operations) &&
        permission.operations.every((op: any) => validatePermissionOperation(op))
    );
};

/**
 * Validate create workspace request
 */
export const validateCreateWorkspaceRequest = (request: any): request is CreateWorkspaceRequest => {
    const isValidRequest = (
        request !== null &&
        typeof request === 'object' &&
        typeof request.name === 'string' &&
        request.name.trim().length > 0 &&
        (request.description === undefined || typeof request.description === 'string')
    );

    if (!isValidRequest) return false;

    // Validate features if provided
    if (request.features !== undefined) {
        if (!Array.isArray(request.features)) return false;

        return request.features.every((feature: any) =>
            feature !== null &&
            typeof feature === 'object' &&
            validateFeatureType(feature.type) &&
            (feature.enabled === undefined || typeof feature.enabled === 'boolean')
        );
    }

    return true;
};

/**
 * Validate update workspace request
 */
export const validateUpdateWorkspaceRequest = (request: any): request is UpdateWorkspaceRequest => {
    if (request === null || typeof request !== 'object') return false;

    // At least one field must be provided
    if (Object.keys(request).length === 0) return false;

    // Validate fields if provided
    if (request.name !== undefined && (typeof request.name !== 'string' || request.name.trim().length === 0)) {
        return false;
    }

    if (request.description !== undefined && typeof request.description !== 'string') {
        return false;
    }

    // Validate features if provided
    if (request.features !== undefined) {
        if (!Array.isArray(request.features)) return false;

        return request.features.every((feature: any) =>
            feature !== null &&
            typeof feature === 'object' &&
            validateFeatureType(feature.type) &&
            (feature.enabled === undefined || typeof feature.enabled === 'boolean')
        );
    }

    return true;
};

/**
 * Validate add workspace member request
 */
export const validateAddMemberRequest = (request: any): request is AddWorkspaceMemberRequest => {
    const isValidRequest = (
        request !== null &&
        typeof request === 'object' &&
        typeof request.accountId === 'string' &&
        request.accountId.trim().length > 0 &&
        validateRole(request.role)
    );

    if (!isValidRequest) return false;

    // Validate permissions if provided
    if (request.permissions !== undefined) {
        if (!Array.isArray(request.permissions)) return false;

        return request.permissions.every(permission => validatePermission(permission));
    }

    return true;
};

/**
 * Validate update workspace member request
 */
export const validateUpdateMemberRequest = (request: any): request is UpdateWorkspaceMemberRequest => {
    if (request === null || typeof request !== 'object') return false;

    // At least one field must be provided
    if (Object.keys(request).length === 0) return false;

    // Validate role if provided
    if (request.role !== undefined && !validateRole(request.role)) {
        return false;
    }

    // Validate permissions if provided
    if (request.permissions !== undefined) {
        if (!Array.isArray(request.permissions)) return false;

        return request.permissions.every(permission => validatePermission(permission));
    }

    return true;
};

/**
 * Validate share content request
 */
export const validateShareContentRequest = (request: any): request is ShareContentRequest => {
    const isValidRequest = (
        request !== null &&
        typeof request === 'object' &&
        typeof request.contentId === 'string' &&
        request.contentId.trim().length > 0 &&
        validateFeatureType(request.contentType)
    );

    if (!isValidRequest) return false;

    // Validate metadata if provided
    if (request.metadata !== undefined) {
        return (
            typeof request.metadata === 'object' &&
            request.metadata !== null
        );
    }

    return true;
};