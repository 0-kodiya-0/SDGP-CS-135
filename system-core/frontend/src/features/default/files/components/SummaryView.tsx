import { useEffect, useState } from "react";
import { FiRefreshCw, FiDownload, FiTrash2, FiFile, FiImage, FiFileText, FiCode } from "react-icons/fi";
import SearchBar from "./SearchBar";
import { useFileHandling, UploadedFile } from "../hooks/useFileHandling";

interface SummaryViewProps {
  refreshTrigger: number;
  onFileChange: () => void;
  onFileSelect: (fileName: string | null) => void;
}

export default function SummaryView({
  refreshTrigger,
  onFileChange,
  onFileSelect,
}: SummaryViewProps) {
  const {
    files,
    deleteFile,
    isLoading,
    refreshFiles,
  } = useFileHandling();

  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    refreshFiles();
  }, [refreshTrigger, refreshFiles]);

  useEffect(() => {
    console.log("File information", files.length, files)
  }, [files]);

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

  const handleDeleteFile = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      await deleteFile(fileName);
      if (selectedFileName === fileName) {
        setSelectedFileName(null);
        onFileSelect(null);
      }
      onFileChange();
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
    setSelectedFileName(fileName);
    onFileSelect(fileName);
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
          <h2 className="text-lg font-semibold text-gray-800">Files</h2>
          <button
            onClick={refreshFiles}
            className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 p-1"
            title="Refresh file list"
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
          </button>
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
            {files.length === 0 ? "No files uploaded yet." : "No files match your search."}
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredFiles.map((file) => (
              <li
                key={file.name}
                onClick={() => handleFileClick(file.name)}
                className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${selectedFileName === file.name ? "bg-blue-100 border-l-4 border-blue-500" : "bg-white"
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
    </div>
  );
}
