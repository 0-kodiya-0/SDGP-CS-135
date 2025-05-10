export enum EnvironmentStatus {
    Active = 'active',
    Archived = 'archived',
    Suspended = 'suspended'
}

export enum EnvironmentPrivacy {
    Private = 'private',
    Global = 'global',
    Shared = 'shared'
}

export interface Environment {
    id: string;
    accountId: string;
    name: string;
    created: string;
    lastModified: string;
    status: EnvironmentStatus;
    privacy: EnvironmentPrivacy;
}

export interface CreateEnvironmentRequest {
    name: string;
    privacy?: EnvironmentPrivacy;
    status?: EnvironmentStatus;
}

export interface UpdateEnvironmentRequest {
    name?: string;
    status?: EnvironmentStatus;
    privacy?: EnvironmentPrivacy;
}

// DTO for returning to frontend
export interface EnvironmentDTO {
    id: string;
    accountId: string;
    name: string;
    created: string;
    lastModified: string;
    status: EnvironmentStatus;
    privacy: EnvironmentPrivacy;
}

// For storing active environment selection
export interface ActiveEnvironment {
    accountId: string;
    environmentId: string;
    lastSelected: string;
}