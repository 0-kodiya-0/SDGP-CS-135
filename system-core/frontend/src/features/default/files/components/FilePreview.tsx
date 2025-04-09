import { useState, useEffect } from "react";
import { ImageViewer } from "./ImageViewer";
import { PDFViewer } from "./PDFViewer";
import { TextEditor } from "./TextEditor";
import { CodeEditor } from "./CodeEditor";
import { UploadedFile } from "../hooks/useFileHandling";
import { DriveFile } from "../types/types.google.api";
import { useDriveFiles } from "../hooks/useDriveFiles.google";

interface FilePreviewProps {
  file: UploadedFile | DriveFile;
  onFileUpdated: () => void;
  onSelectFile: (fileName: string) => void;
  isGoogleDrive?: boolean;
  accountId?: string;
}

const codeFileExtensions = [
  "js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "cs",
  "html", "css", "json", "xml", "sql", "sh", "go", "php",
  "rb", "rs", "swift", "kt", "yaml", "toml", "ini", "dockerfile"
];

export const FilePreview = ({ file, onFileUpdated, onSelectFile, isGoogleDrive, accountId = '' }: FilePreviewProps) => {
  const [lastSelectedFile, setLastSelectedFile] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { getDownloadUrl, getExportUrl } = useDriveFiles(accountId);

  useEffect(() => {
    if (file) {
      setLastSelectedFile(file.name);
      setPreviewError(null);
    }
  }, [file]);

  const isCodeFile = codeFileExtensions.some(ext =>
    file.name.toLowerCase().endsWith(`.${ext}`)
  );
  const isPlainText = 'type' in file && file.type === "text/plain" && !isCodeFile;

  // Common props for all editor types
  const editorProps = {
    file: file as UploadedFile,
    onFileUpdated,
    onSelectOtherFile: onSelectFile,
    lastSelectedFile
  };

  const handlePreviewError = (error: string) => {
    setPreviewError(error);
  };

  if (previewError) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-3 bg-white shadow flex items-center justify-between">
          <span className="ml-4 font-semibold">{file.name}</span>
          {isGoogleDrive && (
            <a
              href={getDownloadUrl((file as DriveFile).id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              Download
            </a>
          )}
        </div>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center p-8 bg-gray-50 rounded-lg shadow-inner">
            <p className="text-red-500 font-semibold mb-2">Error previewing file</p>
            <p className="text-gray-600">{previewError}</p>
            <p className="mt-4">Please try downloading the file instead.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isGoogleDrive) {
    const driveFile = file as DriveFile;
    
    if (driveFile?.mimeType?.startsWith("image/")) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="p-3 bg-white shadow flex items-center justify-between">
            <span className="ml-4 font-semibold">{driveFile.name}</span>
            <div className="flex gap-2">
              <a
                href={`https://drive.google.com/file/d/${driveFile.id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 mr-2"
              >
                Open in Drive
              </a>
              <a
                href={getDownloadUrl(driveFile.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Download
              </a>
            </div>
          </div>
          <div className="flex-grow flex items-center justify-center p-4 bg-gray-100">
            <img
              src={getDownloadUrl(driveFile.id)}
              alt={driveFile.name}
              className="max-w-full max-h-full object-contain"
              onError={() => handlePreviewError("Failed to load image preview. Authentication may have failed.")}
            />
          </div>
        </div>
      );
    }

    if (driveFile?.mimeType === "application/pdf") {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="p-3 bg-white shadow flex items-center justify-between">
            <span className="ml-4 font-semibold">{driveFile.name}</span>
            <a
              href={getDownloadUrl(driveFile.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              Download
            </a>
          </div>
          <div className="flex-grow flex items-center justify-center p-4">
            <iframe
              src={`https://drive.google.com/file/d/${driveFile.id}/preview`}
              onError={() => handlePreviewError("Failed to load PDF preview. Authentication may have failed.")}
              className="w-full h-full"
              title={driveFile.name}
            />
          </div>
        </div>
      );
    }

    // Handle Google Docs, Sheets, and Slides
    if (driveFile?.mimeType?.includes('document') || 
        driveFile?.mimeType?.includes('spreadsheet') || 
        driveFile?.mimeType?.includes('presentation')) {
      const exportUrl = getExportUrl(driveFile.id, driveFile.mimeType);
      return (
        <div className="w-full h-full flex flex-col">
          <div className="p-3 bg-white shadow flex items-center justify-between">
            <span className="ml-4 font-semibold">{driveFile.name}</span>
            <div className="flex gap-2">
              <a
                href={`https://drive.google.com/open?id=${driveFile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Open in Google
              </a>
              <a
                href={getDownloadUrl(driveFile.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Download
              </a>
            </div>
          </div>
          <div className="flex-grow flex items-center justify-center p-4">
            <iframe
              src={`https://docs.google.com/document/d/${driveFile.id}/preview`}
              onError={() => handlePreviewError("Failed to load Google document preview. Authentication may have failed.")}
              className="w-full h-full"
              title={driveFile.name}
            />
          </div>
        </div>
      );
    }

    // Handle text files
    if (driveFile?.mimeType?.startsWith("text/") || isCodeFile) {
      const downloadUrl = getDownloadUrl(driveFile.id);
      return (
        <div className="w-full h-full flex flex-col">
          <div className="p-3 bg-white shadow flex items-center justify-between">
            <span className="ml-4 font-semibold">{driveFile.name}</span>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              Download
            </a>
          </div>
          <div className="flex-grow flex items-center justify-center p-4">
            <iframe
              src={`https://drive.google.com/file/d/${driveFile.id}/preview`}
              onError={() => handlePreviewError("Failed to load text file preview. Authentication may have failed.")}
              className="w-full h-full"
              title={driveFile.name}
            />
          </div>
        </div>
      );
    }

    // For other file types, show download option
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-3 bg-white shadow flex items-center justify-between">
          <span className="ml-4 font-semibold">{driveFile.name}</span>
          <a
            href={getDownloadUrl(driveFile.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            Download
          </a>
        </div>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center p-8 bg-gray-50 rounded-lg shadow-inner">
            <p className="text-gray-600">
              This file type is not supported for preview. Please download it to view the contents.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle local files
  const localFile = file as UploadedFile;
  
  if (localFile?.type?.startsWith("image/")) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-3 bg-white shadow flex items-center justify-between">
          <span className="ml-4 font-semibold">{localFile.name}</span>
          {localFile.data && (
            <a
              href={localFile.data}
              download={localFile.name}
              className="text-blue-500 hover:text-blue-700"
            >
              Download
            </a>
          )}
        </div>
        <div className="flex-grow flex items-center justify-center p-4 bg-gray-100">
          <img
            src={localFile.data}
            alt={localFile.name}
            className="max-w-full max-h-full object-contain"
            onError={() => handlePreviewError("Failed to load image preview.")}
          />
        </div>
      </div>
    );
  }

  if (localFile?.type === "application/pdf") {
    return <PDFViewer file={localFile} />;
  }

  if (isPlainText) {
    return <TextEditor {...editorProps} />;
  }

  if (isCodeFile) {
    return <CodeEditor {...editorProps} />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 bg-white shadow flex items-center justify-between">
        <span className="ml-4 font-semibold">{localFile.name}</span>
        {localFile.data && (
          <a
            href={localFile.data}
            download={localFile.name}
            className="text-blue-500 hover:text-blue-700"
          >
            Download
          </a>
        )}
      </div>
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="text-center p-8 bg-gray-50 rounded-lg shadow-inner">
          <p className="text-red-500 font-semibold mb-2">
            No preview available for <strong>{localFile.name}</strong>
          </p>
          <p className="text-gray-600">This file type is not supported for preview.</p>
        </div>
      </div>
    </div>
  );
};