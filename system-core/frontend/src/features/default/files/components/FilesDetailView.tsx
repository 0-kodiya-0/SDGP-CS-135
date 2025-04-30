import { useEffect, useState } from "react";
import { FilePreview } from "./FilePreview";
import UploadComponent from "./UploadComponent";
import { useFileHandling } from "../hooks/useFileHandling";
import { DriveFile } from "../types/types.google.api";

interface DetailViewProps {
  selectedFile: string | DriveFile | null;
  onFileUploaded: () => void;
  isGoogleDrive?: boolean;
  accountId?: string;
}

export default function DetailView({ selectedFile, onFileUploaded, isGoogleDrive, accountId }: DetailViewProps) {
  const { readFile, isLoading } = useFileHandling();
  const [fileData, setFileData] = useState<Awaited<ReturnType<typeof readFile>> | DriveFile | null>(null);

  useEffect(() => {
    if (selectedFile) {
      if (isGoogleDrive && typeof selectedFile !== 'string') {
        setFileData(selectedFile);
      } else if (typeof selectedFile === 'string') {
        loadSelectedFile(selectedFile);
      }
    } else {
      setFileData(null);
    }
  }, [selectedFile, isGoogleDrive]);

  const loadSelectedFile = async (fileName: string) => {
    try {
      setFileData(null);
      await new Promise(resolve => setTimeout(resolve, 50)); // Delay to prevent flicker
      const file = await readFile(fileName);
      setFileData(file);
    } catch (err) {
      console.error("Error loading file:", err);
    }
  };

  const handleFileUpdated = () => {
    onFileUploaded();
  };

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50">
      {isLoading ? (
        <div className="w-full h-full flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
            <div className="text-gray-500">Loading file...</div>
          </div>
        </div>
      ) : selectedFile && fileData ? (
        <FilePreview
          file={fileData}
          onFileUpdated={handleFileUpdated}
          onSelectFile={loadSelectedFile}
          isGoogleDrive={isGoogleDrive}
          accountId={accountId}
        />
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <UploadComponent 
            onFileUploaded={onFileUploaded} 
            onClose={() => {}} 
          />
        </div>
      )}
    </div>
  );
}