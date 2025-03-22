import { useState } from "react";
import SummaryView from "../../../default/files/components/SummaryView";
import CreateFile from "../../../default/files/components/CreateFile";
import UploadComponent from "../../../default/files/components/UploadComponent";
import { FiX } from "react-icons/fi";
import { Environment } from "../../../default/environment/types/types.data";

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
  onFileSelect,
}: DetailPaneProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${className}`}
    >
      {/* File Summary View */}
      <div className="flex-1 overflow-y-auto p-4 w-full custom-scrollbar">
        <SummaryView
          refreshTrigger={refreshTrigger}
          onFileChange={onFileChange}
          onFileSelect={onFileSelect}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenCreateModal={() => setIsCreateFileOpen(true)}
        />
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/30 backdrop-blur-lg z-50">
          <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-md relative">
            <button
              className="absolute z-10 top-3 right-4 text-gray-500 hover:text-red-500"
              onClick={() => setIsUploadModalOpen(false)}
            >
              <FiX className="w-6 h-6" />
            </button>
            <UploadComponent
              onFileUploaded={() => {
                setIsUploadModalOpen(false);
                onFileChange();
              }}
            />
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {isCreateFileOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/30 backdrop-blur-lg z-50">
          <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-red-500"
              onClick={() => setIsCreateFileOpen(false)}
            >
              <FiX className="w-6 h-6" />
            </button>

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
