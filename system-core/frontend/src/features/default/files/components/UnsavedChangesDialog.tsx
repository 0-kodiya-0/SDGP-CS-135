import React from 'react';
import { FiAlertTriangle, FiSave, FiX } from 'react-icons/fi';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  fileName: string;
  targetFileName?: string | null;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  fileName,
  targetFileName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/40 z-50">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-md border border-gray-200">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 text-amber-500 mr-3">
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Unsaved Changes</h3>
            <p className="mt-2 text-gray-600">
              You have unsaved changes in <span className="font-medium">{fileName}</span>.
              {targetFileName && (
                <> Do you want to save your changes before opening <span className="font-medium">{targetFileName}</span>?</>
              )}
              {!targetFileName && (
                <> What would you like to do?</>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition flex items-center gap-2"
            onClick={onCancel}
          >
            <FiX /> Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition flex items-center gap-2"
            onClick={onDiscard}
          >
            Discard Changes
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition flex items-center gap-2"
            onClick={onSave}
          >
            <FiSave /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesDialog;