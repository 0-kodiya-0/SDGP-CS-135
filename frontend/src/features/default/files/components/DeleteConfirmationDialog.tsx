import React from 'react';
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  fileName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/40 z-50">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-md border border-gray-200">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 text-red-500 mr-3">
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
            <p className="mt-2 text-gray-600">
              Are you sure you want to delete <span className="font-medium">{fileName}</span>?
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition flex items-center gap-2"
          >
            <FiX /> Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition flex items-center gap-2"
          >
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;
