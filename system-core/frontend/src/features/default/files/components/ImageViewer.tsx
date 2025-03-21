import React, { useEffect, useRef, useState } from "react";
import ImageEditor from "tui-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";
import { FiArrowLeft, FiEdit, FiSave, FiX } from "react-icons/fi";
import { UploadedFile, useFileHandling } from "../hooks/useFileHandling";

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
  const { writeFile } = useFileHandling();

  useEffect(() => {
    if (isEditing && editorRef.current) {
      // Cleanup any existing instance
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }

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
          initMenu: "text",
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

      return () => {
        if (instanceRef.current) {
          instanceRef.current.destroy();
          instanceRef.current = null;
        }

        // ✅ Remove global SVG injected by TUI Image Editor
        const svgDefs = document.getElementById("tui-image-editor-svg-default-icons");
        if (svgDefs?.parentElement) {
          svgDefs.parentElement.removeChild(svgDefs);
        }
      };
    }
  }, [isEditing, file.data, file.name]);

  const handleSave = async (saveAsNew: boolean) => {
    const instance = instanceRef.current;
    if (!instance) return;

    try {
      const dataUrl = instance.toDataURL();
      let nameToSave = saveAsNew ? newFileName : file.name;

      if (saveAsNew && !nameToSave.includes(".")) {
        nameToSave += ".png";
      }

      const updatedFile: UploadedFile = {
        name: nameToSave,
        type: "image/png",
        data: dataUrl,
      };

      await writeFile(updatedFile);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsEditing(false);
        onImageUpdated();
      }, 1000);
    } catch (err) {
      console.error("Error saving image:", err);
      alert("Failed to save image. Please try again.");
    }
  };

  useEffect(() => {
    setNewFileName(file.name);
  }, [file.name]);

  return (
    <div className="flex flex-col w-full h-full bg-gray-100 p-4">
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          ✅ Image saved successfully!
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 bg-white p-3 rounded-lg shadow">
        <button
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={onBack}
        >
          ← Back
        </button>

        <span className="font-semibold text-lg text-gray-800 truncate max-w-[300px]">
          {file.name}
        </span>

        {isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              className="border px-3 py-2 rounded-lg max-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New image name..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <button
              className="px-3 py-2 flex items-center gap-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={() => handleSave(false)}
            >
              <FiSave /> Save
            </button>
            <button
              className="px-3 py-2 flex items-center gap-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              onClick={() => handleSave(true)}
            >
              <FiSave /> Save As
            </button>
            <button
              className="px-3 py-2 flex items-center gap-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={() => setIsEditing(false)}
            >
              <FiX /> Cancel
            </button>
          </div>
        ) : (
          <button
            className="px-3 py-2 flex items-center gap-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            onClick={() => setIsEditing(true)}
          >
            <FiEdit /> Edit
          </button>
        )}
      </div>

      <div className="flex-grow flex justify-center items-center bg-white rounded-lg shadow p-2 overflow-hidden">
        {!isEditing ? (
          <img
            src={file.data}
            alt={file.name}
            className="w-[90%] max-w-[1000px] max-h-[80vh] object-contain rounded"
          />
        ) : (
          <div
            ref={editorRef}
            className="w-[90%] h-[80vh] max-w-[1200px] max-h-[800px] flex justify-center items-center overflow-hidden"
          />
        )}
      </div>
    </div>
  );
};
