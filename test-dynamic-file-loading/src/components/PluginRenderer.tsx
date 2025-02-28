// src/components/PluginRenderer.tsx
import React, { useEffect, useState, useRef } from 'react';
import { LoadedPlugin, PluginUIProps } from '../plugin/types/plugin.types';

// Component cache to avoid reloading already loaded components
const componentCache = new Map<string, React.ComponentType<PluginUIProps>>();

// Dynamic Plugin UI Component
const DynamicPluginUI: React.FC<{ plugin: LoadedPlugin }> = ({ plugin }) => {
    const [Component, setComponent] = useState<React.ComponentType<PluginUIProps> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const isProduction = import.meta.env.PROD;
    const isMounted = useRef(true);

    // Helper function to add debug info
    const addDebug = (message: string) => {
        if (!isMounted.current) return;
        console.log(message);
        setDebugInfo(prev => [...prev, message]);
    };

    useEffect(() => {
        // Set up cleanup
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const loadPluginUI = async () => {
            try {
                // Reset state when plugin changes
                if (isMounted.current) {
                    setLoading(true);
                    setError(null);
                    setComponent(null);
                    setDebugInfo([]);
                }

                addDebug(`Loading plugin UI for ${plugin.id}`);

                // Check if this plugin has a UI component
                if (!plugin.config.ui || !plugin.config.ui.entryPoint) {
                    addDebug(`Plugin ${plugin.id} does not have a UI component`);
                    if (isMounted.current) {
                        setError("This plugin does not have a UI component");
                        setLoading(false);
                    }
                    return;
                }

                // Check if component is already in cache
                if (componentCache.has(plugin.id)) {
                    addDebug(`Using cached UI component for plugin ${plugin.id}`);
                    if (isMounted.current) {
                        setComponent(() => componentCache.get(plugin.id)!);
                        setLoading(false);
                    }
                    return;
                }

                // Path to the UI component - use the exact entry point from config
                const uiEntryPoint = plugin.config.ui.entryPoint;
                addDebug(`UI entry point from config: ${uiEntryPoint}`);

                try {
                    // Different import strategies for dev vs prod
                    let module;
                    
                    addDebug(`Environment: ${isProduction ? 'Production' : 'Development'}`);
                                        
                    if (isProduction) {
                        // Production path
                        const uiPath = `./plugin/${plugin.id}/${uiEntryPoint}`;
                        addDebug(`Production path: ${uiPath}`);
                        module = await import(/* @vite-ignore */ uiPath);
                    } else {
                        // Development path - try with direct path first
                        const devPath = `/src/plugin/${plugin.id}/${uiEntryPoint}`;
                        addDebug(`Development path: ${devPath}`);
                        try {
                            module = await import(/* @vite-ignore */ devPath);
                            addDebug('Module imported successfully');
                        } catch (err) {
                            addDebug(`First import approach failed: ${err instanceof Error ? err.message : String(err)}`);
                            
                            // Try with relative path
                            const relativePath = `../../plugin/${plugin.id}/${uiEntryPoint}`;
                            addDebug(`Trying relative path: ${relativePath}`);
                            module = await import(/* @vite-ignore */ relativePath);
                        }
                    }
                    
                    addDebug(`Module loaded: ${module ? 'Success' : 'Failed'}`);
                    if (module) {
                        addDebug(`Module keys: ${Object.keys(module).join(', ')}`);
                        addDebug(`Has default export: ${module.default ? 'Yes' : 'No'}`);
                    }

                    if (!module || !module.default) {
                        throw new Error(`Plugin UI component not found (no default export) for ${plugin.id}`);
                    }

                    // Try to render the component to see if it's valid
                    try {
                        const TestComponent = module.default;
                        addDebug(`Component type: ${typeof TestComponent}`);
                        // This is just to test if the component is valid React component
                        addDebug('Component is valid React component');
                    } catch (renderError) {
                        addDebug(`Component failed validation: ${renderError instanceof Error ? renderError.message : String(renderError)}`);
                        throw renderError;
                    }

                    // Cache the component for future use
                    componentCache.set(plugin.id, module.default);
                    addDebug('Component cached for future use');

                    // Only update state if component is still mounted
                    if (isMounted.current) {
                        setComponent(() => module.default);
                        addDebug('Component state updated');
                    }
                } catch (importError) {
                    addDebug(`Import error: ${importError instanceof Error ? importError.message : String(importError)}`);
                    
                    // Try with most direct approach
                    try {
                        addDebug('Trying direct import approach...');
                        
                        // Most direct approach
                        const directPath = `${window.location.origin}/src/plugin/${plugin.id}/${uiEntryPoint}`;
                        addDebug(`Direct URL: ${directPath}`);
                        
                        // Create a script element and load the module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = directPath;
                        
                        // Wait for script to load or error
                        await new Promise((resolve, reject) => {
                            script.onload = resolve;
                            script.onerror = (e) => {
                                addDebug(`Script load error: ${e}`);
                                reject(new Error('Failed to load script'));
                            };
                            document.head.appendChild(script);
                        });
                        
                        // Check if the module is now available on window
                        addDebug('Checking if module is available on window');
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        const windowModule = window[`plugin_${plugin.id.replace(/-/g, '_')}_ui`];
                        
                        if (windowModule && windowModule.default) {
                            addDebug('Module found on window object');
                            componentCache.set(plugin.id, windowModule.default);
                            
                            if (isMounted.current) {
                                setComponent(() => windowModule.default);
                            }
                        } else {
                            addDebug('Module not found on window object');
                            throw new Error('Module not found after script load');
                        }
                    } catch (directError) {
                        addDebug(`Direct import failed: ${directError instanceof Error ? directError.message : String(directError)}`);
                        throw importError; // Throw the original error
                    }
                }
            } catch (err) {
                addDebug(`Final error: ${err instanceof Error ? err.message : String(err)}`);

                if (isMounted.current) {
                    setError(`Failed to load plugin UI: ${err instanceof Error ? err.message : String(err)}`);
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        };

        loadPluginUI();
    }, [plugin, isProduction]);

    if (loading) {
        return (
            <div className="p-4 bg-gray-100 rounded-lg">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
                <div className="mt-4 text-sm text-gray-500">Loading plugin UI...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg">
                <h3 className="text-lg font-bold mb-2">Plugin Information</h3>
                <p className="mb-2 text-red-600">{error}</p>
                <div className="text-sm text-amber-600">
                    <p>Plugin ID: {plugin.id}</p>
                    <p>Plugin Name: {plugin.name}</p>
                    <p>Description: {plugin.config.description || 'No description provided'}</p>
                </div>
                {plugin.config.ui ? (
                    <div className="mt-2 text-sm text-amber-600">
                        <p>UI Entry Point: {plugin.config.ui.entryPoint}</p>
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-amber-600">
                        <p>This plugin only provides background functionality.</p>
                    </div>
                )}
                
                {/* Debug information - only in development mode */}
                {!isProduction && debugInfo.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-bold text-sm mb-1">Debug Information:</h4>
                        <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 max-h-40 overflow-y-auto">
                            {debugInfo.map((msg, i) => (
                                <div key={i} className="mb-1">• {msg}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (!Component) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Failed to load component (unknown error)</div>;
    }

    try {
        return <Component pluginId={plugin.id} proxy={plugin.proxy} />;
    } catch (renderError) {
        console.error('Error rendering plugin component:', renderError);
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 className="text-lg font-bold mb-2">Error Rendering Plugin</h3>
                <p>{renderError instanceof Error ? renderError.message : String(renderError)}</p>
                
                {/* Debug information - only in development mode */}
                {!isProduction && debugInfo.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-bold text-sm mb-1">Debug Information:</h4>
                        <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 max-h-40 overflow-y-auto">
                            {debugInfo.map((msg, i) => (
                                <div key={i} className="mb-1">• {msg}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
};

// Main PluginRenderer component
const PluginRenderer: React.FC<{ plugin: LoadedPlugin }> = ({ plugin }) => {
    return (
        <div className="plugin-container bg-gray-50 p-4 rounded-lg">
            {plugin.hasUI === false ? (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                    <h3 className="text-lg font-bold mb-2">{plugin.name}</h3>
                    <p>This plugin runs in the background and does not have a user interface.</p>
                    <p className="mt-2 text-sm">Plugin ID: {plugin.id}</p>
                </div>
            ) : (
                <DynamicPluginUI plugin={plugin} />
            )}
        </div>
    );
};

export default PluginRenderer;