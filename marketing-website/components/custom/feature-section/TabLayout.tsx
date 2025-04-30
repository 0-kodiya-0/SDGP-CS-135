import React from 'react';
import { FileText, MessageSquare, CheckSquare, Code, Plus, MoreVertical } from 'lucide-react';
import { FeatureSection } from './FeatureSection';

export const TabLayout: React.FC = () => {
    return (
        <FeatureSection
            title="Seamless Multitasking with Tab Layout"
            description="Navigate between different tasks and documents with ease. Tabs keep your workspace organized and allow you to quickly switch between what you're working on."
        >
            <div className="h-96 bg-card border border-border overflow-hidden flex flex-col">
                {/* Tab bar */}
                <div className="flex border-b border-border flex-shrink-0 bg-card justify-between">
                    <div className="flex items-center">
                        {/* Active tab */}
                        <div className="flex items-center h-9 px-3 border-r border-border bg-card relative">
                            <FileText className="w-3.5 h-3.5 text-foreground mr-1.5" />
                            <span className="text-xs font-medium text-foreground pr-1">Project Notes.md</span>
                            <button className="ml-1 h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted">
                                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-accent"></div>
                        </div>

                        {/* Inactive tabs */}
                        <div className="flex items-center h-9 px-3 border-r border-border bg-muted hover:bg-muted/80 transition-colors">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                            <span className="text-xs font-medium text-muted-foreground pr-1">Chat</span>
                            <button className="ml-1 h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted/80">
                                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center h-9 px-3 border-r border-border bg-muted hover:bg-muted/80 transition-colors">
                            <CheckSquare className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                            <span className="text-xs font-medium text-muted-foreground pr-1">Tasks</span>
                            <button className="ml-1 h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted/80">
                                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center h-9 px-3 border-r border-border bg-green-500/10 hover:bg-green-500/20 transition-colors">
                            <Code className="w-3.5 h-3.5 text-green-500 dark:text-green-400 mr-1.5" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-300 pr-1">main.js</span>
                            <button className="ml-1 h-4 w-4 flex items-center justify-center rounded-full hover:bg-green-500/20">
                                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <button className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Three dots menu */}
                    <button className="px-2 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>

                {/* Tab content */}
                <div className="flex-grow flex overflow-hidden">
                    <div className="flex-grow overflow-auto p-4 bg-card">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <h1 className="text-foreground">Project Notes</h1>
                            <p className="text-foreground">This is the content of the current tab. Click on different tabs to switch between views.</p>

                            <h2 className="text-foreground">Key Points</h2>
                            <ul className="text-foreground">
                                <li>First point to remember about this project</li>
                                <li>Second important consideration</li>
                                <li>Resources needed for completion</li>
                            </ul>

                            <h2 className="text-foreground">Timeline</h2>
                            <p className="text-foreground">Initial draft due: <strong>March 15, 2025</strong></p>
                            <p className="text-foreground">Final submission: <strong>April 1, 2025</strong></p>

                            <div className="mt-6 p-4 bg-blue-accent/10 border border-blue-accent/30 rounded-md">
                                <p className="!text-blue-accent">
                                    <strong>Tip:</strong> Click on tabs to switch between different views and tools. Create new tabs to open more documents or features simultaneously.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right shortcuts sidebar */}
                    <div className="w-14 border-l border-border bg-card">
                        <div className="py-4 h-full">
                            <div className="flex flex-col space-y-4 items-center">
                                <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" title="Files">
                                    <FileText className="w-5 h-5 text-foreground" />
                                </button>

                                <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" title="Chat">
                                    <MessageSquare className="w-5 h-5 text-foreground" />
                                </button>

                                <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" title="Tasks">
                                    <CheckSquare className="w-5 h-5 text-foreground" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FeatureSection>
    );
};