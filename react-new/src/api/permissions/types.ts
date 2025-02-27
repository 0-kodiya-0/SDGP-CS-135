import { PluginManifest } from "../plugin/types";

// Types for permission management
export type PermissionType = 'network' | 'storage' | 'state' | 'ui' | 'file' | 'system';
export type PluginId = string;

export interface RegisteredPlugin {
    id: PluginId;
    manifest: PluginManifest;
    permissions: PermissionType[];
    approved: boolean;
}