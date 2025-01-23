import { TabGroup, TabItem } from "../types/layout.types";

interface PopupProps {
    data: TabGroup | TabItem;
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

export default DataPopup;