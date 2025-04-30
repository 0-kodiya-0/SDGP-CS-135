import { useState } from "react";
import ReactQuill from "react-quill";
import Editor from "@monaco-editor/react";
import { FiX, FiFileText, FiCode, FiSave } from "react-icons/fi";
import "react-quill/dist/quill.snow.css";
import { useFileHandling } from "../hooks/useFileHandling";

interface CreateFileProps {
  onFileCreated: () => void;
  onCancel: () => void;
}

export default function CreateFile({ onFileCreated, onCancel }: CreateFileProps) {
  const { saveFile } = useFileHandling();
  const [fileType, setFileType] = useState<"text" | "code" | null>(null);
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [extension, setExtension] = useState("");
  const [error, setError] = useState("");

  const handleSaveFile = async () => {
    if (!filename.trim()) {
      setError("File name is required.");
      return;
    }

    let completeFileName = filename;
    if (fileType === "code") {
      if (!extension.trim()) {
        setError("File extension is required for code files.");
        return;
      }
      completeFileName += `.${extension.replace(/^\./, "")}`;
    } else {
      completeFileName += ".txt";
    }

    await saveFile(content, completeFileName);
    onFileCreated();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/40 z-50">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-4xl flex flex-col h-[90vh] border border-gray-200">
        
        {/* 🔹 Header Section */}
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-800">Create New File</h2>
          <button className="text-gray-500 hover:text-red-500 text-lg transition" onClick={onCancel}>
            <FiX />
          </button>
        </div>

        {/* 🔹 File Type Selection */}
        {!fileType && (
          <div className="flex flex-col items-center mt-4 space-y-4">
            <h3 className="text-md font-medium text-gray-700">Select File Type</h3>
            <div className="flex space-x-4">
              <button
                className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition flex items-center gap-2"
                onClick={() => setFileType("text")}
              >
                <FiFileText /> Text File
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition flex items-center gap-2"
                onClick={() => setFileType("code")}
              >
                <FiCode /> Code File
              </button>
            </div>
          </div>
        )}

        {/* 🔹 File Editor Section */}
        {fileType && (
          <>
            <div className="flex flex-col flex-grow mt-4 min-h-[300px] max-h-[75vh] overflow-hidden">
              {fileType === "text" ? (
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  className="flex-grow min-h-[300px] max-h-[75vh] border rounded-lg"
                />
              ) : (
                <div className="flex-grow min-h-[300px] max-h-[75vh]">
                  <Editor
                    height="100%"
                    language="javascript"
                    theme="vs-dark"
                    value={content}
                    onChange={(value) => setContent(value || "")}
                    options={{ automaticLayout: true }}
                  />
                </div>
              )}
            </div>

            {/* 🔹 Filename and Extension Inputs */}
            <div className="flex flex-col space-y-2 mt-4">
              <input
                type="text"
                placeholder="Enter file name..."
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
              {fileType === "code" && (
                <input
                  type="text"
                  placeholder="Enter file extension (e.g., js, ts, py)"
                  className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                />
              )}
              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            </div>

            {/* 🔹 Save Button */}
            <button
              className="mt-4 px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition shadow-lg flex items-center gap-2 justify-center"
              onClick={handleSaveFile}
            >
              <FiSave /> Save File
            </button>
          </>
        )}
      </div>
    </div>
  );
}
