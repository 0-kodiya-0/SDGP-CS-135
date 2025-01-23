import { X } from 'lucide-react';
import { TreeNode } from '../types/layout.types';

interface GroupPanelProps {
    node: TreeNode;
    isSelected: boolean;
    content?: React.ReactNode;
    onSelect: (id: string) => void;
    onRemove: (itemId: string, e: React.MouseEvent) => void;
}

const GroupPanel = ({
    node,
    isSelected,
    content,
    onSelect,
    onRemove
}: GroupPanelProps) => {
    return (
        <div
            className={`
                flex flex-col w-full h-full
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
            }}
        >
            <div className="flex items-center justify-between p-2 bg-white border-b">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-700 truncate">
                        Group {node.id.slice(0, 4)}
                    </span>
                </div>
                {node.tabItem && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-sm">
                            <span className="font-medium text-blue-700">
                                {node.tabItem.title}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(node.tabItem!.id, e);
                            }}
                            className="p-1 rounded-full hover:bg-red-100 group"
                        >
                            <X className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                        </button>
                    </div>
                )}
            </div>
            {content && (
                <div className="flex-1 bg-gray-50">
                    {content}
                </div>
            )}
        </div>
    );
}

export default GroupPanel;