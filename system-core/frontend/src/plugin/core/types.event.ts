// src/plugin/core/types.event.ts
import { PluginConfig, PluginId } from './types';

/**
 * Plugin-specific event types
 */

// Base event interface for all plugin events
export interface PluginEvent {
  pluginId: PluginId;
  timestamp: number;
}

// Worker lifecycle events
export interface PluginWorkerStartedEvent extends PluginEvent {
  config: PluginConfig;
}

export interface PluginWorkerStoppedEvent extends PluginEvent {
  reason?: 'user' | 'system' | 'error';
}

export interface PluginWorkerErrorEvent extends PluginEvent {
  error: string;
  fatal?: boolean;
}

// Plugin communication events
export interface PluginMessageEvent extends PluginEvent {
  type: string;
  payload: unknown;
}

// Plugin registration events
export interface PluginRegisteredEvent extends PluginEvent {
  config: PluginConfig;
}

export interface PluginUnregisteredEvent extends PluginEvent {
  reason?: string;
}

export interface PluginApprovedEvent extends PluginEvent {
  config: PluginConfig;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginApprovalRevokedEvent extends PluginEvent {
  // No additional fields required
}

// Plugin UI events
export interface PluginUiDisplayEvent extends PluginEvent {
  config: PluginConfig;
  viewType: 'summary' | 'expand';
  uiPath: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginUiHideEvent extends PluginEvent {
  // No additional fields required
}

// Plugin loading events
export interface PluginLoadedEvent extends PluginEvent {
  config: PluginConfig;
  isInternal: boolean;
}

export interface PluginLoadErrorEvent extends PluginEvent {
  error: string;
  isInternal: boolean;
}

// Plugin search events
export interface PluginSearchEvent extends PluginEvent {
  query: string;
  results: {
    count: number;
    pluginIds: PluginId[];
  };
}

/**
 * Extend the global EventMap via declaration merging
 * This adds plugin-specific events to the global event map
 */
declare module '../../events/types' {
  interface EventMap {
    // Worker lifecycle events
    'pluginWorkerStarted': PluginWorkerStartedEvent;
    'pluginWorkerStopped': PluginWorkerStoppedEvent;
    'pluginWorkerError': PluginWorkerErrorEvent;

    // Plugin communication events
    'pluginMessage': PluginMessageEvent;

    // Plugin registration events
    'pluginRegistered': PluginRegisteredEvent;
    'pluginUnregistered': PluginUnregisteredEvent;
    'pluginApproved': PluginApprovedEvent;
    'pluginApprovalRevoked': PluginApprovalRevokedEvent;

    // Plugin UI events
    'pluginUiDisplay': PluginUiDisplayEvent;
    'pluginUiHide': PluginUiHideEvent;

    // Plugin loading events
    'pluginLoaded': PluginLoadedEvent;
    'pluginLoadError': PluginLoadErrorEvent;

    // Plugin search events
    'pluginSearch': PluginSearchEvent;
  }
}