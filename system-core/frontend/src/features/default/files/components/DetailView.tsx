import { useEffect, useState } from "react";
import { FilePreview } from "./FilePreview";
import UploadComponent from "./UploadComponent";
import { useFileHandling } from "../hooks/useFileHandling";

interface DetailViewProps {
  selectedFile: string | null;
  onFileUploaded: () => void;
  onBack: () => void;
}

export default function DetailView({ selectedFile, onFileUploaded, onBack }: DetailViewProps) {
  const { readFile, isLoading } = useFileHandling();
  const [fileData, setFileData] = useState<Awaited<ReturnType<typeof readFile>>>(null);

  useEffect(() => {
    if (selectedFile) {
      loadSelectedFile(selectedFile);
    } else {
      setFileData(null);
    }
  }, [selectedFile]);

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
          onBack={onBack}
          onFileUpdated={handleFileUpdated}
          onSelectFile={loadSelectedFile}
        />
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <UploadComponent onFileUploaded={onFileUploaded} />
        </div>
      )}
    </div>
  );
}
