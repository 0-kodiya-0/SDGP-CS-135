import { useState, useEffect } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Navigation } from "../../features/required/left_navigation";
import { Loader2 } from "lucide-react";
import { Environment } from "../../features/default/environment/types/types.data";
import { TabView } from "../../features/required/tab_view";


interface HeaderProps {
    environment: Environment | null;
    isLoading?: boolean;
    accountId: string; // Added accountId prop
}

export const Header = ({ environment, isLoading = false, accountId }: HeaderProps) => {

    // Add an effect to log when Header re-renders with a new environment
    useEffect(() => {
        console.log('[Header] Rendering with environment:', environment ? `${environment.id} (${environment.name})` : 'None');
    }, [environment]);

    if (isLoading) {
        return (
            <div className="w-full h-full flex justify-center items-center overflow-hidden">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Creating default environment...</p>
                </div>
            </div>
        );
    }

    if (!environment) {
        return (
            <div className="w-full h-full flex justify-center items-center overflow-hidden">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    // return (
    //     <div className="w-full h-full overflow-hidden">
    //         <PanelGroup direction="horizontal" className="w-full h-full">
    //             {/* Left Navigation Panel */}
    //             <Navigation
    //                 environment={environment}
    //                 summaryBarClassName="w-[65px] h-full"
    //                 detailPaneClassName="min-w-64 h-full overflow-hidden"
    //             />

    //             <PanelResizeHandle className="w-[1px] bg-gray-100 hover:bg-blue-500 transition-colors cursor-col-resize" />

    //             <Panel defaultSize={20} minSize={10} className="h-full">
    //                 <DetailPane
    //                     environment={environment}
    //                     refreshTrigger={refreshTrigger}
    //                     onFileChange={handleRefresh}
    //                     onFileSelect={handleFileSelect}
    //                 />
    //             </Panel>

    //             <PanelResizeHandle className="w-[1px] bg-gray-100 hover:bg-blue-500 transition-colors cursor-col-resize" />

    //             <Panel defaultSize={70} minSize={30} className="h-full">
    //                 <DetailView
    //                     selectedFile={selectedFile}
    //                     onFileUploaded={handleRefresh}
    //                     onBack={() => setSelectedFile(null)}
    //                 />
    //             </Panel>
    //         </PanelGroup>
    //     </div>
    // );

    return (

        <div className="w-full h-full overflow-hidden">
                <PanelGroup direction="horizontal" className="w-full h-full">
                    {/* Navigation Panel - Fixed Width */}
                    <Navigation
                        environment={environment}
                        summaryBarClassName="w-[65px] h-full"
                        detailPaneClassName="min-w-64 h-full overflow-hidden" accountId={accountId} />

                    {/* Resize Handle */}
                    <PanelResizeHandle className="w-[1px] bg-gray-100 hover:bg-blue-500 transition-colors cursor-col-resize" />

                    {/* Detail Pane - Expand/Collapse with Limits */}
                    <Panel defaultSize={80} minSize={10} className="h-full">
                        {/* {selectedContact ? <ExpandView accountId={accountId}
                        selectedContact={selectedContact} /> : <></>} */}
                        <TabView />
                    </Panel>
                </PanelGroup>
        </div>

    );
};
