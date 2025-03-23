import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FiSave, FiCheck } from 'react-icons/fi';
import { UploadedFile, useFileHandling } from '../hooks/useFileHandling';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useTabs } from '../../../required/tab_view';

interface CodeEditorProps {
  file: UploadedFile;
  onFileUpdated: () => void;
  onSelectOtherFile?: (fileName: string) => void;
}
export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onFileUpdated, onSelectOtherFile }) => {
  const { writeFile } = useFileHandling();
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [targetFileName, setTargetFileName] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>(file.name);
  const [isSaveAsMode, setIsSaveAsMode] = useState<boolean>(false);
  const { updateTab, closeTab, addTab, activeTabId } = useTabs();

  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isUnsavedDialogOpen,
    openUnsavedDialog,
    closeUnsavedDialog,
    pendingOperation,
    setPendingOperation
  } = useUnsavedChanges();

  // Load file content when file changes
  useEffect(() => {
    const loadFileContent = async () => {
      try {
        const base64Content = file.data.split(',')[1];
        const decodedContent = atob(base64Content);
        setContent(decodedContent);
        setOriginalContent(decodedContent); // ✅ Ensure original content is reset
        setHasUnsavedChanges(false);

        // Detect programming language from file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'js': setLanguage('javascript'); break;
          case 'ts': setLanguage('typescript'); break;
          case 'jsx': case 'tsx': setLanguage('typescriptreact'); break;
          case 'py': setLanguage('python'); break;
          case 'java': setLanguage('java'); break;
          case 'html': setLanguage('html'); break;
          case 'css': setLanguage('css'); break;
          case 'json': setLanguage('json'); break;
          case 'cpp': setLanguage('cpp'); break;
          case 'c': setLanguage('c'); break;
          case 'cs': setLanguage('csharp'); break;
          case 'php': setLanguage('php'); break;
          case 'go': setLanguage('go'); break;
          case 'xml': setLanguage('xml'); break;
          case 'sql': setLanguage('sql'); break;
          default: setLanguage('plaintext');
        }
      } catch (error) {
        console.error('Error loading file content:', error);
      }
    };

    loadFileContent();
  }, [file, setHasUnsavedChanges]);

  useEffect(() => {
    const handleFileSelectionChange = (fileName: string) => {
      if (hasUnsavedChanges) {
        setTargetFileName(fileName);
        // We no longer set a pendingOperation here since tab creation
        // will be handled by the SummaryView component after save/discard
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
  }, [hasUnsavedChanges, openUnsavedDialog]);

  const handleContentChange = (value: string | undefined) => {
    setContent(value || '');
    setHasUnsavedChanges(value !== originalContent);
  };

  const handleSave = async () => {
    try {
      const fileType = file.type || 'text/plain';
      let dataUrl = `data:${fileType};base64,${btoa(content)}`;
      let fileToSave = { ...file, data: dataUrl };
      let fileNameToSave = file.name;

      // Handle "Save As" if active
      if (isSaveAsMode && newFileName !== file.name) {
        fileNameToSave = newFileName;
        fileToSave = { ...fileToSave, name: fileNameToSave };
      }

      await writeFile(fileToSave);

      setOriginalContent(content); // Update original content after saving
      setHasUnsavedChanges(false);

      // Show success message
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      // If we did a "Save As" with a new filename, update the tab
      if (isSaveAsMode && fileNameToSave !== file.name) {
        const currentTabId = activeTabId;

        if (currentTabId) {
          // Update the tab title to the new filename
          updateTab(currentTabId, { title: fileNameToSave });

          // Update the parent to reflect changes
          onFileUpdated();

          // Load the new file
          if (onSelectOtherFile) {
            onSelectOtherFile(fileNameToSave);
          }
        }

        // Reset save as mode
        setIsSaveAsMode(false);
      } else {
        // Standard save - just update normally
        onFileUpdated();
      }

      // Check for pending tab creation (for when we're saving before switching to a new file)
      if (window.pendingTabCreation && typeof window.pendingTabCreation === "function") {
        window.pendingTabCreation();
        delete window.pendingTabCreation;
      }
      // Execute other pending operations if exists
      else if (pendingOperation) {
        pendingOperation();
        setPendingOperation(null);
      }

      closeUnsavedDialog();
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleDiscard = () => {
    setContent(originalContent); // Restore original content
    setHasUnsavedChanges(false);
    closeUnsavedDialog();

    // Execute pending tab creation if exists
    if (window.pendingTabCreation && typeof window.pendingTabCreation === "function") {
      window.pendingTabCreation();
      delete window.pendingTabCreation;
    }
    // Execute other pending operations if exists
    else if (pendingOperation) {
      pendingOperation();
      setPendingOperation(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="p-3 bg-white shadow flex items-center justify-between">
        <div className="flex items-center">
          <span className="ml-4 font-semibold truncate">{file.name}</span>
          {/* Success message */}
          {showSaveSuccess && (
            <div
              className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
            >
              <FiCheck className="text-green-500" />
              <span>File saved successfully!</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSaveAsMode && (
            <input
              type="text"
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New file name..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
          )}
          <button
            onClick={() => setIsSaveAsMode(!isSaveAsMode)}
            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            {isSaveAsMode ? 'Cancel' : 'Save As'}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges && !isSaveAsMode}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${(hasUnsavedChanges || isSaveAsMode)
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } transition-colors`}
          >
            <FiSave /> Save
          </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className="flex-grow overflow-hidden bg-gray-100">
        <div className="h-full bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <Editor
            height="calc(100vh - 120px)" // Prevents extending into footer
            language={language}
            theme="vs-dark"
            value={content}
            onChange={handleContentChange}
            options={{
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
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