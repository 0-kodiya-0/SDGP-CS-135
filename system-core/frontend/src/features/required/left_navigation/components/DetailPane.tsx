import { useState } from "react";
import SummaryView from "../../../default/files/components/SummaryView";
import DetailView from "../../../default/files/components/DetailView";
import CreateFile from "../../../default/files/components/CreateFile";
import { FiUpload, FiPlus, FiX } from "react-icons/fi";
import { Environment } from '../../../default/environment/types/types.data';

interface DetailPaneProps {
  environment: Environment;
  className?: string;
  refreshTrigger: number;
  onFileChange: () => void;
  onFileSelect: (fileName: string | null) => void;
}

export function DetailPane({
  environment,
  className,
  refreshTrigger,
  onFileChange,
  onFileSelect
}: DetailPaneProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${className}`}>
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center px-4 justify-between bg-gray-50 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">File Summary</h1>

        <div className="flex space-x-2">
          {/* Upload Button */}
          <button
            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-all"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <FiUpload className="w-5 h-5" />
            <span>Upload</span>
          </button>

          {/* Create File Button */}
          <button
            className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-md transition-all"
            onClick={() => setIsCreateFileOpen(true)}
          >
            <FiPlus className="w-5 h-5" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* File Summary View */}
      <div className="flex-1 overflow-y-auto p-4 w-full custom-scrollbar">
        <SummaryView
          refreshTrigger={refreshTrigger}
          onFileChange={onFileChange}
          onFileSelect={onFileSelect}
        />
      </div>

      {/* Upload Modal with Proper Transparent Background */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/30 backdrop-blur-lg z-50">
          <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-md relative">
            {/* Close Button */}
            <button className="absolute top-3 right-4 text-gray-500 hover:text-red-500" onClick={() => setIsUploadModalOpen(false)}>
              <FiX className="w-6 h-6" />
            </button>

            {/* Detail View (Upload Component Inside) */}
            <DetailView
              selectedFile={null}
              onFileUploaded={() => {
                setIsUploadModalOpen(false);
                onFileChange();
              }}
              onBack={() => setIsUploadModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Create File Modal with Correct Background */}
      {isCreateFileOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/30 backdrop-blur-lg z-50">
          <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-md relative">
            {/* Close Button */}
            <button className="absolute top-3 right-4 text-gray-500 hover:text-red-500" onClick={() => setIsCreateFileOpen(false)}>
              <FiX className="w-6 h-6" />
            </button>

            {/* Create File Component */}
            <CreateFile
              onFileCreated={() => {
                setIsCreateFileOpen(false);
                onFileChange();
              }}
              onCancel={() => setIsCreateFileOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}