import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Navigation } from "../../features/required/left_navigation";
import { TabView } from "../../features/required/tab_view";
import { Loader2 } from "lucide-react";
import { Environment } from "../../features/default/environment/types/types.data";
import { useEffect } from "react";

interface HeaderProps {
    environment: Environment | null;
    isLoading?: boolean;
}

export const Header = ({ environment, isLoading = false }: HeaderProps) => {
    // Add an effect to log when Header re-renders with a new environment
    useEffect(() => {
        console.log('[Header] Rendering with environment:', environment ? `${environment.id} (${environment.name})` : 'None');
    }, [environment]);

    if (isLoading) {
        console.log('[Header] Environment is initializing, showing loading state');
        return <div className="w-full h-full flex justify-center items-center overflow-hidden">
            <div className="flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Creating default environment...</p>
            </div>
        </div>
    }

    if (!environment) {
        console.log('[Header] No environment available, showing loading state');
        return <div className="w-full h-full flex justify-center items-center overflow-hidden">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
    }

    return (
        <div className="w-full h-full overflow-hidden">
            <PanelGroup direction="horizontal" className="w-full h-full">
                {/* Navigation Panel - Fixed Width */}
                <Navigation environment={environment} summaryBarClassName="w-[65px] h-full" detailPaneClassName="min-w-64 h-full overflow-hidden" />

                {/* Resize Handle */}
                <PanelResizeHandle className="w-[1px] bg-gray-100 hover:bg-blue-500 transition-colors cursor-col-resize" />

                {/* Detail Pane - Expand/Collapse with Limits */}
                <Panel defaultSize={80} minSize={10} className="h-full">
                    <TabView environment={environment} className="w-full h-full overflow-auto" />
                </Panel>
            </PanelGroup>
        </div>
    );
}