import { useRef, useEffect, useState } from "react";
import { useUpdateEnvironment } from "../hooks/useEnvironments.ts";
import { UpdateEnvironmentInputProps } from "../types/props.ts";

export const UpdateEnvironmentInput: React.FC<UpdateEnvironmentInputProps> = ({
    activeEnvironment,
    onCancel
}) => {
    const [inputEnvName, setInputEnvName] = useState<string>(activeEnvironment.name);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const updateEnvironment = useUpdateEnvironment(activeEnvironment.id);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleUpdateEnvironment = async () => {
        const trimmedName = inputEnvName.trim();
        if (trimmedName.length <= 0) {
            setError('Environment name cannot be empty');
            return;
        }

        if (trimmedName === activeEnvironment.name) {
            onCancel();
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await updateEnvironment.mutateAsync({
                id: activeEnvironment.id,
                data: {
                    name: trimmedName,
                    status: activeEnvironment.status
                }
            });
            onCancel();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update environment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleUpdateEnvironment();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="fixed inset-0 z-50" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white shadow-sm rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4">
                    <h2 className="text-lg font-medium mb-4">Update Environment</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Environment name"
                                value={inputEnvName}
                                onChange={(e) => setInputEnvName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none 
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            {error && (
                                <span className="text-xs text-red-500">{error}</span>
                            )}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 
                                rounded-md hover:bg-gray-200 transition-colors
                                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateEnvironment}
                                disabled={isLoading}
                                className={`px-4 py-2 text-sm text-white rounded-md transition-colors
                                ${isLoading
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                            >
                                {isLoading ? 'Updating...' : 'Update Environment'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};