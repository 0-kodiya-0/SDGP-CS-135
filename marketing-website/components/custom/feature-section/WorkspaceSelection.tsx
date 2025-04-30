import React from 'react';
import {
    Plus,
    ChevronRight,
    ChevronDown,
    Users,
    MoreVertical,
    FileText,
    CheckSquare,
    MessageSquare
} from 'lucide-react';
import { FeatureSection } from './FeatureSection';

export const WorkspaceSelection: React.FC = () => {
    return (
        <FeatureSection
            title="Organize Projects with Dedicated Workspaces"
            description="Create and switch between different workspaces to keep your projects organized. Each workspace can have its own set of tools, files, and team members."
        >
            <div className="flex h-96 border-t border-l border-r border-border bg-card">
                {/* Left workspace selector column */}
                <div className="w-16 border-r border-border py-4 flex-shrink-0 bg-card">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col items-center gap-y-2 px-2">
                            <button className="relative w-full aspect-square rounded-lg flex items-center justify-center bg-muted/80 shadow-sm" title="Development Workspace">
                                <span className="text-sm font-medium text-foreground">D</span>
                            </button>

                            <button className="relative w-full aspect-square rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80" title="Research Workspace">
                                <span className="text-sm font-medium text-foreground">R</span>
                            </button>

                            <button className="relative w-full aspect-square rounded-lg flex items-center justify-center hover:bg-muted" title="Add Workspace">
                                <Plus className="w-5 h-5 text-foreground" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Workspace detail column */}
                <div className="w-64 border-r border-border flex flex-col bg-card">
                    {/* Workspace header */}
                    <div className="h-12 border-b border-border flex items-center px-4 justify-between">
                        <div className="transition-opacity duration-300">
                            <span className="text-sm font-medium text-foreground truncate">Development Workspace</span>
                        </div>
                        <button className="p-1 rounded-md hover:bg-muted">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Workspace content */}
                    <div className="flex-1 p-2 space-y-1">
                        {/* Members section */}
                        <div className="group">
                            <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    <div className="flex items-center space-x-2">
                                        <Users className="w-4 h-4 text-blue-accent" />
                                        <span className="text-sm font-medium text-foreground">Members</span>
                                    </div>
                                </div>
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Files section */}
                        <div className="group">
                            <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    <div className="flex items-center space-x-2">
                                        <FileText className="w-4 h-4 text-blue-accent" />
                                        <span className="text-sm font-medium text-foreground">Files</span>
                                    </div>
                                </div>
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Tasks section */}
                        <div className="group">
                            <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    <div className="flex items-center space-x-2">
                                        <CheckSquare className="w-4 h-4 text-blue-accent" />
                                        <span className="text-sm font-medium text-foreground">Tasks</span>
                                    </div>
                                </div>
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Chats section (expanded) */}
                        <div className="group">
                            <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                    <ChevronDown className="w-4 h-4 text-blue-accent" />
                                    <div className="flex items-center space-x-2">
                                        <MessageSquare className="w-4 h-4 text-blue-accent" />
                                        <span className="text-sm font-medium text-foreground">Chats</span>
                                    </div>
                                </div>
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>

                            <div className="pl-6 mt-1">
                                <div className="space-y-1">
                                    <button className="w-full py-1 flex items-center text-left hover:bg-muted/50 rounded">
                                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                        <span className="text-xs font-medium text-muted-foreground truncate">Frontend Team</span>
                                    </button>

                                    <button className="w-full py-1 flex items-center text-left hover:bg-muted/50 rounded">
                                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                        <span className="text-xs font-medium text-muted-foreground truncate">Backend Team</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main preview area */}
                <div className="flex-1 bg-muted flex flex-col">
                    <div className="flex border-b border-border flex-shrink-0 bg-card">
                        <div className="flex items-center">
                            {/* Tabs */}
                            <div className="flex items-center h-9 px-3 border-r border-border bg-card relative">
                                <FileText className="w-3.5 h-3.5 text-foreground mr-1.5" />
                                <span className="text-xs font-medium text-foreground pr-1">Project Notes</span>
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-accent"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground text-sm">
                        Select a workspace to view and manage your projects
                    </div>
                </div>
            </div>
        </FeatureSection>
    );
};