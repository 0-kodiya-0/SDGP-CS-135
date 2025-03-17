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
    id: number;
    accountId: string;
    name: string;
    created: string;
    lastModified: string;
    status: EnvironmentStatus;
    privacy: EnvironmentPrivacy;
}