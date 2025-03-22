export interface Tab {
    id: string;
    title: string;
    content: React.ReactNode;
}

export interface TabContextType {
    tabs: Tab[];
    activeTabId: string | null;
    addTab: (title: string, content: React.ReactNode) => string;
    updateTab: (tabId: string, updates: Partial<Omit<Tab, 'id'>>) => void;
    closeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
}