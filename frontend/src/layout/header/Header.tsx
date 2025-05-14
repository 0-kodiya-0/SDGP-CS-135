import { useCallback, useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Navigation } from "../../features/required/left_navigation";
import { Loader2 } from "lucide-react";
import { Environment } from "../../features/default/environment/types/types.data";
import { TreeView } from "../../features/required/tree_view";
import { useTreeStore } from "../../features/required/tree_view";
import { useAccount } from "../../features/default/user_account";
import { TreeNode } from "../../features/required/tree_view/types/types.data";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ChatProvider } from "../../features/default/chat";

interface HeaderProps {
    environment: Environment | null;
    isLoading?: boolean;
}

export const Header = ({ environment, isLoading = false }: HeaderProps) => {
    const { currentAccount } = useAccount();
    const { removeItem, getTreeStructure } = useTreeStore();
    const [tree, setTree] = useState<TreeNode | null>(getTreeStructure());
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const handleSelectGroup = useCallback((id: string) => {
        setSelectedGroupId(id);
    }, []);

    const handleRemoveItem = useCallback((itemId: string) => {
        removeItem(itemId);
    }, [removeItem]);

    // Update tree when store changes
    useEffect(() => {
        const unsubscribe = useTreeStore.subscribe((state) => {
            setTree(state.getTreeStructure());
        });
        return unsubscribe;
    }, []);

    // Add an effect to log when Header re-renders with a new environment
    useEffect(() => {
        console.log('[Header] Rendering with environment:', environment ? `${environment.id} (${environment.name})` : 'None');
    }, [environment]);

    if (isLoading) {
        return (
            <div key="header-loading" className="w-full h-full flex justify-center items-center overflow-hidden">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Creating default environment...</p>
                </div>
            </div>
        );
    }

    if (!environment) {
        return (
            <div key="header-no-env" className="w-full h-full flex justify-center items-center overflow-hidden">
                <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
                <p className="text-sm text-gray-500">Loading environment...</p>
            </div>
        );
    }

    if (!currentAccount) {
        return (
            <div key="header-no-env" className="w-full h-full flex justify-center items-center overflow-hidden">
                <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
                <p className="text-sm text-gray-500">Loading account...</p>
            </div>
        );
    }

    return (
        <div key={`header-${environment.id}`} className="w-full h-full overflow-hidden">
            <ChatProvider accountId={currentAccount.id}>
                <PanelGroup direction="horizontal" className="w-full h-full">
                    {/* Navigation Panel - Fixed Width */}
                    <Navigation
                        key={`nav-${environment.id}`}
                        environment={environment}
                        summaryBarClassName="w-[65px] h-full"
                        detailPaneClassName="min-w-64 h-full overflow-hidden"
                    />

                    {/* Resize Handle */}
                    <PanelResizeHandle key={`resize-${environment.id}`} className="w-[1px] bg-gray-100 hover:bg-blue-500 transition-colors cursor-col-resize" />

                    {/* TreeView Panel - Replace TabView with TreeView */}
                    <Panel defaultSize={80} minSize={10} className="h-full">
                        <DndProvider backend={HTML5Backend}>
                            <TreeView
                                key={`tree-${currentAccount.id}`}
                                tree={tree}
                                selectedGroupId={selectedGroupId}
                                onSelectGroup={handleSelectGroup}
                                onRemoveItem={handleRemoveItem}
                                accountId={currentAccount.id}
                            />
                        </DndProvider>
                    </Panel>
                </PanelGroup>
            </ChatProvider>
        </div>
    );
};