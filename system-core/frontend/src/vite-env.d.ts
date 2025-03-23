/// <reference types="vite/client" />

interface Window {
    handleFileSelectionChange?: (fileName: string) => boolean;
    pendingTabCreation?: () => void;
}