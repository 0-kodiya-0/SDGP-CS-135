import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ID, SplitDirection, TabGroup, TabItem, TreeNode } from '../types/types.data.ts';
import { ItemPosition, StoreState } from '../types/types.store.ts';

export const useTreeStore = create<StoreState>()(
    persist(
        (set, get) => ({
            accountTrees: {},

            initializeAccount: (accountId: string) => {
                const state = get();
                if (!state.accountTrees[accountId]) {
                    set({
                        accountTrees: {
                            ...state.accountTrees,
                            [accountId]: {
                                groups: {},
                                items: {},
                            }
                        }
                    });
                }
            },

            addItem: (
                accountId: string,
                title: string,
                groupId?: ID,
                splitDirection?: SplitDirection,
                tabViewId?: string,
                position?: ItemPosition
            ) => {
                // Ensure account is initialized
                get().initializeAccount(accountId);

                const items = get().getAccountItems(accountId);
                const groups = get().getAccountGroups(accountId);

                // Create the new item (without content)
                const item: TabItem = {
                    id: crypto.randomUUID(),
                    title: title,
                    tabGroupId: "",
                    tabViewId: tabViewId || crypto.randomUUID() // Generate tabViewId if not provided
                };

                // Handle first item case - auto-initialize if tree is empty
                if (Object.keys(groups).length <= 0) {
                    const group: TabGroup = {
                        id: crypto.randomUUID(),
                        splitDirection: null,
                        tabItem: item.id,
                        order: 0
                    };
                    item.tabGroupId = group.id;

                    set(state => ({
                        accountTrees: {
                            ...state.accountTrees,
                            [accountId]: {
                                groups: {
                                    ...groups,
                                    [group.id]: group
                                },
                                items: {
                                    ...items,
                                    [item.id]: item
                                }
                            }
                        }
                    }));
                    return item;
                }

                // Validate inputs
                if (!groupId || !splitDirection) {
                    throw new Error(!groupId ? "groupId is required" : "splitDirection is required");
                }

                const targetGroup = groups[groupId];
                if (!targetGroup) {
                    throw new Error("Target group not found");
                }

                // Check if group already has children
                const existingChildren = Object.values(groups).filter(group => group.parentId === groupId);
                if (existingChildren.length > 0) {
                    throw new Error("Target group already has children");
                }

                if (!targetGroup.tabItem) {
                    throw new Error("Target group has no tab item");
                }

                // Get max order of siblings
                const siblingOrders = Object.values(groups)
                    .filter(g => g.parentId === groupId)
                    .map(g => g.order);
                const maxOrder = Math.max(-1, ...siblingOrders);

                // Create new groups with order based on split direction
                const firstGroup = {
                    id: crypto.randomUUID(),
                    splitDirection: null,
                    tabItem: position === 'before' ? item.id : targetGroup.tabItem,
                    parentId: groupId,
                    order: maxOrder + 1
                };

                const secondGroup = {
                    id: crypto.randomUUID(),
                    splitDirection: null,
                    tabItem: position === 'before' ? targetGroup.tabItem : item.id,
                    parentId: groupId,
                    order: maxOrder + 2
                };

                const newGroups: TabGroup[] = [firstGroup, secondGroup];

                items[targetGroup.tabItem].tabGroupId = position === 'before' ? secondGroup.id : firstGroup.id;

                // Set new item's group reference
                item.tabGroupId = position === 'before' ? firstGroup.id : secondGroup.id;

                // Update target group
                targetGroup.splitDirection = splitDirection;
                targetGroup.tabItem = null;

                // Update store
                set(state => ({
                    accountTrees: {
                        ...state.accountTrees,
                        [accountId]: {
                            groups: {
                                ...groups,
                                [newGroups[0].id]: newGroups[0],
                                [newGroups[1].id]: newGroups[1],
                                [groupId]: targetGroup,
                            },
                            items: {
                                ...items,
                                [item.id]: item
                            }
                        }
                    }
                }));

                return item;
            },

            removeItem: (accountId: string, itemId: ID) => {
                get().initializeAccount(accountId);

                const items = { ...get().getAccountItems(accountId) };
                const groups = { ...get().getAccountGroups(accountId) };

                // Get the item and its group
                const item = items[itemId];
                if (!item) throw new Error("Item not found");

                const itemGroup = groups[item.tabGroupId];
                if (!itemGroup) throw new Error("Item's group not found");

                // If this is the only item in the store, clear everything
                if (Object.keys(items).length === 1) {
                    set(state => ({
                        accountTrees: {
                            ...state.accountTrees,
                            [accountId]: { items: {}, groups: {} }
                        }
                    }));
                    return item;
                }

                // Helper function to get siblings under the same parent
                const getSiblings = (parentId: ID) => {
                    return Object.values(groups)
                        .filter(g => g.parentId === parentId)
                        .sort((a, b) => a.order - b.order);
                };

                // Find all groups that will be affected
                const parentGroup = itemGroup.parentId ? groups[itemGroup.parentId] : null;
                if (!parentGroup) {
                    // If no parent (root group), just remove the item and group
                    delete items[itemId];
                    delete groups[itemGroup.id];
                    set(state => ({
                        accountTrees: {
                            ...state.accountTrees,
                            [accountId]: { items, groups }
                        }
                    }));
                    return item;
                }

                // Get siblings
                const siblings = getSiblings(parentGroup.id);
                const otherSibling = siblings.find(g => g.id !== itemGroup.id);

                if (!otherSibling) {
                    throw new Error("Sibling not found");
                }

                // If parent is root
                if (!parentGroup.parentId) {
                    // Make other sibling the new root
                    delete otherSibling.parentId;
                    otherSibling.order = 0;
                } else {
                    // Move other sibling up to parent's parent
                    otherSibling.parentId = parentGroup.parentId;
                    // Maintain the parent's order for the surviving sibling
                    otherSibling.order = parentGroup.order;
                }

                // Remove the item, its group, and the parent group
                delete items[itemId];
                delete groups[itemGroup.id];
                delete groups[parentGroup.id];

                // Update the store
                set(state => ({
                    accountTrees: {
                        ...state.accountTrees,
                        [accountId]: { items, groups }
                    }
                }));

                return item;
            },

            getItem: (accountId: string, itemId: ID) => {
                const items = get().getAccountItems(accountId);
                return items[itemId] || null;
            },

            getRootGroup: (accountId: string) => {
                const groups = get().getAccountGroups(accountId);
                return Object.values(groups).find(group => !group.parentId) || null;
            },

            getGroupChildren: (accountId: string, groupId: ID) => {
                const groups = get().getAccountGroups(accountId);
                return Object.values(groups)
                    .filter(group => group.parentId === groupId)
                    .sort((a, b) => a.order - b.order);
            },

            getTreeStructure: (accountId: string) => {
                get().initializeAccount(accountId);

                const buildTree = (group: TabGroup): TreeNode => {
                    const items = get().getAccountItems(accountId);
                    const children = get().getGroupChildren(accountId, group.id);

                    return {
                        id: group.id,
                        type: 'group',
                        splitDirection: group.splitDirection,
                        tabItem: group.tabItem ? {
                            ...items[group.tabItem],
                            type: 'item'
                        } : null,
                        children: children.map(child => buildTree(child))
                    };
                };

                // Auto-initialize if no root group exists
                let rootGroup = get().getRootGroup(accountId);
                if (!rootGroup) {
                    // Create initial empty tree item
                    get().addItem(accountId, "Initial", undefined, undefined);
                    rootGroup = get().getRootGroup(accountId);
                }

                if (!rootGroup) return null;

                return buildTree(rootGroup);
            },

            // Utility methods
            getAccountGroups: (accountId: string) => {
                get().initializeAccount(accountId);
                return get().accountTrees[accountId]?.groups || {};
            },

            getAccountItems: (accountId: string) => {
                get().initializeAccount(accountId);
                return get().accountTrees[accountId]?.items || {};
            },
        }),
        {
            name: 'tree-layout-store',
            version: 1,
            partialize: (state) => ({ accountTrees: state.accountTrees }),
        }
    )
);