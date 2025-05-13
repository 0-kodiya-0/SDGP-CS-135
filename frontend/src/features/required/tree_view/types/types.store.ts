import { ID, TabGroup, SplitDirection, TreeNode } from "./types.data.ts";

export type Groups = Record<ID, TabGroup>
export type Items = Record<ID, TabItem>

// Updated TabItem without content
export interface TabItem {
    id: ID
    tabGroupId: string
    title: string
    tabViewId: string  // Add tabViewId to associate with TabView
}

export interface StoreState {
    groups: Groups;
    items: Items;

    // Updated addItem without content parameter
    addItem: (title: string, groupId?: ID, splitDirection?: SplitDirection, tabViewId?: string) => TabItem;

    removeItem: (itemId: ID) => TabItem;

    getItem: (itemId: ID) => TabItem | null;

    getRootGroup: () => TabGroup | null
    getGroupChildren: (groupId: ID) => TabGroup[]
    getTreeStructure: () => TreeNode | null
}