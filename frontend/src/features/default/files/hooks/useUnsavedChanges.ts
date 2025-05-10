import { useState, useEffect, useCallback } from 'react';

interface UseUnsavedChangesResult {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  isUnsavedDialogOpen: boolean;
  openUnsavedDialog: () => void;
  closeUnsavedDialog: () => void;
  pendingOperation: (() => void) | null;
  setPendingOperation: (operation: (() => void) | null) => void;
}

export function useUnsavedChanges(): UseUnsavedChangesResult {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState<boolean>(false);
  const [pendingOperation, setPendingOperation] = useState<(() => void) | null>(null);

  // Handle browser beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Standard browser behavior to show a confirmation dialog
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const openUnsavedDialog = useCallback(() => {
    if (hasUnsavedChanges) {
      setIsUnsavedDialogOpen(true);
    }
  }, [hasUnsavedChanges]);

  const closeUnsavedDialog = useCallback(() => {
    setIsUnsavedDialogOpen(false);
  }, []);

  return {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isUnsavedDialogOpen,
    openUnsavedDialog,
    closeUnsavedDialog,
    pendingOperation,
    setPendingOperation
  };
}