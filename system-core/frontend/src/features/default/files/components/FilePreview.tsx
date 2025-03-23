import { useState, useEffect } from "react";
import { ImageViewer } from "./ImageViewer";
import { PDFViewer } from "./PDFViewer";
import { TextEditor } from "./TextEditor";
import { CodeEditor } from "./CodeEditor";
import { UploadedFile } from "../hooks/useFileHandling";

interface FilePreviewProps {
  file: UploadedFile;
  onFileUpdated: () => void;
  onSelectFile: (fileName: string) => void;
}

const codeFileExtensions = [
  "js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "cs",
  "html", "css", "json", "xml", "sql", "sh", "go", "php",
  "rb", "rs", "swift", "kt", "yaml", "toml", "ini", "dockerfile"
];

export const FilePreview = ({ file, onFileUpdated, onSelectFile }: FilePreviewProps) => {
  const [lastSelectedFile, setLastSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    // Keep track of the currently opened file
    if (file) {
      setLastSelectedFile(file.name);
    }
  }, [file]);

  const isCodeFile = codeFileExtensions.some(ext =>
    file.name.toLowerCase().endsWith(`.${ext}`)
  );
  const isPlainText = file.type === "text/plain" && !isCodeFile;

  // Common props for all editor types
  const editorProps = {
    file,
    onFileUpdated,
    onSelectOtherFile: onSelectFile,
    lastSelectedFile
  };

  if (file.type.startsWith("image/")) {
    return <ImageViewer file={file} onImageUpdated={onFileUpdated} onSelectOtherFile={onSelectFile} />;
  }

  if (file.type === "application/pdf") {
    return <PDFViewer file={file} />;
  }

  if (isPlainText) {
    return <TextEditor {...editorProps} />;
  }

  if (isCodeFile) {
    return <CodeEditor {...editorProps} />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 bg-white shadow flex items-center">
        <span className="ml-4 font-semibold">{file.name}</span>
      </div>
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="text-center p-8 bg-gray-50 rounded-lg shadow-inner">
          <p className="text-red-500 font-semibold mb-2">
            No preview available for <strong>{file.name}</strong>
          </p>
          <p className="text-gray-600">This file type is not supported for preview.</p>
        </div>
      </div>
    </div>
  );
};