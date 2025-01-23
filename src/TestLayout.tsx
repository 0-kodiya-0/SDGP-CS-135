import React, { useEffect, useState } from 'react';
import useStore from './store/store';
import { SplitDirection, TreeNode } from './types/layout.types';
import { ChevronRight, LayoutGrid, Plus, Rows, Columns, X, ChevronDown, Trash2 } from 'lucide-react';

const RawDataView = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Use separate selectors for groups and items to ensure updates
    const groups = useStore(state => state.groups);
    const items = useStore(state => state.items);

    const handleClearStorage = () => {
        if (window.confirm('Are you sure you want to clear all layout data? This action cannot be undone.')) {
            localStorage.removeItem('layout-store');
            window.location.reload();
        }
    };

    return (
        <div className="mt-8 bg-white shadow-sm rounded-xl border border-gray-200">
            <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2"
                >
                    <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                    />
                    <h2 className="text-lg font-semibold text-gray-900">Raw Store Data</h2>
                </button>

                <button
                    onClick={handleClearStorage}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 
                             border border-red-200 hover:border-red-300 rounded-lg
                             transition-colors duration-150 flex items-center gap-1"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Storage
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Groups:</h3>
                            <div className="bg-gray-50 rounded-lg max-h-96 overflow-auto">
                                <pre className="p-4 text-sm h-full">
                                    {JSON.stringify(groups, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Items:</h3>
                            <div className="bg-gray-50 rounded-lg max-h-96 overflow-auto">
                                <pre className="p-4 text-sm h-full">
                                    {JSON.stringify(items, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface PopupProps {
    data: any;
    position: { x: number; y: number } | null;
    onClose: () => void;
}

const DataPopup = ({ data, position, onClose }: PopupProps) => {
    if (!position) return null;

    return (
        <div
            className="fixed z-50 max-w-md bg-white border border-gray-200 rounded-lg shadow-lg"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, calc(-100% - 10px))'  // Position above with 10px gap
            }}
            onMouseLeave={onClose}
        >
            {/* Arrow pointer */}
            <div
                className="absolute left-1/2 bottom-0 w-2 h-2 bg-white border-r border-b border-gray-200 
                         transform translate-y-1 -translate-x-1/2 rotate-45"
            />

            <div className="p-3">
                <pre className="text-xs bg-gray-50 rounded p-2 overflow-auto max-h-48">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
};

const SplitDirectionSelect = ({
    selectedDirection,
    onDirectionChange
}: {
    selectedDirection: SplitDirection;
    onDirectionChange: (direction: SplitDirection) => void;
}) => {
    return (
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
                onClick={() => onDirectionChange(SplitDirection.HORIZONTAL)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded ${selectedDirection === SplitDirection.HORIZONTAL
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
            >
                <Rows className="w-4 h-4" />
                <span className="text-sm font-medium">Horizontal</span>
            </button>
            <button
                onClick={() => onDirectionChange(SplitDirection.VERTICAL)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded ${selectedDirection === SplitDirection.VERTICAL
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
            >
                <Columns className="w-4 h-4" />
                <span className="text-sm font-medium">Vertical</span>
            </button>
        </div>
    );
};

const TestLayout = () => {
    const { addItem, removeItem, getTreeStructure } = useStore();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [splitDirection, setSplitDirection] = useState<SplitDirection>(SplitDirection.HORIZONTAL);
    const [popup, setPopup] = useState<{ data: any; position: { x: number; y: number } | null }>({
        data: null,
        position: null
    });

    const store = useStore();

    const handleAddItem = () => {
        const tree = getTreeStructure();
        const randomId = Math.floor(Math.random() * 1000);

        if (!tree) {
            addItem(
                `Tab ${randomId}`,
                <div className="p-4 h-full bg-gray-50 rounded">Content for Tab {randomId}</div>
            );
        } else if (selectedGroupId) {
            try {
                addItem(
                    `Tab ${randomId}`,
                    <div className="p-4 h-full bg-gray-50 rounded">Content for Tab {randomId}</div>,
                    selectedGroupId,
                    splitDirection
                );
                setSelectedGroupId(null);
            } catch (error) {
                console.error('Failed to add item:', error);
                alert(error instanceof Error ? error.message : 'Failed to add item');
            }
        } else {
            alert('Please select a group first');
        }
    };

    const handleRemoveItem = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent group selection when clicking remove
        try {
            removeItem(itemId);
        } catch (error) {
            console.error('Failed to remove item:', error);
            alert(error instanceof Error ? error.message : 'Failed to remove item');
        }
    };

    const getSplitDirectionIcon = (direction: SplitDirection | null) => {
        if (direction === SplitDirection.HORIZONTAL) {
            return <Rows className="w-4 h-4 text-blue-500" />;
        } else if (direction === SplitDirection.VERTICAL) {
            return <Columns className="w-4 h-4 text-blue-500" />;
        }
        return <LayoutGrid className="w-4 h-4 text-gray-500" />;
    };

    const handleMouseEnter = (event: React.MouseEvent, nodeId: string, isGroup: boolean) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const data = isGroup ? store.groups[nodeId] : store.items[nodeId];

        setPopup({
            data,
            position: {
                x: event.clientX, // Use mouse position instead of element position
                y: event.clientY
            }
        });
    };

    const handleMouseLeave = () => {
        setPopup(prev => ({ ...prev, position: null }));
    };

    const renderTreeNode = (node: TreeNode, depth: number = 0): JSX.Element => {
        const isSelected = selectedGroupId === node.id;

        return (
            <div key={node.id}
                className={`
                    relative
                    ${depth > 0 ? 'mt-2 pl-6' : ''}
                    group
                 `}
            >
                {depth > 0 && (
                    <>
                        <div className="absolute left-0 -top-2 h-4 w-px bg-gray-200" />
                        <div className="absolute left-0 top-4 w-6 h-px bg-gray-200" />
                    </>
                )}

                <div
                    className={`
                        relative flex items-center p-3 
                        rounded-lg border
                        ${node.children.length > 0 ? 'bg-white' : 'bg-gray-50'}
                        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                        cursor-pointer
                        hover:border-blue-300 transition-colors
                    `}
                    onClick={() => setSelectedGroupId(node.id)}
                    onMouseEnter={(e) => handleMouseEnter(e, node.id, true)}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="flex items-center gap-2 min-w-0 flex-grow">
                        {node.children.length > 0 ? (
                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : null}

                        {getSplitDirectionIcon(node.splitDirection)}

                        <span className="text-sm font-medium text-gray-700 truncate">
                            Group {node.id.slice(0, 4)}
                        </span>

                        {node.splitDirection && (
                            <span className="text-xs text-gray-500 shrink-0">
                                {node.splitDirection}
                            </span>
                        )}

                        {node.tabItem && (
                            <>
                                <span className="text-gray-300">|</span>
                                <div
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-sm"
                                    onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        handleMouseEnter(e, node.tabItem!.id, false);
                                    }}
                                    onMouseLeave={(e) => {
                                        e.stopPropagation();
                                        handleMouseLeave();
                                    }}
                                >
                                    <span className="font-medium text-blue-700">
                                        {node.tabItem.title}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {node.tabItem && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(node.tabItem!.id, e);
                            }}
                            className="ml-2 p-1 rounded-full hover:bg-red-100 group"
                        >
                            <X className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                        </button>
                    )}
                </div>

                {node.children.length > 0 && (
                    <div className="mt-2">
                        {node.children.map(child => renderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Log tree structure whenever it changes
    const tree = getTreeStructure();
    useEffect(() => {
        if (tree) {
            console.log('Current Tree Structure:', tree);
        }
    }, [tree]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Existing header section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tab Layout Test Interface</h1>
                </div>
                <div className="flex items-center gap-4">
                    <SplitDirectionSelect
                        selectedDirection={splitDirection}
                        onDirectionChange={setSplitDirection}
                    />
                    <button
                        onClick={handleAddItem}
                        className={`
              inline-flex items-center gap-2 font-medium py-2 px-4 rounded-lg 
              transition-colors duration-150
              ${selectedGroupId || !tree
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
                    >
                        <Plus className="w-4 h-4" />
                        Add Tab
                    </button>
                </div>
            </div>

            {/* Tree View Section */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900">Layout Structure</h2>
                    </div>
                    {selectedGroupId && (
                        <div className="text-sm text-blue-600">
                            Selected: Group {selectedGroupId.slice(0, 4)}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {tree ? (
                        renderTreeNode(tree)
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <LayoutGrid className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No tabs added yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Click the 'Add Tab' button to start
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Raw Data Section */}
            <RawDataView />

            <DataPopup
                data={popup.data}
                position={popup.position}
                onClose={handleMouseLeave}
            />
        </div>
    );
};

export default TestLayout;