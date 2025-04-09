import { useState, useEffect } from "react";
import { UploadedFile } from "../hooks/useFileHandling";
import { DriveFile } from "../types/types.google.api";
import { useDriveFiles } from "../hooks/useDriveFiles.google";

interface PDFViewerProps {
  file: UploadedFile | DriveFile;
}

export const PDFViewer = ({ file }: PDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const { getDownloadUrl } = useDriveFiles('');

  useEffect(() => {
    if ('data' in file) {
      // Local file
      setPdfUrl(file.data);
    } else {
      // Google Drive file
      const downloadUrl = getDownloadUrl(file.id);
      setPdfUrl(downloadUrl);
    }
  }, [file, getDownloadUrl]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 bg-white shadow flex items-center justify-between">
        <span className="ml-4 font-semibold">{file.name}</span>
        {'id' in file && (
          <a
            href={getDownloadUrl(file.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            Download
          </a>
        )}
      </div>
      <div className="flex-grow flex items-center justify-center p-4 bg-gray-100">
        <iframe
          src={pdfUrl}
          className="w-full h-full"
          title={file.name}
        />
      </div>
    </div>
  );
};