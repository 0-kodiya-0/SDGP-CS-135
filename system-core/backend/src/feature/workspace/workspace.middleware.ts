import { Request, Response, NextFunction } from 'express';
import {
  isWorkspaceMember,
  isWorkspaceOwner,
  getWorkspaceMember
} from './workspace.service';
import {
  WorkspaceFeatureType,
  WorkspacePermissionOperation,
  WorkspaceRole
} from './workspace.types';
import { hasPermission } from './workspace.utils';
import { sendError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';

/**
 * Middleware to validate workspace access
 * Ensures the user is a member of the workspace
 */
export const validateWorkspaceAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session) {
    return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Not authenticated');
  }

  const { workspaceId , accountId } = req.params;

  try {
    const isMember = await isWorkspaceMember(workspaceId, accountId);

    if (!isMember) {
      return sendError(res, 403, ApiErrorCode.PERMISSION_DENIED, 'You do not have access to this workspace');
    }

    // Add workspace ID to request for easier access in route handlers
    req.workspaceId = workspaceId;

    next();
  } catch (error) {
    console.error('Workspace access validation error:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to validate workspace access');
  }
};

/**
 * Middleware to validate admin access to a workspace
 * Ensures the user is an owner or admin of the workspace
 */
export const validateWorkspaceAdminAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session) {
    return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Not authenticated');
  }

  const { workspaceId , accountId } = req.params;

  try {
    // Check if user is the owner
    const isOwner = await isWorkspaceOwner(workspaceId, accountId);

    if (isOwner) {
      req.workspaceId = workspaceId;
      return next();
    }

    // Get member details to check role
    const member = await getWorkspaceMember(workspaceId, accountId);

    if (!member || (member.role !== WorkspaceRole.Admin && member.role !== WorkspaceRole.Owner)) {
      return sendError(res, 403, ApiErrorCode.PERMISSION_DENIED, 'Admin privileges required');
    }

    req.workspaceId = workspaceId;
    next();
  } catch (error) {
    console.error('Workspace admin access validation error:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to validate workspace admin access');
  }
};

/**
 * Middleware to validate feature-specific permission
 */
export const validateFeaturePermission = (
  feature: WorkspaceFeatureType,
  operation: WorkspacePermissionOperation
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Not authenticated');
    }

    const { workspaceId , accountId } = req.params;

    try {
      // Check if user is the owner (owners always have all permissions)
      const isOwner = await isWorkspaceOwner(workspaceId, accountId);

      if (isOwner) {
        req.workspaceId = workspaceId;
        return next();
      }

      // Get member details to check permissions
      const member = await getWorkspaceMember(workspaceId, accountId);

      if (!member) {
        return sendError(res, 403, ApiErrorCode.PERMISSION_DENIED, 'You do not have access to this workspace');
      }

      // Check feature-specific permission
      if (!hasPermission(member, feature, operation)) {
        return sendError(res, 403, ApiErrorCode.PERMISSION_DENIED, `You don't have ${operation} permission for ${feature}`);
      }

      req.workspaceId = workspaceId;
      next();
    } catch (error) {
      console.error('Feature permission validation error:', error);
      return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to validate feature permission');
    }
  };
};

/**
 * Middleware to validate ownership of content
 */
export const validateContentOwnership = (
  feature: WorkspaceFeatureType
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Not authenticated');
    }

    const { workspaceId, accountId } = req.params;

    try {
      // First, check if user is owner or admin (they can modify any content)
      const member = await getWorkspaceMember(workspaceId, accountId);

      if (!member) {
        return sendError(res, 403, ApiErrorCode.PERMISSION_DENIED, 'You do not have access to this workspace');
      }

      if (member.role === WorkspaceRole.Owner || member.role === WorkspaceRole.Admin) {
        req.workspaceId = workspaceId;
        return next();
      }

      // For non-admin users, check if they have write permission
      if (!hasPermission(member, feature, WorkspacePermissionOperation.Write)) {
        return sendError(res, 403, ApiErrorCode.PERMISSION_DENIED, `You don't have write permission for ${feature}`);
      }

      req.workspaceId = workspaceId;
      next();
    } catch (error) {
      console.error('Content ownership validation error:', error);
      return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to validate content ownership');
    }
  };
};