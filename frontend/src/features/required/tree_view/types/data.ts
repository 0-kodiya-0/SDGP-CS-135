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
    content: React.ReactNode
}

export interface DropInfo {
    targetGroupId: string
    dropZone: DropZone
    newTabInfo?: TabItemInfo
}

export interface TabItem {
    id: ID
    tabGroupId: string
    title: string
    content: React.ReactNode
}

export interface TabGroup {
    id: ID;
    splitDirection: SplitDirection | null;
    tabItem: ID | null;
    parentId?: ID;
    order: number;  // Added order property
}

export interface TreeNode {
    id: ID
    type: 'group'
    splitDirection: SplitDirection | null
    tabItem: (TabItem & { type: 'item' }) | null
    children: TreeNode[]
}