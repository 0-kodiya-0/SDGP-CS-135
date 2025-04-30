import React from 'react';
import { Plus } from 'lucide-react';
import { FeatureSection } from './FeatureSection';

export const ThirdPartyIntegration: React.FC = () => {
    return (
        <FeatureSection
            title="Seamless Third-Party App Integration"
            description="Connect your favorite tools and services directly into FusionSpace. Work with Google Workspace, Microsoft 365, Slack, and more without leaving your workspace."
            reversed={true}
        >
            <div className="h-96 bg-card p-6 flex items-center justify-center">
                <div className="max-w-md w-full">
                    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                        <div className="border-b border-border px-4 py-3 bg-muted">
                            <h3 className="font-medium text-foreground">Connected Applications</h3>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-shrink-0 mr-3">
                                    <svg viewBox="0 0 24 24" width="24" height="24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">Google Workspace</p>
                                    <p className="text-xs text-muted-foreground">Connected • All services</p>
                                </div>
                                <div className="ml-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-shrink-0 mr-3">
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#0078d4" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">Microsoft 365</p>
                                    <p className="text-xs text-muted-foreground">Connected • Email, Calendar</p>
                                </div>
                                <div className="ml-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-shrink-0 mr-3">
                                    <svg width="24" height="24" viewBox="0 0 54 54">
                                        <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36c5f0" />
                                        <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2eb67d" />
                                        <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ecb22e" />
                                        <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.25a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#e01e5a" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">Slack</p>
                                    <p className="text-xs text-muted-foreground">Connected • Messaging</p>
                                </div>
                                <div className="ml-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center p-3 border border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-shrink-0 mr-3">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-muted-foreground truncate">Connect New App</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        All integrations work seamlessly within your FusionSpace environment
                    </div>
                </div>
            </div>
        </FeatureSection>
    );
};