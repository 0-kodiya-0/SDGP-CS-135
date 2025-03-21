import React, { useState, useEffect, lazy, Suspense } from "react";
import { FiEdit, FiSave, FiX } from "react-icons/fi";
import "react-quill/dist/quill.snow.css";
import { UploadedFile, useFileHandling } from "../hooks/useFileHandling";

// ✅ Lazy-load ReactQuill to prevent "findDOMNode" warning
const ReactQuill = lazy(() => import("react-quill"));

interface TextEditorProps {
  file: UploadedFile;
  onBack: () => void;
  onFileUpdated: () => void; // ✅ Callback to refresh file list
}

export const TextEditor = ({ file, onBack, onFileUpdated }: TextEditorProps) => {
  const [content, setContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newFileName, setNewFileName] = useState(file.name);
  const [showSuccess, setShowSuccess] = useState(false);
  const { writeFile } = useFileHandling(); // ✅ Centralized logic

  // Decode file content on mount
  useEffect(() => {
    try {
      const textContent = atob(file.data.split(",")[1]);
      setContent(textContent);
    } catch (err) {
      console.error("Failed to decode file content:", err);
    }
  }, [file]);

  const handleSave = async (saveAsNew: boolean) => {
    if (saveAsNew && !newFileName.trim()) {
      alert("Please enter a valid file name.");
      return;
    }

    let fileNameToSave = saveAsNew ? newFileName : file.name;
    if (!fileNameToSave.includes(".")) {
      fileNameToSave += ".txt";
    }

    const updatedFile: UploadedFile = {
      name: fileNameToSave,
      type: "text/plain",
      data: `data:text/plain;base64,${btoa(content)}`,
    };

    await writeFile(updatedFile);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsEditing(false);
      onFileUpdated(); // ✅ Refresh SummaryView
    }, 500);
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-100 p-4">
      {/* ✅ Success Toast */}
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          ✅ File saved successfully!
        </div>
      )}

      {/* ✅ Header */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow">
        <button
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={onBack}
        >
          ← Back
        </button>

        <span className="font-semibold text-lg text-gray-800 truncate max-w-[300px]">{file.name}</span>

        {!isEditing ? (
          <button
            className="px-3 py-2 flex items-center gap-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            onClick={() => setIsEditing(true)}
          >
            <FiEdit /> Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              className="px-3 py-2 flex items-center gap-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={() => handleSave(false)}
            >
              <FiSave /> Save
            </button>
            <button
              className="px-3 py-2 flex items-center gap-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={() => setIsEditing(false)}
            >
              <FiX /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* ✅ Save As (when editing) */}
      {isEditing && (
        <div className="flex items-center space-x-3 mb-4 bg-white p-3 rounded-lg shadow">
          <span className="text-gray-600 font-medium">Save As:</span>
          <input
            type="text"
            className="border px-3 py-2 rounded-lg w-full max-w-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="New file name..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button
            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            onClick={() => handleSave(true)}
            disabled={!newFileName.trim()}
          >
            Save As
          </button>
        </div>
      )}

      {/* ✅ Rich Text Editor */}
      <div className="flex-grow overflow-auto bg-white rounded-lg shadow p-2">
        <Suspense fallback={<div>Loading editor...</div>}>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            readOnly={!isEditing}
            className="h-full"
          />
        </Suspense>
      </div>
    </div>
  );
};
