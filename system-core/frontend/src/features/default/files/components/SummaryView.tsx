import { useEffect, useState } from "react";
import {
  FiRefreshCw,
  FiDownload,
  FiTrash2,
  FiFile,
  FiImage,
  FiFileText,
  FiCode,
  FiUpload,
  FiPlus,
} from "react-icons/fi";
import { LucideIcon } from "lucide-react";
import SearchBar from "./SearchBar";
import { useFileHandling, UploadedFile } from "../hooks/useFileHandling";
import DetailView from "./DetailView";
import UploadComponent from "./UploadComponent";
import CreateFile from "./CreateFile";
import { useTabs } from "../../../required/tab_view";
import { Environment } from "../../environment";

// Ensuring SummaryView only has allowed parameters
interface SummaryViewProps {
  featureName?: string;
  icon?: LucideIcon;
  environment?: Environment;
  accountId?: string;
}

export default function SummaryView({
  featureName = "files",
}: SummaryViewProps) {
  const { files, deleteFile, isLoading, refreshFiles } = useFileHandling();
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { addTab, updateTab, closeTab, tabs, activeTabId, setActiveTab } = useTabs();

  // Using a Record<string, string> is more efficient for simple key-value storage than Map
  const [tabIdFileNameAssociations, setTabIdFileNameAssociations] = useState<Record<string, string>>({});

  // Track if upload modal is open
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    refreshFiles();
  }, [refreshTrigger, refreshFiles]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFiles(files);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFiles(
        files.filter((file) => file.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, files]);

  useEffect(() => {
    if (activeTabId && tabIdFileNameAssociations[activeTabId]) {
      setSelectedFileName(tabIdFileNameAssociations[activeTabId]);
    }
  }, [activeTabId, tabIdFileNameAssociations]);

  const handleDeleteFile = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      await deleteFile(fileName);
      if (selectedFileName === fileName) {
        setSelectedFileName(null);
        // Close the tab if it exists
        const tabId = `file-${fileName}`;
        closeTab(tabId);
      }
      handleFileChange();
    }
  };

  const handleDownload = (e: React.MouseEvent, file: UploadedFile) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileClick = (fileName: string) => {
    // Check if we already have a tab for this file
    const existingTabId = findTabIdByFileName(fileName);

    // If the tab already exists, just activate it
    if (existingTabId) {
      setActiveTab(existingTabId);
      return;
    }

    // Check for unsaved changes in any current editor
    if (window.handleFileSelectionChange && typeof window.handleFileSelectionChange === "function") {
      // Instead of passing the onSelectOtherFile callback that affects the current tab,
      // we'll handle the tab creation directly in SummaryView
      const canProceed = window.handleFileSelectionChange(fileName);
      if (!canProceed) {
        // Store this function to be called after save/discard is handled
        window.pendingTabCreation = () => {
          createNewFileTab(fileName);
        };
        return;
      }
    }

    createNewFileTab(fileName);
  };

  // Helper function to find tab ID by filename
  const findTabIdByFileName = (fileName: string): string | undefined => {
    for (const [tabId, fname] of Object.entries(tabIdFileNameAssociations)) {
      if (fname === fileName) {
        return tabId;
      }
    }
    return undefined;
  };

  // Helper function to create a new file tab
  const createNewFileTab = (fileName: string) => {
    setSelectedFileName(fileName);

    // Add the file to a tab
    const tabId = addTab(fileName, (
      <DetailView
        selectedFile={fileName}
        onFileUploaded={handleFileChange}
      />
    ));

    // Update the associations
    setTabIdFileNameAssociations(prev => ({
      ...prev,
      [tabId]: fileName
    }));

    return tabId;
  };

  const handleFileChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const getFileIcon = (file: UploadedFile) => {
    if (file.type.startsWith("image/")) {
      return <FiImage className="text-purple-500" />;
    } else if (file.type === "application/pdf") {
      return <FiFileText className="text-red-500" />;
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      return <FiFileText className="text-blue-500" />;
    } else if (
      file.name.endsWith(".js") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".py") ||
      file.name.endsWith(".java") ||
      file.name.endsWith(".html") ||
      file.name.endsWith(".css") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".xml") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".tsx")
    ) {
      return <FiCode className="text-green-500" />;
    } else {
      return <FiFile className="text-gray-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-3 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">{featureName}</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshFiles}
              className="text-gray-600 hover:text-blue-600 transition-colors p-1"
              title="Refresh file list"
            >
              <FiRefreshCw className={isLoading ? "animate-spin" : ""} size={18} />
            </button>
            <button
              onClick={handleOpenUploadModal}
              className="text-gray-600 hover:text-blue-600 transition-colors p-1"
              title="Upload File"
            >
              <FiUpload size={18} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="text-gray-600 hover:text-blue-600 transition-colors p-1"
              title="Create File"
            >
              <FiPlus size={18} />
            </button>
          </div>
        </div>

        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      {/* File List */}
      <div className="flex-grow overflow-y-auto bg-gray-50 p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-sm text-gray-500">Loading files...</span>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            {files.length === 0
              ? "No files uploaded yet."
              : "No files match your search."}
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredFiles.map((file) => (
              <li
                key={file.name}
                onClick={() => handleFileClick(file.name)}
                className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${selectedFileName === file.name
                  ? "bg-blue-100 border-l-4 border-blue-500"
                  : "bg-white"
                  }`}
              >
                <div className="flex-shrink-0 mr-2">{getFileIcon(file)}</div>
                <div className="flex-grow truncate font-medium text-sm text-gray-800">
                  {file.name}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => handleDownload(e, file)}
                    className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                    title="Download file"
                  >
                    <FiDownload size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteFile(e, file.name)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete file"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Render modals at the root level for proper overlay */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50">
          <UploadComponent
            onFileUploaded={() => {
              handleFileChange();
              setIsUploadModalOpen(false);
            }}
          />
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50">
          <CreateFile
            onFileCreated={() => {
              handleFileChange();
              setIsCreateModalOpen(false);
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}