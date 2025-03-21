import { useEffect, useRef, useState } from "react";
import ImageEditor from "tui-image-editor";
import localForage from "localforage";
import "tui-image-editor/dist/tui-image-editor.css";
import { FiArrowLeft, FiEdit, FiSave, FiX } from "react-icons/fi";

interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

interface ImageViewerProps {
  file: UploadedFile;
  onBack: () => void;
  onImageUpdated: () => void;
}

export const ImageViewer = ({ file, onBack, onImageUpdated }: ImageViewerProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newFileName, setNewFileName] = useState(file.name);

  // Setup Image Editor when editing mode is enabled
  useEffect(() => {
    if (isEditing && editorRef.current) {
      // Ensure any previous instance is destroyed
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }

      // Create new instance
      const instance = new ImageEditor(editorRef.current, {
        includeUI: {
          loadImage: {
            path: file.data,
            name: file.name,
          },
          theme: {
            "header.display": "none",
          } as any,
          menu: ["crop", "flip", "rotate", "draw", "shape", "icon", "text", "filter"],
          initMenu: "filter",
          uiSize: {
            width: "100%",
            height: "100%",
          },
          menuBarPosition: "bottom",
        },
        cssMaxWidth: 1200,
        cssMaxHeight: 800,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70,
        },
      });

      instanceRef.current = instance;

      // Cleanup function
      return () => {
        if (instanceRef.current) {
          instanceRef.current.destroy();
          instanceRef.current = null;
        }
      };
    }
  }, [isEditing, file.data, file.name]);

  // Handle saving the edited image
  const handleSave = async (saveAsNew: boolean) => {
    const instance = instanceRef.current;
    if (!instance) return;

    try {
      const dataUrl = instance.toDataURL();

      // Validate the new filename has an extension
      let nameToSave = saveAsNew ? newFileName : file.name;
      if (saveAsNew && !nameToSave.includes('.')) {
        nameToSave += '.png'; // Add default extension if missing
      }

      const updatedFile: UploadedFile = {
        name: nameToSave,
        type: "image/png",
        data: dataUrl,
      };

      await localForage.setItem(nameToSave, updatedFile);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsEditing(false);
        onImageUpdated();
      }, 1500);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save the image. Please try again.");
    }
  };

  // Reset new filename when file changes
  useEffect(() => {
    setNewFileName(file.name);
  }, [file.name]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          ✅ Image saved successfully!
        </div>
      )}

      {/* Header with buttons */}
      <div className="bg-white shadow p-3 flex flex-wrap justify-between items-center gap-2">
        <button
          className="px-3 py-2 flex items-center gap-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={onBack}
        >
          <FiArrowLeft /> Back
        </button>

        <span className="font-semibold text-lg text-gray-800 truncate max-w-[150px] md:max-w-[250px]">
          {file.name}
        </span>

        {isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              className="border px-3 py-2 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New name..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <button
              className="px-3 py-2 flex items-center gap-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              onClick={() => handleSave(false)}
              disabled={!instanceRef.current}
            >
              <FiSave /> Save
            </button>
            <button
              className="px-3 py-2 flex items-center gap-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              onClick={() => handleSave(true)}
              disabled={!instanceRef.current || !newFileName.trim()}
            >
              <FiSave /> Save As
            </button>
            <button
              className="px-3 py-2 flex items-center gap-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              onClick={() => setIsEditing(false)}
            >
              <FiX /> Cancel
            </button>
          </div>
        ) : (
          <button
            className="px-3 py-2 flex items-center gap-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <FiEdit /> Edit
          </button>
        )}
      </div>

      {/* Image Viewer or Editor - calculate height accounting for header */}
      <div className="h-[calc(100%-56px)] w-full overflow-hidden">
        {!isEditing ? (
          <div className="h-full w-full flex justify-center items-center bg-gray-100 p-2">
            <img
              src={file.data}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            className="w-full h-full"
            style={{ contain: 'strict' }}
          />
        )}
      </div>
    </div>
  );
};