import React, { useEffect, useState } from "react";
import localForage from "localforage";
import SearchBar from "./SearchBar";
import { FiRefreshCw, FiDownload, FiTrash2, FiFile, FiImage, FiFileText, FiCode } from "react-icons/fi";

interface FileData {
  name: string;
  type: string;
  data: string;
}

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
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const keys = await localForage.keys();
      const storedFiles = await Promise.all(
        keys.map(async (key) => await localForage.getItem<FileData>(key))
      );

      const validFiles = storedFiles.filter(Boolean) as FileData[];

      // Sort files by name
      validFiles.sort((a, b) => a.name.localeCompare(b.name));

      setFiles(validFiles);
      setFilteredFiles(validFiles);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  useEffect(() => {
    // Update filtered list based on search query
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
    e.stopPropagation(); // Prevent triggering file selection

    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      await localForage.removeItem(fileName);

      // If the deleted file was selected, clear selection
      if (selectedFileName === fileName) {
        setSelectedFileName(null);
        onFileSelect(null);
      }

      await loadFiles();
      onFileChange();
    }
  };

  const handleDownload = (e: React.MouseEvent, file: FileData) => {
    e.stopPropagation(); // Prevent triggering file selection

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

  // Function to get appropriate icon for file type
  const getFileIcon = (file: FileData) => {
    if (file.type.startsWith("image/")) {
      return <FiImage className="text-purple-500" />;
    } else if (file.type === "application/pdf") {
      return <FiFileText className="text-red-500" />;
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      return <FiFileText className="text-blue-500" />;
    } else if (
      file.name.endsWith(".js") ||
      file.name.endsWith(".py") ||
      file.name.endsWith(".java") ||
      file.name.endsWith(".html") ||
      file.name.endsWith(".css") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".xml") ||
      file.name.endsWith(".ts") ||
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
      {/* Fixed Header (File Summary + Search Bar + Refresh Button) */}
      <div className="bg-white p-3 border-b">
        {/* File Summary Header with Refresh Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Files</h2>
          <button
            onClick={loadFiles}
            className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 p-1"
            title="Refresh file list"
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* SearchBar Component */}
        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      {/* Scrollable File List */}
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
                className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors
                  ${selectedFileName === file.name ? "bg-blue-100 border-l-4 border-blue-500" : "bg-white"}
                `}
              >
                {/* File icon */}
                <div className="flex-shrink-0 mr-2">
                  {getFileIcon(file)}
                </div>

                {/* File name */}
                <div className="flex-grow truncate font-medium text-sm text-gray-800">
                  {file.name}
                </div>

                {/* Action buttons */}
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