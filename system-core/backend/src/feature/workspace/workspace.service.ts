import db from '../../config/db';
import {
    Workspace,
    WorkspaceMember,
    WorkspaceContent,
    WorkspaceFeatureType,
    WorkspaceRole,
    WorkspacePermission,
    CreateWorkspaceRequest,
    UpdateWorkspaceRequest,
    AddWorkspaceMemberRequest,
    UpdateWorkspaceMemberRequest,
    ShareContentRequest
} from './workspace.types';
import {
    generateWorkspaceId,
    generateContentId,
    getCurrentTimestamp,
    toWorkspace,
    toWorkspaceMember,
    toWorkspaceContent,
    getDefaultPermissions,
    getDefaultWorkspaceFeatures
} from './workspace.utils';

/**
 * Create a new workspace
 */
export const createWorkspace = async (
    ownerId: string,
    request: CreateWorkspaceRequest
): Promise<Workspace> => {
    const models = await db.getModels();
    const WorkspaceModels = await initWorkspaceModels();

    const workspaceId = generateWorkspaceId();
    const now = getCurrentTimestamp();

    // Create workspace document
    const workspace = new WorkspaceModels.Workspace({
        id: workspaceId,
        name: request.name,
        description: request.description || '',
        created: now,
        updated: now,
        ownerId,
        features: request.features || getDefaultWorkspaceFeatures()
    });

    // Save workspace
    await workspace.save();

    // Add owner as a member with full permissions
    const ownerMember = new WorkspaceModels.WorkspaceMember({
        workspaceId,
        accountId: ownerId,
        role: WorkspaceRole.Owner,
        joinedAt: now,
        permissions: getDefaultPermissions(WorkspaceRole.Owner)
    });

    await ownerMember.save();

    return toWorkspace(workspace)!;
};

/**
 * Get workspace by ID
 */
export const getWorkspaceById = async (
    workspaceId: string
): Promise<Workspace | null> => {
    const WorkspaceModels = await initWorkspaceModels();

    const workspace = await WorkspaceModels.Workspace.findOne({ id: workspaceId });
    return toWorkspace(workspace);
};

/**
 * Get workspaces by owner ID
 */
export const getWorkspacesByOwnerId = async (
    ownerId: string
): Promise<Workspace[]> => {
    const WorkspaceModels = await initWorkspaceModels();

    const workspaces = await WorkspaceModels.Workspace.find({ ownerId });
    return workspaces.map(workspace => toWorkspace(workspace)!);
};

/**
 * Get workspaces that a user is a member of
 */
export const getWorkspacesByMemberId = async (
    accountId: string
): Promise<Workspace[]> => {
    const WorkspaceModels = await initWorkspaceModels();

    // Find all memberships for the user
    const memberships = await WorkspaceModels.WorkspaceMember.find({ accountId });

    if (memberships.length === 0) {
        return [];
    }

    // Get the workspace IDs
    const workspaceIds = memberships.map(member => member.workspaceId);

    // Fetch all workspaces
    const workspaces = await WorkspaceModels.Workspace.find({ id: { $in: workspaceIds } });

    return workspaces.map(workspace => toWorkspace(workspace)!);
};

/**
 * Update a workspace
 */
export const updateWorkspace = async (
    workspaceId: string,
    update: UpdateWorkspaceRequest
): Promise<Workspace | null> => {
    const WorkspaceModels = await initWorkspaceModels();

    const workspace = await WorkspaceModels.Workspace.findOne({ id: workspaceId });

    if (!workspace) {
        return null;
    }

    // Apply updates
    if (update.name !== undefined) {
        workspace.name = update.name;
    }

    if (update.description !== undefined) {
        workspace.description = update.description;
    }

    if (update.features !== undefined) {
        // Update only the specified features
        update.features.forEach(featureUpdate => {
            const existingFeatureIndex = workspace.features.findIndex(
                f => f.type === featureUpdate.type
            );

            if (existingFeatureIndex >= 0) {
                // Update existing feature
                if (featureUpdate.enabled !== undefined) {
                    workspace.features[existingFeatureIndex].enabled = featureUpdate.enabled;
                }
            } else if (featureUpdate.type) {
                // Add new feature
                workspace.features.push({
                    type: featureUpdate.type,
                    enabled: featureUpdate.enabled !== undefined ? featureUpdate.enabled : true
                });
            }
        });
    }

    workspace.updated = getCurrentTimestamp();

    await workspace.save();

    return toWorkspace(workspace);
};

/**
 * Delete a workspace
 */
export const deleteWorkspace = async (
    workspaceId: string
): Promise<boolean> => {
    const WorkspaceModels = await initWorkspaceModels();

    // Delete the workspace
    const deleteResult = await WorkspaceModels.Workspace.deleteOne({ id: workspaceId });

    if (deleteResult.deletedCount === 0) {
        return false;
    }

    // Delete all memberships
    await WorkspaceModels.WorkspaceMember.deleteMany({ workspaceId });

    // Delete all content
    await WorkspaceModels.WorkspaceContent.deleteMany({ workspaceId });

    return true;
};

/**
 * Get workspace members
 */
export const getWorkspaceMembers = async (
    workspaceId: string
): Promise<WorkspaceMember[]> => {
    const WorkspaceModels = await initWorkspaceModels();

    const members = await WorkspaceModels.WorkspaceMember.find({ workspaceId });
    return members.map(member => toWorkspaceMember(member)!);
};

/**
 * Get a specific workspace member
 */
export const getWorkspaceMember = async (
    workspaceId: string,
    accountId: string
): Promise<WorkspaceMember | null> => {
    const WorkspaceModels = await initWorkspaceModels();

    const member = await WorkspaceModels.WorkspaceMember.findOne({
        workspaceId,
        accountId
    });

    return toWorkspaceMember(member);
};

/**
 * Add a member to a workspace
 */
export const addWorkspaceMember = async (
    workspaceId: string,
    request: AddWorkspaceMemberRequest
): Promise<WorkspaceMember | null> => {
    const WorkspaceModels = await initWorkspaceModels();

    // Check if workspace exists
    const workspace = await WorkspaceModels.Workspace.findOne({ id: workspaceId });

    if (!workspace) {
        return null;
    }

    // Check if member already exists
    const existingMember = await WorkspaceModels.WorkspaceMember.findOne({
        workspaceId,
        accountId: request.accountId
    });

    if (existingMember) {
        return toWorkspaceMember(existingMember);
    }

    // Create new member
    const now = getCurrentTimestamp();
    const newMember = new WorkspaceModels.WorkspaceMember({
        workspaceId,
        accountId: request.accountId,
        role: request.role,
        joinedAt: now,
        permissions: request.permissions || getDefaultPermissions(request.role)
    });

    await newMember.save();

    return toWorkspaceMember(newMember);
};

/**
 * Update a workspace member
 */
export const updateWorkspaceMember = async (
    workspaceId: string,
    accountId: string,
    update: UpdateWorkspaceMemberRequest
): Promise<WorkspaceMember | null> => {
    const WorkspaceModels = await initWorkspaceModels();

    const member = await WorkspaceModels.WorkspaceMember.findOne({
        workspaceId,
        accountId
    });

    if (!member) {
        return null;
    }

    // Apply updates
    if (update.role !== undefined) {
        member.role = update.role;

        // If permissions not explicitly specified, update them based on the new role
        if (update.permissions === undefined) {
            member.permissions = getDefaultPermissions(update.role);
        }
    }

    if (update.permissions !== undefined) {
        member.permissions = update.permissions;
    }

    await member.save();

    return toWorkspaceMember(member);
};

/**
 * Remove a member from a workspace
 */
export const removeWorkspaceMember = async (
    workspaceId: string,
    accountId: string
): Promise<boolean> => {
    const WorkspaceModels = await initWorkspaceModels();

    // Check if it's the owner
    const workspace = await WorkspaceModels.Workspace.findOne({ id: workspaceId });

    if (workspace && workspace.ownerId === accountId) {
        // Can't remove the owner
        return false;
    }

    const deleteResult = await WorkspaceModels.WorkspaceMember.deleteOne({
        workspaceId,
        accountId
    });

    return deleteResult.deletedCount > 0;
};

// Import the initWorkspaceModels function
import initWorkspaceModels from './workspace.model';

/**
 * Share content to a workspace
 */
export const shareContentToWorkspace = async (
    workspaceId: string,
    sharedBy: string,
    request: ShareContentRequest
): Promise<WorkspaceContent | null> => {
    const WorkspaceModels = await initWorkspaceModels();

    // Check if workspace exists
    const workspace = await WorkspaceModels.Workspace.findOne({ id: workspaceId });

    if (!workspace) {
        return null;
    }

    // Check if the feature is enabled
    const feature = workspace.features.find(f => f.type === request.contentType);

    if (!feature || !feature.enabled) {
        return null;
    }

    // Check if content already shared
    const existingContent = await WorkspaceModels.WorkspaceContent.findOne({
        workspaceId,
        contentType: request.contentType,
        contentId: request.contentId
    });

    if (existingContent) {
        // Update metadata if provided
        if (request.metadata) {
            existingContent.metadata = {
                ...existingContent.metadata,
                ...request.metadata
            };
            await existingContent.save();
        }

        return toWorkspaceContent(existingContent);
    }

    // Create new content
    const now = getCurrentTimestamp();
    const newContent = new WorkspaceModels.WorkspaceContent({
        id: generateContentId(),
        workspaceId,
        contentType: request.contentType,
        contentId: request.contentId,
        sharedBy,
        sharedAt: now,
        metadata: request.metadata || {}
    });

    await newContent.save();

    return toWorkspaceContent(newContent);
};

/**
 * Get all content in a workspace
 */
export const getWorkspaceContent = async (
    workspaceId: string,
    contentType?: WorkspaceFeatureType
): Promise<WorkspaceContent[]> => {
    const WorkspaceModels = await initWorkspaceModels();

    // Build query
    const query: any = { workspaceId };

    if (contentType) {
        query.contentType = contentType;
    }

    const contents = await WorkspaceModels.WorkspaceContent.find(query);
    return contents.map(content => toWorkspaceContent(content)!);
};

/**
 * Get specific content by ID
 */
export const getContentById = async (
    contentId: string
): Promise<WorkspaceContent | null> => {
    const WorkspaceModels = await initWorkspaceModels();

    const content = await WorkspaceModels.WorkspaceContent.findOne({ id: contentId });
    return toWorkspaceContent(content);
};

/**
 * Remove content from a workspace
 */
export const removeContentFromWorkspace = async (
    workspaceId: string,
    contentId: string
): Promise<boolean> => {
    const WorkspaceModels = await initWorkspaceModels();

    const deleteResult = await WorkspaceModels.WorkspaceContent.deleteOne({
        workspaceId,
        id: contentId
    });

    return deleteResult.deletedCount > 0;
};

/**
 * Check if user is a member of a workspace
 */
export const isWorkspaceMember = async (
    workspaceId: string,
    accountId: string
): Promise<boolean> => {
    const WorkspaceModels = await initWorkspaceModels();

    const member = await WorkspaceModels.WorkspaceMember.findOne({
        workspaceId,
        accountId
    });

    return member !== null;
};

/**
 * Check if user is the owner of a workspace
 */
export const isWorkspaceOwner = async (
    workspaceId: string,
    accountId: string
): Promise<boolean> => {
    const WorkspaceModels = await initWorkspaceModels();

    const workspace = await WorkspaceModels.Workspace.findOne({ id: workspaceId });
    return workspace !== null && workspace.ownerId === accountId;
};