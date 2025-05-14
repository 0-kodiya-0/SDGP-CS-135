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

export type ItemPosition = 'before' | 'after';

// Account-specific tree data
export interface AccountTreeData {
    groups: Groups;
    items: Items;
}

export interface StoreState {
    // Map of account IDs to their tree data
    accountTrees: Record<string, AccountTreeData>;

    // Account management
    initializeAccount: (accountId: string) => void;

    // Updated addItem without content parameter, now includes accountId
    addItem: (
        accountId: string,
        title: string,
        groupId?: ID,
        splitDirection?: SplitDirection,
        tabViewId?: string,
        position?: ItemPosition
    ) => TabItem;

    removeItem: (accountId: string, itemId: ID) => TabItem;

    getItem: (accountId: string, itemId: ID) => TabItem | null;

    getRootGroup: (accountId: string) => TabGroup | null
    getGroupChildren: (accountId: string, groupId: ID) => TabGroup[]
    getTreeStructure: (accountId: string) => TreeNode | null

    // Utilities for getting account-specific data
    getAccountGroups: (accountId: string) => Groups;
    getAccountItems: (accountId: string) => Items;
}