import { useEffect, useState } from "react";

interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

interface PDFViewerProps {
  file: UploadedFile;
}

export const PDFViewer = ({ file }: PDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let url: string | null = null;

    const createBlobUrl = () => {
      try {
        setIsLoading(true);
        if (file.data.startsWith("data:application/pdf;base64,")) {
          const base64Data = file.data.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "application/pdf" });
          url = URL.createObjectURL(blob);
        } else {
          url = file.data;
        }
        setPdfUrl(url);
      } catch (error) {
        console.error("Error processing PDF:", error);
        setPdfUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    createBlobUrl();

    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file.data]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="bg-white shadow p-3 flex items-center">
        <div className="flex-grow">
          <span className="font-semibold text-lg text-gray-800 truncate max-w-sm inline-block" title={file.name}>
            {file.name}
          </span>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="h-[calc(100%-56px)] w-full bg-gray-100">
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
            style={{ border: "none" }}
            title={`PDF: ${file.name}`}
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