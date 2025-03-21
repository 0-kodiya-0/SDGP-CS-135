import { useState, lazy, Suspense } from "react";
import "react-quill/dist/quill.snow.css";
import localForage from "localforage";
import { FiEdit, FiSave, FiX, FiArrowLeft } from "react-icons/fi";

// Lazy-load ReactQuill to prevent "findDOMNode" warning
const ReactQuill = lazy(() => import("react-quill"));

interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

interface TextEditorProps {
  file: UploadedFile;
  onBack: () => void;
  onFileUpdated: () => void;
}

export const TextEditor = ({ file, onBack, onFileUpdated }: TextEditorProps) => {
  const [content, setContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newFileName, setNewFileName] = useState(file.name);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load content when component mounts
  useState(() => {
    try {
      setIsLoading(true);
      const textContent = atob(file.data.split(",")[1]);
      setContent(textContent);
    } catch (error) {
      console.error("Error decoding file content:", error);
    } finally {
      setIsLoading(false);
    }
  });

  const handleSave = async (saveAsNew: boolean) => {
    if (saveAsNew && !newFileName.trim()) {
      alert("Please enter a valid file name.");
      return;
    }

    // Ensure text files have .txt extension if saving as new
    let fileNameToSave = saveAsNew ? newFileName : file.name;
    if (saveAsNew && !fileNameToSave.includes('.')) {
      fileNameToSave += '.txt';
    }

    const updatedFile = {
      name: fileNameToSave,
      type: "text/plain",
      data: `data:text/plain;base64,${btoa(content)}`,
    };

    await localForage.setItem(fileNameToSave, updatedFile);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setIsEditing(false);
      onFileUpdated();
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          ✅ File saved successfully!
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow p-3 flex items-center justify-between">
        <button
          className="px-3 py-2 flex items-center gap-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={onBack}
        >
          <FiArrowLeft /> Back
        </button>

        <span className="font-semibold text-lg text-gray-800 truncate max-w-[150px] md:max-w-[250px]">
          {file.name}
        </span>

        {/* Edit/Save/Cancel Buttons */}
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
              onClick={() => handleSave(false)}
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

      {/* Save As Option (Only shown while editing) */}
      {isEditing && (
        <div className="flex items-center space-x-3 p-2 bg-gray-100 border-b">
          <span className="text-gray-600 font-medium">Save As:</span>
          <input
            type="text"
            className="border px-3 py-1 rounded-lg flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="New file name..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button
            className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            onClick={() => handleSave(true)}
            disabled={!newFileName.trim()}
          >
            Save As
          </button>
        </div>
      )}

      {/* Text Editor - calculate height accounting for headers */}
      <div className={`h-[calc(100%-${isEditing ? '104px' : '56px'})] w-full`}>
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
              <div className="text-gray-500">Loading content...</div>
            </div>
          </div>
        ) : (
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center">Loading editor...</div>}>
            <div className="h-full w-full">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                readOnly={!isEditing}
                className="h-full"
                modules={{
                  toolbar: isEditing ? {
                    container: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      [{ 'color': [] }, { 'background': [] }],
                      ['clean']
                    ]
                  } : false
                }}
              />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
};