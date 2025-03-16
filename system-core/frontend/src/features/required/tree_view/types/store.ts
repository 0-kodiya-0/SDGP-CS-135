import React from "react";
import { ID, TabGroup, TabItem, SplitDirection, TreeNode } from "./data.ts";

export type Groups = Record<ID, TabGroup>
export type Items = Record<ID, TabItem>

export interface StoreState {
    groups: Groups;
    items: Items;

    addItem: (title: string, content: React.ReactNode, groupId?: ID, splitDirection?: SplitDirection) => TabItem;

    removeItem: (itemId: ID) => TabItem;

    getItem: (itemId: ID) => TabItem | null;

    getRootGroup: () => TabGroup | null
    getGroupChildren: (groupId: ID) => TabGroup[]
    getTreeStructure: () => TreeNode | null
}