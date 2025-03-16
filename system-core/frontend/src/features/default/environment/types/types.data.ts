export enum EnvironmentPrivacy {
    Private = 'private',
    Global = 'global'
}

export enum EnvironmentStatus {
    Active = 'active',
    Archived = 'archived',
    Deleted = 'deleted'
}

export interface Environment {
    id: number;
    accountId: number;
    name: string;
    created: string;
    lastModified: string;
    status: EnvironmentStatus;
    privacy: EnvironmentPrivacy;
}