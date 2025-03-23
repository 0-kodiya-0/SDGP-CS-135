import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiSave } from 'react-icons/fi';
import { UploadedFile, useFileHandling } from '../hooks/useFileHandling';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

interface TextEditorProps {
  file: UploadedFile;
  onFileUpdated: () => void;
  onSelectOtherFile?: (fileName: string) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  file,
  onFileUpdated,
  onSelectOtherFile
}) => {
  const { writeFile } = useFileHandling();
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [targetFileName, setTargetFileName] = useState<string | null>(null);
  const [hasLoadedContent, setHasLoadedContent] = useState<boolean>(false); // Important fix

  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isUnsavedDialogOpen,
    openUnsavedDialog,
    closeUnsavedDialog,
    pendingOperation,
    setPendingOperation
  } = useUnsavedChanges();

  useEffect(() => {
    const loadFileContent = async () => {
      try {
        const base64Content = file.data.split(',')[1];
        const decodedContent = atob(base64Content);
        setHasLoadedContent(false); // Prevent false detection on initial load
        setContent(decodedContent);
        setOriginalContent(decodedContent);
        setHasUnsavedChanges(false);
        setTimeout(() => setHasLoadedContent(true), 0); // Enable detection after mount
      } catch (error) {
        console.error('Error loading file content:', error);
      }
    };

    loadFileContent();
  }, [file, setHasUnsavedChanges]);

  // Handle switching files with unsaved changes
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

    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.handleFileSelectionChange = handleFileSelectionChange;
    }

    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.handleFileSelectionChange;
      }
    };
  }, [hasUnsavedChanges, openUnsavedDialog, setPendingOperation, onSelectOtherFile]);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (hasLoadedContent) {
      setHasUnsavedChanges(value !== originalContent);
    }
  };

  const handleSave = async () => {
    try {
      const fileType = file.type || 'text/plain';
      const dataUrl = `data:${fileType};base64,${btoa(content)}`;

      await writeFile({
        ...file,
        data: dataUrl
      });

      setOriginalContent(content);
      setHasUnsavedChanges(false);
      onFileUpdated();

      if (pendingOperation) {
        pendingOperation();
        setPendingOperation(null);
      }

      closeUnsavedDialog();
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleDiscard = () => {
    setContent(originalContent);
    setHasUnsavedChanges(false);
    closeUnsavedDialog();

    if (pendingOperation) {
      pendingOperation();
      setPendingOperation(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-3 bg-white shadow flex items-center justify-between">
        <div className="flex items-center">
          <span className="ml-4 font-semibold">{file.name}</span>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${hasUnsavedChanges
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } transition-colors`}
        >
          <FiSave /> Save
        </button>
      </div>

      {/* Editor Section */}
      <div className="flex-grow bg-gray-50 overflow-hidden">
        <div className="h-full bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden pb-10">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            className="h-full"
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ color: [] }, { background: [] }],
                ['clean']
              ]
            }}
          />
        </div>
      </div>

      {/* Custom Quill Styles */}
      <style>
        {`
          .ql-container {
            height: 100%;
            border: none;
            display: flex;
            flex-direction: column;
          }

          .ql-editor {
            flex-grow: 1;
            overflow-y: auto;
            padding-bottom: 3rem;
          }
        `}
      </style>

      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onCancel={closeUnsavedDialog}
        fileName={file.name}
        targetFileName={targetFileName}
      />
    </div>
  );
};