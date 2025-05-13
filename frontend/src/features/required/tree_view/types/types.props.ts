import { SplitDirection, TreeNode } from "./types.data";

export interface TreeViewProps {
    tree: TreeNode | null;
    selectedGroupId: string | null;
    onSelectGroup: (id: string) => void;
    onRemoveItem: (itemId: string) => void;
    accountId: string; // Add accountId to TreeViewProps
}

export interface ResizeHandleProps {
    id: string;
    direction: SplitDirection;
}

export interface GroupPanelProps {
    node: TreeNode;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onRemove: (itemId: string) => void;
    accountId: string; // Add accountId to GroupPanelProps
}