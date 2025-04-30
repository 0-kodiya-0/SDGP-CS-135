import { useState, useEffect } from "react";
import { UploadedFile } from "../hooks/useFileHandling";
import { DriveFile } from "../types/types.google.api";
import { useDriveFiles } from "../hooks/useDriveFiles.google";

// This component supports viewing PDF files from both local storage and Google Drive
interface PDFViewerProps {
  file: UploadedFile | DriveFile; // Can be either a local file or a Google Drive file
}

export const PDFViewer = ({ file }: PDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // Stores the final URL for iframe
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const { getDownloadUrl } = useDriveFiles(''); // Hook to get Google Drive download URL

  // useEffect handles loading and converting file to a proper URL
  useEffect(() => {
    let url: string | null = null;
    setIsLoading(true);

    if ('data' in file) {
      // Handling local uploaded PDF files (Convert base64 to blob URL)
      try {
        if (file.data.startsWith("data:application/pdf;base64,")) {
          // Strip base64 part and decode
          const base64Data = file.data.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteArray = new Uint8Array(byteCharacters.length);

          // Convert binary characters to byte array
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "application/pdf" });
          url = URL.createObjectURL(blob);
        } else {
          // If it's not base64, use it directly (already a usable URL)
          url = file.data;
        }

        setPdfUrl(url); // Set the URL to be shown in iframe
      } catch (error) {
        console.error("Error processing PDF:", error);
        setPdfUrl(null);
      } finally {
        setIsLoading(false); // Stop loading spinner
      }
    } else {
      // Google Drive PDF file (direct URL)
      url = getDownloadUrl(file.id);
      setPdfUrl(url);
      setIsLoading(false);
    }

    // Clean up blob URL to free memory when component unmounts or file changes
    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
              <div className="text-gray-500">Loading PDF...</div>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title={file.name}
            style={{ border: "none" }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 text-red-500 p-4 rounded-lg shadow">
              <p className="font-medium">Error loading PDF.</p>
              <p className="text-sm">The file may be corrupted or in an unsupported format.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
