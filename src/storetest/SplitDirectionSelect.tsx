import { Rows, Columns } from "lucide-react";
import { SplitDirection } from "../types/layout.types";

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

export default SplitDirectionSelect;