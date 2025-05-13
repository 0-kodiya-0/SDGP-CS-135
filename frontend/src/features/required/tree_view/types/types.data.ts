export type ID = string;

export enum SplitDirection {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical'
}

export enum DropZone {
    CENTER = 'center',
    TOP = 'top',
    RIGHT = 'right',
    BOTTOM = 'bottom',
    LEFT = 'left'
}

export interface TabItemInfo {
    title: string
    // Removed content property
}

export interface DropInfo {
    targetGroupId: string
    dropZone: DropZone
    newTabInfo?: TabItemInfo
}

// Updated TabItem without content
export interface TabItem {
    id: ID
    tabGroupId: string
    title: string
    tabViewId: string  // Add tabViewId to associate with TabView
}

export interface TabGroup {
    id: ID;
    splitDirection: SplitDirection | null;
    tabItem: ID | null;
    parentId?: ID;
    order: number;
}

// Updated TreeNode without content
export interface TreeNode {
    id: ID
    type: 'group'
    splitDirection: SplitDirection | null
    tabItem: (TabItem & { type: 'item' }) | null
    children: TreeNode[]
}