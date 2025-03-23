import React, { useEffect, useRef, useState } from "react";
import ImageEditor from "tui-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";
import { FiArrowLeft, FiSave, FiX, FiCheck } from "react-icons/fi";
import { UploadedFile, useFileHandling } from "../hooks/useFileHandling";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";

interface ImageViewerProps {
  file: UploadedFile;
  onBack: () => void;
  onImageUpdated: () => void;
  onSelectOtherFile?: (fileName: string) => void;
}

export const ImageViewer = ({
  file,
  onBack,
  onImageUpdated,
  onSelectOtherFile
}: ImageViewerProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const { writeFile } = useFileHandling();
  const [newFileName, setNewFileName] = useState(file.name);
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetFileName, setTargetFileName] = useState<string | null>(null);

  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isUnsavedDialogOpen,
    openUnsavedDialog,
    closeUnsavedDialog,
    pendingOperation,
    setPendingOperation
  } = useUnsavedChanges();

  // Add animation keyframes
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // ✅ Initialize editor with unsaved tracking only after image load
  useEffect(() => {
    if (editorRef.current) {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }

      const instance = new ImageEditor(editorRef.current, {
        includeUI: {
          loadImage: {
            path: file.data,
            name: file.name
          },
          menu: ["crop", "flip", "rotate", "draw", "shape", "icon", "text", "filter"],
          initMenu: "text",
          theme: { "header.display": "none" } as any,
          uiSize: {
            width: "100%",
            height: "100%"
          },
          menuBarPosition: "bottom"
        },
        cssMaxWidth: 1200,
        cssMaxHeight: 800,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70
        }
      });

      instanceRef.current = instance;

      // ✅ Track readiness before setting unsaved state
      let editorReady = false;
      instance.on("loadImage", () => {
        editorReady = true;
      });

      instance.on("undoStackChanged", () => {
        if (editorReady) {
          setHasUnsavedChanges(true);
        }
      });

      return () => {
        if (instanceRef.current) {
          instanceRef.current.destroy();
          instanceRef.current = null;
        }
        const svgDefs = document.getElementById("tui-image-editor-svg-default-icons");
        if (svgDefs?.parentElement) {
          svgDefs.parentElement.removeChild(svgDefs);
        }
      };
    }
  }, [file.data, file.name, setHasUnsavedChanges]);

  // Reset file name and clear unsaved flag
  useEffect(() => {
    setNewFileName(file.name);
    setHasUnsavedChanges(false);
  }, [file.name, setHasUnsavedChanges]);

  // Handle file switching
  useEffect(() => {
    const handleFileSelectionChange = (fileName: string) => {
      if (hasUnsavedChanges) {
        setTargetFileName(fileName);
        setPendingOperation(() => {
          return () => {
            if (onSelectOtherFile) {
              onSelectOtherFile(fileName);
            }
          };
        });
        openUnsavedDialog();
        return false;
      }
      return true;
    };

    if (typeof window !== "undefined") {
      // @ts-ignore
      window.handleFileSelectionChange = handleFileSelectionChange;
    }

    return () => {
      if (typeof window !== "undefined") {
        // @ts-ignore
        delete window.handleFileSelectionChange;
      }
    };
  }, [hasUnsavedChanges, openUnsavedDialog, setPendingOperation, onSelectOtherFile]);

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
        data: dataUrl
      };

      await writeFile(updatedFile);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setHasUnsavedChanges(false);
      onImageUpdated();

      if (pendingOperation) {
        pendingOperation();
        setPendingOperation(null);
      }

      closeUnsavedDialog();
    } catch (err) {
      console.error("Error saving image:", err);
      alert("Failed to save image. Please try again.");
    }
  };

  const handleBackWithCheck = () => {
    if (hasUnsavedChanges) {
      setPendingOperation(() => onBack);
      openUnsavedDialog();
    } else {
      onBack();
    }
  };

  const handleDiscard = () => {
    setHasUnsavedChanges(false);
    closeUnsavedDialog();

    if (pendingOperation) {
      pendingOperation();
      setPendingOperation(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-100 p-4">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 bg-white p-3 rounded-lg shadow">
        <div className="flex items-center">
          <button
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={handleBackWithCheck}
          >
            ← Back
          </button>
          <span className="font-semibold text-lg text-gray-800 truncate max-w-[300px] ml-4">
            {file.name}
          </span>

          {showSuccess && (
            <div
              className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
              style={{ animation: "fadeIn 0.3s ease-in-out forwards" }}
            >
              <FiCheck className="text-green-500" />
              <span>Image saved successfully!</span>
            </div>
          )}
        </div>

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
        </div>
      </div>

      <div className="flex-grow flex justify-center items-center bg-white rounded-lg shadow p-2 overflow-hidden">
        <div
          ref={editorRef}
          className="w-[90%] h-[80vh] max-w-[1200px] max-h-[800px] flex justify-center items-center overflow-hidden"
        />
      </div>

      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onSave={() => handleSave(false)}
        onDiscard={handleDiscard}
        onCancel={closeUnsavedDialog}
        fileName={file.name}
        targetFileName={targetFileName}
      />
    </div>
  );
};
