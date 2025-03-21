import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import localForage from "localforage";
import { FiEdit, FiSave, FiX } from "react-icons/fi";

interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

interface CodeEditorProps {
  file: UploadedFile;
  onBack: () => void;
  onFileUpdated: () => void;
}

const getLanguageFromExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case "js": return "javascript";
    case "ts": return "typescript";
    case "py": return "python";
    case "java": return "java";
    case "cpp": return "cpp";
    case "c": return "c";
    case "cs": return "csharp";
    case "html": return "html";
    case "css": return "css";
    case "json": return "json";
    case "xml": return "xml";
    case "sql": return "sql";
    case "sh": return "shell";
    default: return "plaintext";
  }
};

export const CodeEditor = ({ file, onBack, onFileUpdated }: CodeEditorProps) => {
  const [code, setCode] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (file.data.startsWith("data:")) {
      const textContent = atob(file.data.split(",")[1]); // Decode base64
      setCode(textContent);
    }
  }, [file]);

  const handleSave = async () => {
    const updatedFile = {
      name: file.name,
      type: file.type,
      data: `data:text/plain;base64,${btoa(code)}`, // Encode back to base64
    };

    await localForage.setItem(file.name, updatedFile);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsEditing(false);
      onFileUpdated(); // Trigger file list refresh
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-100">
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          ✅ Code saved successfully!
        </div>
      )}

      {/* Header with Edit/Save Buttons */}
      <div className="flex justify-between items-center p-3 bg-white shadow">
        <button
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={onBack}
        >
          ← Back
        </button>

        <span className="font-semibold text-lg text-gray-800 truncate max-w-[200px] md:max-w-[300px]">
          {file.name}
        </span>

        {!isEditing ? (
          <button
            className="px-3 py-2 flex items-center gap-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <FiEdit /> Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              className="px-3 py-2 flex items-center gap-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              onClick={handleSave}
            >
              <FiSave /> Save
            </button>
            <button
              className="px-3 py-2 flex items-center gap-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              onClick={() => setIsEditing(false)}
            >
              <FiX /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Monaco Code Editor - Note the h-[calc(100%-56px)] to account for header height */}
      <div className="h-[calc(100%-56px)] w-full overflow-hidden">
        <Editor
          height="100%"
          width="100%"
          language={getLanguageFromExtension(file.name)}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly: !isEditing,
          }}
        />
      </div>
    </div>
  );
};