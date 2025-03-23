import React, { useState } from 'react';
import { GmailLabel, CreateLabelParams, GMAIL_SYSTEM_LABELS } from '../types/types.google.api';
import { Plus, Edit, Trash, Check, X, Tag } from 'lucide-react';
import { getDisplayLabelName, isSystemLabel, getLabelColor } from '../utils/utils.google.api';

interface LabelManagerProps {
    labels: GmailLabel[];
    loading: boolean;
    onCreateLabel: (params: CreateLabelParams) => Promise<GmailLabel | null>;
    onUpdateLabel: (labelId: string, params: Partial<CreateLabelParams>) => Promise<GmailLabel | null>;
    onDeleteLabel: (labelId: string) => Promise<boolean>;
}

const LabelManager: React.FC<LabelManagerProps> = ({
    labels,
    loading,
    onCreateLabel,
    onUpdateLabel,
    onDeleteLabel
}) => {
    // State for new label form
    const [showNewLabelForm, setShowNewLabelForm] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [creatingLabel, setCreatingLabel] = useState(false);

    // State for editing labels
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [editedLabelName, setEditedLabelName] = useState('');

    // State for delete confirmation
    const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // State for error messages
    const [error, setError] = useState<string | null>(null);

    // Filter system labels and custom labels
    const systemLabels = labels.filter(label => isSystemLabel(label.id));
    const customLabels = labels.filter(label => !isSystemLabel(label.id));

    // Create a new label
    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) {
            setError('Label name cannot be empty');
            return;
        }

        try {
            setCreatingLabel(true);
            setError(null);

            const params: CreateLabelParams = {
                name: newLabelName.trim(),
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show'
            };

            const result = await onCreateLabel(params);

            if (result) {
                setNewLabelName('');
                setShowNewLabelForm(false);
            } else {
                setError('Failed to create label');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setCreatingLabel(false);
        }
    };

    // Start editing a label
    const handleStartEdit = (label: GmailLabel) => {
        setEditingLabelId(label.id);
        setEditedLabelName(label.name);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingLabelId(null);
        setEditedLabelName('');
    };

    // Save edited label
    const handleSaveEdit = async (labelId: string) => {
        if (!editedLabelName.trim()) {
            setError('Label name cannot be empty');
            return;
        }

        try {
            setError(null);

            const result = await onUpdateLabel(labelId, {
                name: editedLabelName.trim()
            });

            if (result) {
                setEditingLabelId(null);
            } else {
                setError('Failed to update label');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Confirm delete label
    const handleConfirmDelete = (labelId: string) => {
        setDeletingLabelId(labelId);
        setConfirmDelete(true);
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setDeletingLabelId(null);
        setConfirmDelete(false);
    };

    // Delete label
    const handleDeleteLabel = async (labelId: string) => {
        try {
            setError(null);

            const result = await onDeleteLabel(labelId);

            if (result) {
                setDeletingLabelId(null);
                setConfirmDelete(false);
            } else {
                setError('Failed to delete label');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Render a single label row
    const renderLabelRow = (label: GmailLabel, isSystem: boolean = false) => {
        const isEditing = editingLabelId === label.id;
        const isDeleting = deletingLabelId === label.id && confirmDelete;

        // Get the label color
        const color = getLabelColor(label);

        return (
            <div
                key={label.id}
                className="flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50"
            >
                <div className="flex items-center">
                    <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={color ? {
                            backgroundColor: color.background,
                            borderColor: color.text
                        } : { backgroundColor: '#dddddd' }}
                    ></div>

                    {isEditing ? (
                        <input
                            type="text"
                            value={editedLabelName}
                            onChange={(e) => setEditedLabelName(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                        />
                    ) : isDeleting ? (
                        <div className="flex items-center text-red-600">
                            <span className="mr-2">Delete "{label.name}"?</span>
                        </div>
                    ) : (
                        <span className="text-sm">{getDisplayLabelName(label)}</span>
                    )}
                </div>

                <div className="flex items-center">
                    {isEditing ? (
                        <>
                            <button
                                className="text-green-600 hover:text-green-800 mr-2"
                                onClick={() => handleSaveEdit(label.id)}
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                className="text-gray-600 hover:text-gray-800"
                                onClick={handleCancelEdit}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : isDeleting ? (
                        <>
                            <button
                                className="text-red-600 hover:text-red-800 mr-2"
                                onClick={() => handleDeleteLabel(label.id)}
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                className="text-gray-600 hover:text-gray-800"
                                onClick={handleCancelDelete}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            {!isSystem && (
                                <>
                                    <button
                                        className="text-gray-600 hover:text-blue-600 mr-2"
                                        onClick={() => handleStartEdit(label)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="text-gray-600 hover:text-red-600"
                                        onClick={() => handleConfirmDelete(label.id)}
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h1 className="text-xl font-semibold">Manage Labels</h1>
                <button
                    className="flex items-center text-blue-600 hover:text-blue-800"
                    onClick={() => setShowNewLabelForm(true)}
                    disabled={showNewLabelForm}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>New Label</span>
                </button>
            </div>

            {/* Create new label form */}
            {showNewLabelForm && (
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-blue-600" />
                        <input
                            type="text"
                            placeholder="New label name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                        />
                        <button
                            className="ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            onClick={handleCreateLabel}
                            disabled={creatingLabel || !newLabelName.trim()}
                        >
                            {creatingLabel ? 'Creating...' : 'Create'}
                        </button>
                        <button
                            className="ml-2 px-3 py-2 text-gray-600 hover:text-gray-800"
                            onClick={() => setShowNewLabelForm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="p-3 bg-red-50 border-b border-red-100 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && !labels.length ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-200 mb-2"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {/* System Labels Section */}
                    <div className="pt-2">
                        <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-600">
                            System Labels
                        </div>
                        {systemLabels.map(label => renderLabelRow(label, true))}
                    </div>

                    {/* Custom Labels Section */}
                    <div className="pt-4">
                        <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-600">
                            Custom Labels
                        </div>
                        {customLabels.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500">
                                <Tag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No custom labels yet</p>
                                <button
                                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                    onClick={() => setShowNewLabelForm(true)}
                                >
                                    Create your first label
                                </button>
                            </div>
                        ) : (
                            customLabels.map(label => renderLabelRow(label))
                        )}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                <p>Labels help you organize your emails. You can apply labels to emails to categorize them.</p>
                <p className="mt-1">System labels cannot be edited or deleted.</p>
            </div>
        </div>
    );
};

export default LabelManager;