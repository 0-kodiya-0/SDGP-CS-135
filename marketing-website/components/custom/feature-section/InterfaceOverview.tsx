import React from 'react';
import { Menu, MoreVertical, Search, Settings, ArrowDown, ArrowRight } from 'lucide-react';
import { FeatureSection } from './FeatureSection';

export const InterfaceOverview: React.FC = () => {
    return (
        <FeatureSection
            title="Unified Interface for All Your Needs"
            description="FusionSpace brings together all your tools, communications, and files in one cohesive interface. Navigate seamlessly between different aspects of your work without switching applications."
        >
            <div className="h-96 overflow-hidden relative">
                <div className="flex flex-col h-full bg-card">
                    {/* Top navigation bar */}
                    <nav className="h-12 border-b border-border flex items-center bg-card">
                        <div className="w-16 flex items-center justify-center flex-shrink-0">
                            <button className="p-1.5 hover:bg-muted rounded">
                                <Menu className="w-5 h-5 text-foreground" />
                            </button>
                        </div>

                        <div className="w-64 border-x border-border flex items-center h-full">
                            <div className="flex items-center h-full w-full">
                                <button className="flex-1 h-full px-4 flex items-center hover:bg-muted/50">
                                    <span className="text-sm font-medium truncate text-foreground">Default Environment</span>
                                </button>
                                <div className="h-full border-l border-border">
                                    <button className="h-full w-10 flex items-center justify-center hover:bg-muted/50">
                                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-end px-4 space-x-2">
                            <div className="relative max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="w-64 pl-8 pr-4 py-1.5 text-sm bg-muted border border-input rounded-md"
                                />
                                <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2" />
                            </div>

                            <button className="p-1.5 hover:bg-muted rounded">
                                <Settings className="w-5 h-5 text-foreground" />
                            </button>
                        </div>
                    </nav>

                    {/* Main content area with horizontal navigation */}
                    <div className="w-full flex-1 flex">
                        {/* Left summary column */}
                        <div className="w-16 h-full border-r border-border"></div>

                        {/* Workspace detail column */}
                        <div className="h-full w-64 border-r border-border"></div>

                        {/* Main content area with sidebar */}
                        <div className="h-full flex-1 flex flex-col">
                            {/* Tab bar */}
                            <div className="flex border-b border-border flex-shrink-0 bg-card"></div>

                            {/* Content and sidebar container */}
                            <div className="flex-grow flex">
                                {/* Tab content area */}
                                <div className="flex-grow overflow-auto p-4 bg-card"></div>

                                {/* Right shortcuts sidebar */}
                                <div className="w-14 border-l border-border"></div>
                            </div>
                        </div>
                    </div>

                    {/* Labels with arrows for UI explanation */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-blue-accent text-primary-foreground px-3 py-1 rounded shadow-lg text-sm font-medium">
                        Navigation & Search
                        <ArrowDown className="w-4 h-4 ml-1 inline-block" />
                    </div>

                    <div className="absolute top-1/2 left-8 transform -translate-y-1/2 bg-blue-accent text-primary-foreground px-3 py-1 rounded shadow-lg text-sm font-medium">
                        Workspace <br />Selection
                        <ArrowRight className="w-4 h-4 ml-1 inline-block" />
                    </div>

                    <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 bg-blue-accent text-primary-foreground px-3 py-1 rounded shadow-lg text-sm font-medium">
                        Feature <br />Navigation
                        <ArrowRight className="w-4 h-4 ml-1 inline-block" />
                    </div>

                    <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 bg-blue-accent text-primary-foreground px-3 py-1 rounded shadow-lg text-sm font-medium">
                        Content <br />Area
                    </div>
                </div>
            </div>
        </FeatureSection>
    );
};