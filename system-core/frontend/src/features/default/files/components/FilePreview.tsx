import { ImageViewer } from "./ImageViewer";
import { PDFViewer } from "./PDFViewer";
import { TextEditor } from "./TextEditor";
import { CodeEditor } from "./CodeEditor";
import { UploadedFile } from "../hooks/useFileHandling";

interface FilePreviewProps {
  file: UploadedFile;
  onBack: () => void;
  onFileUpdated: () => void;
}

const codeFileExtensions = [
  "js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "cs",
  "html", "css", "json", "xml", "sql", "sh", "go", "php",
  "rb", "rs", "swift", "kt", "yaml", "toml", "ini", "dockerfile"
];

export const FilePreview = ({ file, onBack, onFileUpdated }: FilePreviewProps) => {
  const isCodeFile = codeFileExtensions.some(ext =>
    file.name.toLowerCase().endsWith(`.${ext}`)
  );
  const isPlainText = file.type === "text/plain" && !isCodeFile;

  if (file.type.startsWith("image/")) {
    return <ImageViewer file={file} onBack={onBack} onImageUpdated={onFileUpdated} />;
  }

  if (file.type === "application/pdf") {
    return <PDFViewer file={file} onBack={onBack} />;
  }

  if (isPlainText) {
    return <TextEditor file={file} onBack={onBack} onFileUpdated={onFileUpdated} />;
  }

  if (isCodeFile) {
    return <CodeEditor file={file} onBack={onBack} onFileUpdated={onFileUpdated} />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 bg-white shadow flex items-center">
        <button onClick={onBack} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          ← Back
        </button>
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
