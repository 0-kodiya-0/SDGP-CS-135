import React from 'react';
import { Layout } from 'lucide-react';
import { FeatureSection } from './FeatureSection';

export const CustomizableInterface: React.FC = () => {
    return (
        <FeatureSection
            title="Personalize Your Workspace"
            description="Make FusionSpace truly yours by customizing the interface to match your workflow. Drag and drop components, resize panels, and arrange tools exactly how you need them."
            reversed={true}
        >
            <div className="h-96 bg-card p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-muted/50"></div>

                {/* Customization overlay */}
                <div className="relative z-10 h-full">
                    <div className="border-2 border-dashed border-blue-accent rounded-lg h-full flex items-center justify-center">
                        <div className="text-center p-6 bg-card rounded-lg shadow-md">
                            <Layout className="w-8 h-8 text-blue-accent mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2 text-foreground">Drag & Drop Interface</h3>
                            <p className="text-muted-foreground mb-4">Rearrange components to build your ideal workspace</p>

                            <div className="flex flex-wrap gap-3 justify-center">
                                <div className="px-3 py-1.5 bg-blue-accent/20 border border-blue-accent/30 rounded text-blue-accent text-sm">Files Panel</div>
                                <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded text-green-500 dark:text-green-400 text-sm">Chat Window</div>
                                <div className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-500 dark:text-purple-400 text-sm">Task Board</div>
                                <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-500 dark:text-amber-400 text-sm">Calendar</div>
                                <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded text-red-500 dark:text-red-400 text-sm">Notes</div>
                                <div className="px-3 py-1.5 bg-muted border border-border rounded text-muted-foreground text-sm">+ Add Component</div>
                            </div>
                        </div>
                    </div>

                    {/* Resize handles */}
                    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 h-16 w-1.5 bg-blue-accent rounded cursor-ew-resize"></div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-blue-accent rounded cursor-ns-resize"></div>
                    <div className="absolute bottom-4 right-4 w-3 h-3 bg-blue-accent rounded cursor-nwse-resize"></div>
                </div>
            </div>
        </FeatureSection>
    );
};