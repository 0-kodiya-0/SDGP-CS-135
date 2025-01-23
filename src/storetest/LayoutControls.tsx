import { Plus } from 'lucide-react';
import { SplitDirection } from '../types/layout.types';
import SplitDirectionSelect from './SplitDirectionSelect';

interface LayoutControlsProps {
    selectedGroupId: string | null;
    treeExists: boolean;
    splitDirection: SplitDirection;
    onSplitDirectionChange: (direction: SplitDirection) => void;
    onAddItem: () => void;
}

const LayoutControls = ({
    selectedGroupId,
    treeExists,
    splitDirection,
    onSplitDirectionChange,
    onAddItem
}: LayoutControlsProps) => {
    return (
        <div className="flex items-center gap-4">
            <SplitDirectionSelect
                selectedDirection={splitDirection}
                onDirectionChange={onSplitDirectionChange}
            />
            <button
                onClick={onAddItem}
                className={`
                    inline-flex items-center gap-2 font-medium py-2 px-4 rounded-lg 
                    transition-colors duration-150
                    ${selectedGroupId || !treeExists
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
            >
                <Plus className="w-4 h-4" />
                Add Tab
            </button>
        </div>
    );
};

export default LayoutControls;