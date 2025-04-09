import { useEffect, useRef, useState } from "react";
import ImageEditor from "tui-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";
import { FiSave, FiCheck } from "react-icons/fi";
import { UploadedFile, useFileHandling } from "../hooks/useFileHandling";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { DriveFile } from "../types/types.google.api";
import { useDriveFiles } from "../hooks/useDriveFiles.google";

interface ImageViewerProps {
  file: UploadedFile | DriveFile;
  onImageUpdated: () => void;
  onSelectOtherFile: (fileName: string) => void;
  accountId?: string;
}

export const ImageViewer = ({
  file,
  onImageUpdated,
  onSelectOtherFile,
  accountId = ''
}: ImageViewerProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const { writeFile, refreshFiles } = useFileHandling();
  const [newFileName, setNewFileName] = useState(file.name);
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetFileName, setTargetFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isSaveAsDialogOpen, setIsSaveAsDialogOpen] = useState(false);
  const { getDownloadUrl } = useDriveFiles(accountId);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isUnsavedDialogOpen,
    openUnsavedDialog,
    closeUnsavedDialog,
    pendingOperation,
    setPendingOperation
  } = useUnsavedChanges();

  // Inject animation keyframes (and extra CSS if needed)
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

  // Use MutationObserver to hide the unwanted SVG
  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const svgDefs = document.getElementById("tui-image-editor-svg-default-icons");
          if (svgDefs) {
            const svgElement = svgDefs.closest("svg");
            if (svgElement) {
              svgElement.style.display = "none";
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, []);

  // Initialize editor with unsaved tracking only after image load
  useEffect(() => {
    if (editorRef.current) {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }

      // Only initialize ToastUI for local files
      if ('data' in file) {
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

        // Track readiness before setting unsaved state
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
        };
      }
    }
  }, [file.data, file.name, setHasUnsavedChanges]);

  // Reset file name and clear unsaved flag when file changes
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

  useEffect(() => {
    if ('data' in file) {
      // Local file
      setImageUrl(file.data);
    } else {
      // Google Drive file - use authenticated download URL
      setImageUrl(getDownloadUrl(file.id));
    }
  }, [file, getDownloadUrl]);

  const handleSave = async (saveAsNew: boolean = false) => {
    const instance = instanceRef.current;
    if (!instance) return;

    try {
      const dataUrl = instance.toDataURL();
      let nameToSave = file.name;

      if (saveAsNew) {
        setIsSaveAsDialogOpen(true);
        return;
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
      setErrorMessage("Failed to save image. Please try again.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleSaveAsConfirm = async () => {
    if (!newFileName) {
      setErrorMessage("Please enter a file name");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    
    const instance = instanceRef.current;
    if (!instance) return;

    try {
      const dataUrl = instance.toDataURL();
      const updatedFile: UploadedFile = {
        name: newFileName,
        type: "image/png",
        data: dataUrl
      };

      await writeFile(updatedFile);
      await refreshFiles();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setHasUnsavedChanges(false);
      setIsSaveAsDialogOpen(false);
      
      onImageUpdated();
      
      if (pendingOperation) {
        setTimeout(() => {
          pendingOperation();
          setPendingOperation(null);
        }, 100);
      }

      onSelectOtherFile(newFileName);
    } catch (err) {
      console.error("Error saving image:", err);
      setErrorMessage("Failed to save image. Please try again.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
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

  // For Google Drive files, show simple preview
  if (!('data' in file)) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-3 bg-white shadow flex items-center justify-between">
          <span className="ml-4 font-semibold">{file.name}</span>
          <div className="flex gap-2">
            <a
              href={`https://drive.google.com/file/d/${file.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 mr-2"
            >
              Open in Drive
            </a>
            <a
              href={getDownloadUrl(file.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              Download
            </a>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center p-4 bg-gray-100">
          <img
            src={imageUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error("Error loading image:", e);
            }}
          />
        </div>
      </div>
    );
  }

  // For local files, show ToastUI editor
  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 bg-white shadow flex items-center justify-between">
        <span className="ml-4 font-semibold">{file.name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(true)}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            <FiCheck size={16} />
            Save As
          </button>
        </div>
      </div>
      <div className="flex-grow relative">
        <div ref={editorRef} className="w-full h-full" />
      </div>
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fadeIn">
          Image saved successfully!
        </div>
      )}
      {showError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg animate-fadeIn">
          {errorMessage}
        </div>
      )}
      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onSave={() => handleSave(true)}
        onDiscard={handleDiscard}
        onCancel={closeUnsavedDialog}
        fileName={file.name}
        targetFileName={targetFileName}
      />
      {isSaveAsDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Save As</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter file name"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSaveAsDialogOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
