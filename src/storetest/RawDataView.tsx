import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import useStore from '../store/store';

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

export default RawDataView;