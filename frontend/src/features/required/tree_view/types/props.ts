import { SplitDirection, TreeNode } from "./data.ts";

export interface TreeViewProps {
    tree: TreeNode | null;
    selectedGroupId: string | null;
    onSelectGroup: (id: string) => void;
    onRemoveItem: (itemId: string, e: React.MouseEvent) => void;
}

export interface ResizeHandleProps {
    id: string;
    direction: SplitDirection;
}

export interface GroupPanelProps {
    node: TreeNode;
    isSelected: boolean;
    content?: React.ReactNode;
    onSelect: (id: string) => void;
    onRemove: (itemId: string, e: React.MouseEvent) => void;
}