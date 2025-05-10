import React from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { FeatureSection } from './FeatureSection';

export const EnvironmentSwitcher: React.FC = () => {
    return (
        <FeatureSection
            title="Tailor-Made Environments for Every Role"
            description="Switch between different environments designed for specific roles and tasks. Whether you're working as a student, developer, or project manager, FusionSpace adapts to your needs."
            reversed={true}
        >
            <div className="p-6 bg-card h-72 flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                        <div className="h-12 border-b border-border flex items-center px-4 justify-between bg-card">
                            <div className="transition-opacity duration-300">
                                <span className="text-sm font-medium text-foreground">Environment Selection</span>
                            </div>
                        </div>

                        <div className="bg-card">
                            <div className="py-2 px-2">
                                <button className="w-full py-2 px-3 flex items-center justify-between hover:bg-blue-accent/10 rounded-md transition-colors bg-blue-accent/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="rounded-full bg-blue-accent w-8 h-8 flex items-center justify-center text-primary-foreground font-semibold">S</div>
                                        <span className="text-sm font-medium text-foreground">Student Environment</span>
                                    </div>
                                    <CheckSquare className="w-4 h-4 text-blue-accent" />
                                </button>
                            </div>

                            <div className="py-2 px-2">
                                <button className="w-full py-2 px-3 flex items-center justify-between hover:bg-blue-accent/10 rounded-md transition-colors">
                                    <div className="flex items-center space-x-2">
                                        <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center text-muted-foreground font-semibold">D</div>
                                        <span className="text-sm font-medium text-muted-foreground">Developer Environment</span>
                                    </div>
                                </button>
                            </div>

                            <div className="py-2 px-2">
                                <button className="w-full py-2 px-3 flex items-center justify-between hover:bg-blue-accent/10 rounded-md transition-colors">
                                    <div className="flex items-center space-x-2">
                                        <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center text-muted-foreground font-semibold">P</div>
                                        <span className="text-sm font-medium text-muted-foreground">Project Manager Environment</span>
                                    </div>
                                </button>
                            </div>

                            <div className="py-2 px-2">
                                <button className="w-full py-2 px-3 flex items-center justify-between hover:bg-blue-accent/10 rounded-md transition-colors border border-dashed border-border">
                                    <div className="flex items-center space-x-2">
                                        <div className="rounded-full bg-muted/50 w-8 h-8 flex items-center justify-center text-muted-foreground">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">Create New Environment</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground text-center">
                        Each environment comes with specialized tools and layouts <br />tailored to specific work requirements
                    </div>
                </div>
            </div>
        </FeatureSection>
    );
};