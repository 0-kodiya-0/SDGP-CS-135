import { LayoutGrid } from 'lucide-react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { TreeNode } from '../types/layout.types';
import GroupPanel from './GroupPanel';
import ResizeHandle from './ResizeHandle';
import useStore from '../store/store';
import React from 'react';

interface TreeViewProps {
    tree: TreeNode | null;
    selectedGroupId: string | null;
    onSelectGroup: (id: string) => void;
    onRemoveItem: (itemId: string, e: React.MouseEvent) => void;
}

const TreeView = ({
    tree,
    selectedGroupId,
    onSelectGroup,
    onRemoveItem
}: TreeViewProps) => {
    const items = useStore(state => state.items);

    const flattenSimilarDirections = (node: TreeNode): { nodes: TreeNode[], totalSize: number } => {
        if (node.children.length === 0 || node.tabItem) {
            return { nodes: [node], totalSize: 100 };
        }

        let result: TreeNode[] = [];
        let totalSize = 0;

        node.children.forEach((child, index) => {
            if (child.splitDirection === node.splitDirection && !child.tabItem) {
                const flattened = flattenSimilarDirections(child);
                result = [...result, ...flattened.nodes];
                totalSize += flattened.totalSize;
            } else {
                result.push(child);
                totalSize += 100;
            }
        });

        return { nodes: result, totalSize };
    };

    const renderTreeNode = (node: TreeNode): JSX.Element => {
        if (node.children.length === 0) {
            return (
                <GroupPanel
                    node={node}
                    isSelected={selectedGroupId === node.id}
                    content={node.tabItem && items[node.tabItem.id]?.content}
                    onSelect={onSelectGroup}
                    onRemove={onRemoveItem}
                />
            );
        }

        const { nodes: flattenedChildren, totalSize } = flattenSimilarDirections(node);
        const defaultPanelSize = 100 / flattenedChildren.length;

        return (
            <PanelGroup
                direction={node.splitDirection === 'horizontal' ? 'horizontal' : 'vertical'}
                className="h-full"
                id={`pg-${node.id}`}
            >
                {flattenedChildren.map((child, index) => (
                    <React.Fragment key={child.id}>
                        <Panel 
                            minSize={20} 
                            defaultSize={defaultPanelSize}
                            id={`panel-${child.id}`}
                            order={index}
                        >
                            {renderTreeNode(child)}
                        </Panel>
                        {index < flattenedChildren.length - 1 && (
                            <ResizeHandle 
                                id={`handle-${node.id}-${index}`}
                                direction={node.splitDirection}
                            />
                        )}
                    </React.Fragment>
                ))}
            </PanelGroup>
        );
    };

    if (!tree) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LayoutGrid className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No tabs added yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Click the 'Add Tab' button to start
                    </p>
                </div>
            </div>
        );
    }

    return renderTreeNode(tree);
};

export default TreeView;