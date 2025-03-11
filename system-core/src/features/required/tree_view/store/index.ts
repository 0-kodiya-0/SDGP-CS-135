import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ID, SplitDirection, TabGroup, TabItem, TreeNode } from '../types/data.ts';
import { StoreState } from '../types/store.ts';

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            groups: {},
            items: {},
            addItem: (title: string, content: React.ReactNode, groupId?: ID, splitDirection?: SplitDirection) => {
                const items = get().items;
                const groups = get().groups;

                // Create the new item
                const item: TabItem = {
                    id: crypto.randomUUID(),
                    title: title,
                    tabGroupId: "",
                    content: content
                }

                // Handle first item case
                if (Object.keys(groups).length <= 0) {
                    const group: TabGroup = {
                        id: crypto.randomUUID(),
                        splitDirection: null,
                        tabItem: item.id,
                        order: 0
                    }
                    item.tabGroupId = group.id;
                    set(state => ({
                        ...state,
                        groups: {
                            ...state.groups,
                            [group.id]: group
                        },
                        items: {
                            ...state.items,
                            [item.id]: item
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
                const newGroups: TabGroup[] = [
                    {
                        id: crypto.randomUUID(),
                        splitDirection: null,
                        tabItem: targetGroup.tabItem,  // Existing item goes in first group
                        parentId: groupId,
                        order: maxOrder + 1
                    },
                    {
                        id: crypto.randomUUID(),
                        splitDirection: null,
                        tabItem: item.id,  // New item goes in second group
                        parentId: groupId,
                        order: maxOrder + 2
                    }
                ];

                // Update existing item's group reference
                items[targetGroup.tabItem].tabGroupId = newGroups[0].id;

                // Set new item's group reference
                item.tabGroupId = newGroups[1].id;

                // Update target group
                targetGroup.splitDirection = splitDirection;
                targetGroup.tabItem = null;

                // Update store
                set(state => ({
                    ...state,
                    groups: {
                        ...state.groups,
                        [newGroups[0].id]: newGroups[0],
                        [newGroups[1].id]: newGroups[1],
                        [groupId]: targetGroup,
                    },
                    items: {
                        ...items,
                        [item.id]: item
                    }
                }));

                return item;
            },

            removeItem: (itemId: ID) => {
                const state = get();
                const items = { ...state.items };
                const groups = { ...state.groups };

                // Get the item and its group
                const item = items[itemId];
                if (!item) throw new Error("Item not found");

                const itemGroup = groups[item.tabGroupId];
                if (!itemGroup) throw new Error("Item's group not found");

                // If this is the only item in the store, clear everything
                if (Object.keys(items).length === 1) {
                    set({ items: {}, groups: {} });
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
                set({
                    items,
                    groups
                });

                return item;
            },

            getItem: (itemId: ID) => {
                const item = get().items[itemId];
                if (!item) return null;
                return item;
            },

            getRootGroup: () => {
                const groups = get().groups;
                return Object.values(groups).find(group => !group.parentId) || null;
            },

            getGroupChildren: (groupId: ID) => {
                const groups = get().groups;
                return Object.values(groups)
                    .filter(group => group.parentId === groupId)
                    .sort((a, b) => a.order - b.order);
            },

            getTreeStructure: () => {
                const buildTree = (group: TabGroup): TreeNode => {
                    const items = get().items;
                    const children = get().getGroupChildren(group.id);

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

                const rootGroup = get().getRootGroup();
                if (!rootGroup) return null;

                return buildTree(rootGroup);
            }
        }),
        {
            name: 'layout-store',
            version: 1,
        }
    )
);