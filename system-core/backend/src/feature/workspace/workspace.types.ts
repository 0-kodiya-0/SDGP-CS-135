// Define types for the workspace feature

export enum WorkspaceFeatureType {
    Email = 'email',
    Files = 'files',
    Calendar = 'calendar',
    Contacts = 'contacts'
}

export enum WorkspaceRole {
    Owner = 'owner',
    Admin = 'admin',
    Editor = 'editor',
    Viewer = 'viewer'
}

export enum WorkspacePermissionOperation {
    Read = 'read',
    Write = 'write',
    Delete = 'delete',
    Share = 'share',
    Admin = 'admin'
}

export interface WorkspaceFeature {
    type: WorkspaceFeatureType;
    enabled: boolean;
}

export interface WorkspacePermission {
    feature: WorkspaceFeatureType;
    operations: WorkspacePermissionOperation[];
}

export interface WorkspaceMember {
    workspaceId: string;
    accountId: string;
    role: WorkspaceRole;
    joinedAt: string;
    permissions: WorkspacePermission[];
}

export interface WorkspaceContentMetadata {
    title?: string;
    description?: string;
    createdAt?: string;
    modifiedAt?: string;
    fileType?: string;
    size?: number;
    thumbnailUrl?: string;
    url?: string;
    [key: string]: any; // Allow for additional type-specific metadata
}

export interface WorkspaceContent {
    id: string;
    workspaceId: string;
    contentType: WorkspaceFeatureType;
    contentId: string; // Original ID from source system
    sharedBy: string; // Account ID of who shared it
    sharedAt: string;
    metadata: WorkspaceContentMetadata;
}

export interface Workspace {
    id: string;
    name: string;
    description?: string;
    created: string;
    updated: string;
    ownerId: string; // Account ID of the creator
    features: WorkspaceFeature[];
}

// Types for API responses
export interface WorkspaceListResponse {
    workspaces: Workspace[];
}

export interface WorkspaceMemberListResponse {
    members: WorkspaceMember[];
}

export interface WorkspaceContentListResponse {
    contents: WorkspaceContent[];
}

// Types for API requests
export interface CreateWorkspaceRequest {
    name: string;
    description?: string;
    features?: Partial<WorkspaceFeature>[];
}

export interface UpdateWorkspaceRequest {
    name?: string;
    description?: string;
    features?: Partial<WorkspaceFeature>[];
}

export interface AddWorkspaceMemberRequest {
    accountId: string;
    role: WorkspaceRole;
    permissions?: WorkspacePermission[];
}

export interface UpdateWorkspaceMemberRequest {
    role?: WorkspaceRole;
    permissions?: WorkspacePermission[];
}

export interface ShareContentRequest {
    contentId: string;
    contentType: WorkspaceFeatureType;
    metadata?: WorkspaceContentMetadata;
}