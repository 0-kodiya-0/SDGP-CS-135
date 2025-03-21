import { useState, useEffect } from "react";
import localForage from "localforage";
import { FilePreview } from "./FilePreview";
import UploadComponent from "./UploadComponent";

interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

interface DetailViewProps {
  selectedFile: string | null;
  onFileUploaded: () => void;
  onBack: () => void;
}

export default function DetailView({ selectedFile, onFileUploaded, onBack }: DetailViewProps) {
  const [fileData, setFileData] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    localForage.config({
      name: "FusionSpaceFileStorage",
      storeName: "uploadedFiles",
    });
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadSelectedFile(selectedFile);
    } else {
      setFileData(null);
    }
  }, [selectedFile]);

  const loadSelectedFile = async (fileName: string) => {
    try {
      setIsLoading(true);
      setFileData(null);

      // Small delay to prevent UI flicker
      await new Promise(resolve => setTimeout(resolve, 50));

      const storedFile = await localForage.getItem<UploadedFile>(fileName);
      setFileData(storedFile);
    } catch (err) {
      console.error("Error loading file:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpdated = () => {
    onFileUploaded();
  };

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50">
      {isLoading ? (
        // Loading indicator
        <div className="w-full h-full flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
            <div className="text-gray-500">Loading file...</div>
          </div>
        </div>
      ) : selectedFile && fileData ? (
        // File preview when a file is selected
        <FilePreview
          file={fileData}
          onBack={onBack}
          onFileUpdated={handleFileUpdated}
        />
      ) : (
        // Upload component when no file is selected
        <div className="w-full h-full flex justify-center items-center">
          <UploadComponent onFileUploaded={onFileUploaded} />
        </div>
      )}
    </div>
  );
}