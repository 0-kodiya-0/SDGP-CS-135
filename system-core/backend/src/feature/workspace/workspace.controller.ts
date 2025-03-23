import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { ApiErrorCode } from '../../types/response.types';
import {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  AddWorkspaceMemberRequest,
  UpdateWorkspaceMemberRequest,
  ShareContentRequest,
  WorkspaceFeatureType
} from './workspace.types';
import {
  createWorkspace,
  getWorkspaceById,
  getWorkspacesByOwnerId,
  getWorkspacesByMemberId,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  getWorkspaceMember,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
  getWorkspaceContent,
  removeContentFromWorkspace
} from './workspace.service';
import {
  shareContentToWorkspaceByType,
  getWorkspaceContentByType
} from './workspace.service.impl';
import {
  validateCreateWorkspaceRequest,
  validateUpdateWorkspaceRequest,
  validateAddMemberRequest,
  validateUpdateMemberRequest,
  validateShareContentRequest
} from './workspace.validation';

/**
 * Create a new workspace
 */
export const createWorkspaceController = async (req: Request, res: Response) => {
  if (!req.session) {
    return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Not authenticated');
  }

  const ownerId = req.session.selectedAccountId;
  const request = req.body;

  // Validate request
  if (!validateCreateWorkspaceRequest(request)) {
    return sendError(res, 400, ApiErrorCode.INVALID_DETAILS, 'Invalid workspace data');
  }

  try {
    const workspace = await createWorkspace(ownerId, request);
    return sendSuccess(res, 201, workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to create workspace');
  }
};

/**
 * Get all workspaces for the current user
 */
export const getUserWorkspacesController = async (req: Request, res: Response) => {
  if (!req.session) {
    return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Not authenticated');
  }

  const accountId = req.session.selectedAccountId;

  try {
    // Get workspaces the user owns
    const ownedWorkspaces = await getWorkspacesByOwnerId(accountId);
    
    // Get workspaces the user is a member of
    const memberWorkspaces = await getWorkspacesByMemberId(accountId);
    
    // Combine and remove duplicates
    const allWorkspaces = [...ownedWorkspaces];
    
    // Add member workspaces that are not already in the owned list
    memberWorkspaces.forEach(workspace => {
      if (!allWorkspaces.some(w => w.id === workspace.id)) {
        allWorkspaces.push(workspace);
      }
    });
    
    return sendSuccess(res, 200, { workspaces: allWorkspaces });
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to fetch workspaces');
  }
};

/**
 * Get a specific workspace by ID
 */
export const getWorkspaceController = async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  try {
    const workspace = await getWorkspaceById(workspaceId);
    
    if (!workspace) {
      return sendError(res, 404, ApiErrorCode.WORKSPACE_NOT_FOUND, 'Workspace not found');
    }
    
    return sendSuccess(res, 200, workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to fetch workspace');
  }
};

/**
 * Update a workspace
 */
export const updateWorkspaceController = async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const request = req.body;

  // Validate request
  if (!validateUpdateWorkspaceRequest(request)) {
    return sendError(res, 400, ApiErrorCode.INVALID_DETAILS, 'Invalid update data');
  }

  try {
    const updatedWorkspace = await updateWorkspace(workspaceId, request);
    
    if (!updatedWorkspace) {
      return sendError(res, 404, ApiErrorCode.WORKSPACE_NOT_FOUND, 'Workspace not found');
    }
    
    return sendSuccess(res, 200, updatedWorkspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to update workspace');
  }
};

/**
 * Delete a workspace
 */
export const deleteWorkspaceController = async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  try {
    const success = await deleteWorkspace(workspaceId);
    
    if (!success) {
      return sendError(res, 404, ApiErrorCode.WORKSPACE_NOT_FOUND, 'Workspace not found');
    }
    
    return sendSuccess(res, 200, { message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to delete workspace');
  }
};

/**
 * Get all members of a workspace
 */
export const getWorkspaceMembersController = async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  try {
    const members = await getWorkspaceMembers(workspaceId);
    return sendSuccess(res, 200, { members });
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to fetch workspace members');
  }
};

/**
 * Add a member to a workspace
 */
export const addWorkspaceMemberController = async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const request = req.body;

  // Validate request
  if (!validateAddMemberRequest(request)) {
    return sendError(res, 400, ApiErrorCode.INVALID_DETAILS, 'Invalid member data');
  }

  try {
    const member = await addWorkspaceMember(workspaceId, request);
    
    if (!member) {
      return sendError(res, 404, ApiErrorCode.WORKSPACE_NOT_FOUND, 'Workspace not found');
    }
    
    return sendSuccess(res, 201, member);
  } catch (error) {
    console.error('Error adding workspace member:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to add workspace member');
  }
};

/**
 * Update a workspace member
 */
export const updateWorkspaceMemberController = async (req: Request, res: Response) => {
  const { workspaceId, accountId } = req.params;
  const request = req.body;

  // Validate request
  if (!validateUpdateMemberRequest(request)) {
    return sendError(res, 400, ApiErrorCode.INVALID_DETAILS, 'Invalid update data');
  }

  try {
    const updatedMember = await updateWorkspaceMember(workspaceId, accountId, request);
    
    if (!updatedMember) {
      return sendError(res, 404, ApiErrorCode.WORKSPACE_MEMBER_NOT_FOUND, 'Member not found');
    }
    
    return sendSuccess(res, 200, updatedMember);
  } catch (error) {
    console.error('Error updating workspace member:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to update workspace member');
  }
};

/**
 * Remove a member from a workspace
 */
export const removeWorkspaceMemberController = async (req: Request, res: Response) => {
  const { workspaceId, accountId } = req.params;

  try {
    const success = await removeWorkspaceMember(workspaceId, accountId);
    
    if (!success) {
      return sendError(res, 404, ApiErrorCode.WORKSPACE_MEMBER_NOT_FOUND, 'Member not found or cannot be removed');
    }
    
    return sendSuccess(res, 200, { message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing workspace member:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to remove workspace member');
  }
};

/**
 * Share content to a workspace
 * Updated to use feature-specific service implementation
 */
export const shareContentController = async (req: Request, res: Response) => {
  if (!req.session) {
    return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Not authenticated');
  }

  const { workspaceId } = req.params;
  const accountId = req.session.selectedAccountId;
  const request = req.body;
  
  // Get content type from the URL or request body
  let contentType: WorkspaceFeatureType;
  if (req.path.includes('/content/email')) {
    contentType = WorkspaceFeatureType.Email;
  } else if (req.path.includes('/content/files')) {
    contentType = WorkspaceFeatureType.Files;
  } else if (req.path.includes('/content/calendar')) {
    contentType = WorkspaceFeatureType.Calendar;
  } else if (req.path.includes('/content/contacts')) {
    contentType = WorkspaceFeatureType.Contacts;
  } else {
    // Use type from request body if not in URL
    contentType = request.contentType;
  }

  // Validate request
  if (!validateShareContentRequest(request)) {
    return sendError(res, 400, ApiErrorCode.INVALID_DETAILS, 'Invalid content data');
  }

  try {
    // Use the appropriate service based on content type
    const content = await shareContentToWorkspaceByType(
      workspaceId, 
      accountId, 
      request.contentId,
      contentType,
      request.metadata || {}
    );
    
    if (!content) {
      return sendError(res, 404, ApiErrorCode.WORKSPACE_NOT_FOUND, 'Workspace not found or feature disabled');
    }
    
    return sendSuccess(res, 201, content);
  } catch (error) {
    console.error('Error sharing content to workspace:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to share content');
  }
};

/**
 * Get all content in a workspace
 * Updated to use feature-specific service implementation when filtering by type
 */
export const getWorkspaceContentController = async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { type } = req.query;

  try {
    let contents;
    if (type && Object.values(WorkspaceFeatureType).includes(type as WorkspaceFeatureType)) {
      // Use feature-specific service when filtering by type
      contents = await getWorkspaceContentByType(workspaceId, type as WorkspaceFeatureType);
    } else {
      // Use generic service for all content
      contents = await getWorkspaceContent(workspaceId);
    }
    
    return sendSuccess(res, 200, { contents });
  } catch (error) {
    console.error('Error fetching workspace content:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to fetch workspace content');
  }
};

/**
 * Remove content from a workspace
 */
export const removeContentController = async (req: Request, res: Response) => {
  const { workspaceId, contentId } = req.params;

  try {
    const success = await removeContentFromWorkspace(workspaceId, contentId);
    
    if (!success) {
      return sendError(res, 404, ApiErrorCode.RESOURCE_NOT_FOUND, 'Content not found');
    }
    
    return sendSuccess(res, 200, { message: 'Content removed successfully' });
  } catch (error) {
    console.error('Error removing content from workspace:', error);
    return sendError(res, 500, ApiErrorCode.SERVER_ERROR, 'Failed to remove content');
  }
};