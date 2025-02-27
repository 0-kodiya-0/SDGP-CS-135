/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    entryPoint: string;
    permissions: string[];
    apiVersion: string;
    author: string;
}

// Plugin instance type
export interface Plugin {
    id: string;
    manifest: PluginManifest;
    status: 'loading' | 'running' | 'stopped' | 'error';
    worker: Worker;
    remote: any; // Comlink proxy to plugin methods
    error?: Error;
}