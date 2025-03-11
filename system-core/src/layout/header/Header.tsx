import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Navigation } from "../../features/required/left_navigation";
import { TabView } from "../../features/required/tab_view";
import { Loader2 } from "lucide-react";
import { Environment } from "../../features/default/environment/types/data";

interface HeaderProps {
    environment: Environment | null;
}

export const Header = ({ environment }: HeaderProps) => {

    if (!environment) {
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