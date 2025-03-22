import React, { useState } from "react";
import { FiUpload, FiTrash2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
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
    <div className="max-w-lg mx-auto p-4 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Upload Files</h2>
      <p className="text-sm text-gray-500 mb-4 text-center">
        Drag & Drop or Browse. Supports images, PDFs, and code files.
      </p>

      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleFileSelection}
      >
        <FiUpload className="text-blue-500 text-4xl mb-2" />
        <span className="text-sm font-medium text-center">Drag & Drop files here</span>
        <label className="mt-2 text-blue-600 cursor-pointer hover:underline">
          Browse Files
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelection}
            accept=".js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.xml,.sql,.sh,.go,.php,.txt,.md,.yml,.yaml"
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
              className="flex items-center justify-between p-2 bg-gray-100 rounded-lg shadow"
            >
              <span
                className="text-sm font-medium truncate max-w-[220px]"
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
        className={`w-full mt-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
          selectedFiles.length === 0 || uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={selectedFiles.length === 0 || uploading}
        onClick={handleFilesUpload}
      >
        {uploading ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Uploading {uploadProgress}%
          </>
        ) : (
          <>
            <FiUpload /> Upload {selectedFiles.length}{" "}
            {selectedFiles.length === 1 ? "File" : "Files"}
          </>
        )}
      </button>

      {uploading && (
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
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
