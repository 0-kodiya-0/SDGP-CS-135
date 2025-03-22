import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FiSave, FiChevronLeft, FiCheck } from 'react-icons/fi';
import { UploadedFile, useFileHandling } from '../hooks/useFileHandling';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

interface CodeEditorProps {
  file: UploadedFile;
  onBack: () => void;
  onFileUpdated: () => void;
  onSelectOtherFile?: (fileName: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onBack, onFileUpdated, onSelectOtherFile }) => {
  const { writeFile } = useFileHandling();
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
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

  // Handle file switching with unsaved changes prompt
  useEffect(() => {
    const handleFileSelectionChange = (fileName: string) => {
      if (hasUnsavedChanges) {
        setTargetFileName(fileName);
        setPendingOperation(() => () => {
          if (onSelectOtherFile) {
            onSelectOtherFile(fileName);
          }
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

  const handleContentChange = (value: string | undefined) => {
    setContent(value || '');
    setHasUnsavedChanges(value !== originalContent);
  };

  const handleSave = async () => {
    try {
      const fileType = file.type || 'text/plain';
      const dataUrl = `data:${fileType};base64,${btoa(content)}`;
      await writeFile({ ...file, data: dataUrl });
      
      setOriginalContent(content); // ✅ Update original content after saving
      setHasUnsavedChanges(false);
      onFileUpdated();
      
      // Show success message
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      
      // Execute pending operation if exists
      if (pendingOperation) {
        pendingOperation();
        setPendingOperation(null);
      }
      
      closeUnsavedDialog();
    } catch (error) {
      console.error('Error saving file:', error);
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
    setContent(originalContent); // ✅ Restore original content
    setHasUnsavedChanges(false);
    closeUnsavedDialog();

    // Execute pending operation if exists
    if (pendingOperation) {
      pendingOperation();
      setPendingOperation(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="p-3 bg-white shadow flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={handleBackWithCheck}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1 transition-colors"
          >
            <FiChevronLeft /> Back
          </button>
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
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            hasUnsavedChanges 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          } transition-colors`}
        >
          <FiSave /> Save
        </button>
      </div>

      {/* Editor Section */}
      <div className="flex-grow overflow-hidden bg-gray-100">
        <div className="h-full bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <Editor
            height="calc(100vh - 120px)" // ✅ Prevents extending into footer
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
