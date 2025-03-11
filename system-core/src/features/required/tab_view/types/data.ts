// types/tabs.ts
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
    contentState: any; // This will be more specific based on your content types
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
    contentState: any;
    order: number;
}