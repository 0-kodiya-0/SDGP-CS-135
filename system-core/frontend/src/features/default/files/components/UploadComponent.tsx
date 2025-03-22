import React, { useState } from "react";
import {
  FiUpload,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { useFileHandling } from "../hooks/useFileHandling";

interface FileItem {
  id: string;
  file: File;
  preview: string;
}

interface UploadComponentProps {
  onFileUploaded: () => void;
}

const allowedTypes = [
  "image/png", "image/jpeg", "application/pdf", "video/mp4", "text/plain",
  "application/javascript", "text/javascript", "text/css", "application/json",
  "text/html", "text/xml", "text/x-python", "text/x-java-source",
  "text/x-c", "text/x-c++", "text/x-csharp", "application/typescript",
];

const allowedExtensions = [
  "js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "cs",
  "html", "css", "json", "xml", "sql", "sh", "go", "php",
  "txt", "md", "yml", "yaml"
];

const isAllowedExtension = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(ext || '');
};

export default function UploadComponent({ onFileUploaded }: UploadComponentProps) {
  const { uploadFiles } = useFileHandling();
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>
  ) => {
    let fileList: FileList | null = null;

    if ("dataTransfer" in event) {
      event.preventDefault();
      setDragging(false);
      fileList = event.dataTransfer.files;
    } else {
      fileList = event.target.files;
    }

    if (!fileList || fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage(`File too large: ${file.name} (max 20MB)`);
        return;
      }
    }

    const newSelectedFiles: FileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (allowedTypes.includes(file.type) || isAllowedExtension(file.name)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newSelectedFiles.push({
              id: `${Date.now()}-${i}-${file.name}`,
              file,
              preview: e.target.result as string,
            });

            if (newSelectedFiles.length === fileList!.length) {
              setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);
            }
          }
        };
        reader.readAsDataURL(file);
      } else {
        setErrorMessage(`Unsupported file type: ${file.name}`);
      }
    }
  };

  const handleFilesUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await uploadFiles(selectedFiles[i].file);
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setSelectedFiles([]);
        onFileUploaded();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage("An error occurred during upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((files) => files.filter((file) => file.id !== id));
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl h-full flex flex-col">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-1">Upload Files</h2>
      <p className="text-sm text-center text-gray-500 mb-4">
        Drag & drop or browse. Supports images, PDFs, and code files.
      </p>

      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-100"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleFileSelection}
      >
        <FiUpload className="text-blue-500 text-5xl mb-2" />
        <p className="text-sm font-medium">Drag & Drop files here</p>
        <label className="mt-2 text-blue-600 text-sm cursor-pointer hover:underline">
          Browse Files
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelection}
            accept=".js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.xml,.sql,.sh,.go,.php,.txt,.md,.yml,.yaml,.png,.jpg,.jpeg,.pdf"
          />
        </label>
      </div>

      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <FiAlertCircle className="flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="mt-4 space-y-2 overflow-y-auto flex-grow">
        {selectedFiles.length > 0 ? (
          selectedFiles.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <span
                className="text-sm font-medium truncate max-w-[240px]"
                title={fileItem.file.name}
              >
                {fileItem.file.name}
              </span>
              <button
                className="text-red-500 hover:text-red-700 p-1"
                onClick={() => removeFile(fileItem.id)}
                disabled={uploading}
                title="Remove file"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 text-sm italic py-2">
            No files selected
          </p>
        )}
      </div>

      <button
        className={`w-full mt-5 py-2.5 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          selectedFiles.length === 0 || uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={selectedFiles.length === 0 || uploading}
        onClick={handleFilesUpload}
      >
        {uploading ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading {uploadProgress}%
          </>
        ) : (
          <>
            <FiUpload />
            Upload {selectedFiles.length}{" "}
            {selectedFiles.length === 1 ? "File" : "Files"}
          </>
        )}
      </button>

      {uploading && (
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {uploadSuccess && (
        <div className="flex justify-center items-center gap-2 mt-4 bg-green-100 text-green-700 p-2 rounded-lg">
          <FiCheckCircle className="w-5 h-5" />
          <span>Upload successful!</span>
        </div>
      )}
    </div>
  );
}
