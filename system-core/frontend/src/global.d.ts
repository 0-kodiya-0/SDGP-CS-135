interface Window {
    handleFileSelectionChange?: (fileName: string) => boolean;
    pendingTabCreation?: () => void;
}