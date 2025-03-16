import { PluginId } from "./types";

/**
 * Message target types within a plugin
 */
export enum MessageTarget {
    // Background script
    BACKGROUND = 'background',

    // Summary view
    SUMMARY = 'summary',

    // Expand view
    EXPAND = 'expand',

    // All views (summary and expand)
    ALL_VIEWS = 'all-views',
}

/**
 * Plugin message interface for inter-component communication
 */
export interface PluginMessage<T> {
    // Message ID
    id: string;

    // Plugin ID (the plugin this message belongs to)
    pluginId: PluginId;

    // Source component that sent the message (background, summary, expand, or view ID)
    source: string;

    // Target component (background, summary, expand, all-views, or view ID)
    target: string;

    // Message topic/channel
    topic: string;

    // Message data payload
    payload: T;

    // Timestamp when the message was created
    timestamp: number;
}