// src/types.ts
import { Remote } from 'comlink';

/**
 * Data item interface
 */
export interface DataItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'error';
}

/**
 * Plugin settings interface
 */
export interface PluginSettings {
  syncInterval: number;
  dataEndpoint: string;
  autoSync: boolean;
}

/**
 * Plugin state interface
 */
export interface PluginState {
  items: DataItem[];
  lastSynced: number | null;
  isSyncing: boolean;
  error: string | null;
  settings: PluginSettings;
}

/**
 * Message types for inter-component communication
 */
export enum MessageType {
  SYNC_REQUEST = 'sync-request',
  SYNC_COMPLETE = 'sync-complete',
  SYNC_ERROR = 'sync-error',
  ITEM_ADDED = 'item-added',
  ITEM_UPDATED = 'item-updated',
  ITEM_DELETED = 'item-deleted',
  SETTINGS_UPDATED = 'settings-updated',
  STATE_REQUEST = 'state-request',
  STATE_UPDATE = 'state-update'
}

/**
 * Message target types
 */
export enum MessageTarget {
  BACKGROUND = 'background',
  SUMMARY = 'summary',
  EXPAND = 'expand',
  ALL_VIEWS = 'all-views'
}

/**
 * Message interface
 */
export interface PluginMessage<T> {
  id: string;
  pluginId: string;
  source: string;
  target: string;
  topic: string;
  payload: T;
  timestamp: number;
}

/**
 * Message payloads for different message types
 */
export namespace MessagePayload {
  export interface SyncRequest {
    force?: boolean;
  }
  
  export interface SyncComplete {
    itemCount: number;
    timestamp: number;
  }
  
  export interface SyncError {
    message: string;
    code?: number;
  }
  
  export interface ItemUpdated {
    item: DataItem;
  }
  
  export interface ItemDeleted {
    id: string;
  }
  
  export interface SettingsUpdated {
    settings: Partial<PluginSettings>;
  }
  
  export interface StateUpdate {
    state: PluginState;
  }
}

/**
 * Plugin API interfaces
 */
export interface WrappedStorageProvider {
  get<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  values<T>(): Promise<T[]>;
  entries<T>(): Promise<Array<[string, T]>>;
}

export interface StorageOptions {
  namespace: string;
  type: string;
}

export interface HttpApiWrapper {
  createInstance(namespace: string, config?: any): any;
}

export interface PluginGlobalApi {
  plugin: {
    id: string;
    name: string;
  };
  storage?: {
    default: WrappedStorageProvider;
    create: (options: StorageOptions) => WrappedStorageProvider;
  };
  network?: {
    http?: HttpApiWrapper;
    websocket?: any;
    socketio?: any;
  };
}

/**
 * Plugin worker API interface
 */
export interface PluginWorkerAPI {
  initialize(): Promise<void>;
  terminate(): Promise<void>;
  getStatus(): Promise<PluginStatus>;
  handleMessage?<T>(type: string, topic: string, payload: PluginMessage<T>): Promise<void>;
}

/**
 * Plugin status interface
 */
export interface PluginStatus {
  isActive: boolean;
  version: string;
  features?: string[];
  lastError: string | null;
  resourceUsage?: {
    memory?: number;
    cpu?: number;
  };
  [key: string]: any;
}

/**
 * System exposed API
 */
export interface SystemExposedAPI {
  pluginApi: PluginGlobalApi;
  sendMessage: <T>(target: string, topic: string, payload: T) => Promise<boolean>;
}

/**
 * Comlink Remote System API
 * Note: Comlink wraps all properties as promises
 */
export interface ComlinkSystemExposedAPI {
  pluginApi: PluginGlobalApi;
  sendMessage: <T>(target: string, topic: string, payload: T) => Promise<boolean>;
}

// Type helper to extract properties from a Remote type
export type RemoteSystemAPI = Remote<SystemExposedAPI>;