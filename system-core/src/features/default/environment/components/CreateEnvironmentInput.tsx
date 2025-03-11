import { useRef, useEffect, useState } from "react";
import { CreateEnvironmentInputProps } from "../types/props.ts";
import { useCreateEnvironment } from "../hooks/useEnvironments.ts";
import { useEnvironmentStore } from "../store";
import { EnvironmentPrivacy, EnvironmentStatus } from "../types/data.ts";

export const CreateEnvironmentInput: React.FC<CreateEnvironmentInputProps> = ({
    activeAccount,
    onCancel
}) => {
    const [inputEnvName, setInputEnvName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const createEnvironment = useCreateEnvironment(activeAccount.id);
    const setEnvironment = useEnvironmentStore(state => state.setEnvironment);

    const handleCreateEnvironment = async () => {
        const trimmedName = inputEnvName.trim();
        if (trimmedName.length <= 0) {
            setError('Environment name cannot be empty');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const created = await createEnvironment.mutateAsync({
                accountId: activeAccount.id,
                name: trimmedName,
                status: EnvironmentStatus.Active,
                privacy: EnvironmentPrivacy.Global
            });
            setEnvironment(created);
            onCancel(); // Close the input form after successful creation
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create environment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCreateEnvironment();
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
                    <h2 className="text-lg font-medium mb-4">Create New Environment</h2>
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
                                onClick={handleCreateEnvironment}
                                disabled={isLoading}
                                className={`px-4 py-2 text-sm text-white rounded-md transition-colors
                                ${isLoading
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                            >
                                {isLoading ? 'Creating...' : 'Create Environment'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};