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
  const { writeFile } = useFileHandling();
  const [newFileName, setNewFileName] = useState(file.name);
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetFileName, setTargetFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const { getDownloadUrl } = useDriveFiles(accountId);

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
        // Do not remove the SVG element, so TUI can reuse it.
      };
    }
  }, [file.data, file.name]);

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

  const handleDiscard = () => {
    setHasUnsavedChanges(false);
    closeUnsavedDialog();

    if (pendingOperation) {
      pendingOperation();
      setPendingOperation(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 bg-white shadow flex items-center justify-between">
        <span className="ml-4 font-semibold">{file.name}</span>
        {'id' in file && (
          <a
            href={getDownloadUrl(file.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            Download
          </a>
        )}
      </div>
      <div className="flex-grow flex items-center justify-center p-4 bg-gray-100">
        <img
          src={imageUrl}
          alt={file.name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            console.error("Error loading image:", e);
            // You might want to show an error message here
          }}
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
