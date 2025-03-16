export interface TabView {
    id: number;
    environmentId: number;
    workspaceId: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Tab {
    id: number;
    tabViewId: number;
    order: number;
    title: string;
    contentPath: string;
    contentState: Record<string, unknown>; // Properly typed instead of any
    createdAt: Date;
    updatedAt: Date;
}

export interface TabViewCreateDTO {
    environmentId: number;
    workspaceId: number;
}

export interface TabCreateDTO {
    tabViewId: number;
    title: string;
    contentPath: string;
    contentState: Record<string, unknown>; // Properly typed instead of any
    order: number;
}