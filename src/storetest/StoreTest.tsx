import { useEffect, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import useStore from '../store/store';
import { SplitDirection } from '../types/layout.types';
import LayoutControls from './LayoutControls';
import TreeView from './TreeView';
import RawDataView from './RawDataView';

const StoreTest = () => {
    const { addItem, removeItem, getTreeStructure } = useStore();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [splitDirection, setSplitDirection] = useState<SplitDirection>(SplitDirection.HORIZONTAL);

    const tree = getTreeStructure();

    const handleAddItem = () => {
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
                alert(error instanceof Error ? error.message : 'Failed to remove item');
            }
        } else {
            alert('Please select a group first');
        }
    };

    const handleRemoveItem = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            removeItem(itemId);
        } catch (error) {
            console.error('Failed to remove item:', error);
            alert(error instanceof Error ? error.message : 'Failed to remove item');
        }
    };

    useEffect(() => {
        if (tree) {
            console.log('Current Tree Structure:', tree);
        }
    }, [tree]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tab Layout Test Interface</h1>
                </div>
                <LayoutControls
                    selectedGroupId={selectedGroupId}
                    treeExists={!!tree}
                    splitDirection={splitDirection}
                    onSplitDirectionChange={setSplitDirection}
                    onAddItem={handleAddItem}
                />
            </div>

            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
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
                
                <div className="h-[600px]">
                    <TreeView
                        tree={tree}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={setSelectedGroupId}
                        onRemoveItem={handleRemoveItem}
                    />
                </div>
            </div>

            <RawDataView />
        </div>
    );
};

export default StoreTest;