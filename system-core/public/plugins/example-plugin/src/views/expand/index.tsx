// src/views/expand/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as Comlink from 'comlink';
import {
  DataItem,
  PluginState,
  PluginSettings,
  MessageType,
  MessagePayload,
  MessageTarget,
  RemoteSystemAPI,
  PluginGlobalApi
} from '../../types';
import './styles.css';

// Component for displaying a single data item
const DataItemComponent: React.FC<{
  item: DataItem;
  onEdit: (item: DataItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, onEdit, onDelete }) => {
  const statusClass = item.status === 'synced'
    ? 'synced'
    : item.status === 'error'
      ? 'error'
      : 'pending';

  return (
    <div className={`data-item ${statusClass}`}>
      <div className="data-item-header">
        <h3 className="data-item-title">{item.title}</h3>
        <div className="data-item-status">{item.status}</div>
      </div>
      <div className="data-item-content">{item.content}</div>
      <div className="data-item-footer">
        <span className="data-item-timestamp">
          {new Date(item.timestamp).toLocaleString()}
        </span>
        <div className="data-item-actions">
          <button onClick={() => onEdit(item)} className="edit-button">Edit</button>
          <button onClick={() => onDelete(item.id)} className="delete-button">Delete</button>
        </div>
      </div>
    </div>
  );
};

// Form component for editing or creating items
const ItemForm: React.FC<{
  item?: DataItem;
  onSubmit: (item: Omit<DataItem, 'id' | 'status' | 'timestamp'>) => void;
  onCancel: () => void;
}> = ({ item, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content });
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-button">
          Cancel
        </button>
        <button type="submit" className="submit-button">
          {item ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

// Settings component
const SettingsPanel: React.FC<{
  settings: PluginSettings;
  onSave: (settings: Partial<PluginSettings>) => void;
  onClose: () => void;
}> = ({ settings, onSave, onClose }) => {
  const [syncInterval, setSyncInterval] = useState(settings.syncInterval.toString());
  const [dataEndpoint, setDataEndpoint] = useState(settings.dataEndpoint);
  const [autoSync, setAutoSync] = useState(settings.autoSync);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      syncInterval: parseInt(syncInterval),
      dataEndpoint,
      autoSync
    });
  };

  return (
    <div className="settings-panel">
      <h2>Settings</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="syncInterval">Sync Interval (seconds)</label>
          <input
            type="number"
            id="syncInterval"
            value={syncInterval}
            onChange={(e) => setSyncInterval(e.target.value)}
            min="10"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataEndpoint">Data Endpoint URL</label>
          <input
            type="url"
            id="dataEndpoint"
            value={dataEndpoint}
            onChange={(e) => setDataEndpoint(e.target.value)}
            required
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
            Auto Sync
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button type="submit" className="submit-button">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Expand View Component
 */
const ExpandView: React.FC = () => {
  // State
  const [state, setState] = useState<PluginState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // References to plugin API and messaging
  const systemApi = useRef<RemoteSystemAPI | null>(null);
  const pluginApiRef = useRef<PluginGlobalApi | null>(null);
  const sendMessageRef = useRef<(<T>(target: string, topic: string, payload: T) => Promise<boolean>) | null>(null);

  // Initialize communication with the plugin system
  useEffect(() => {
    const initializePluginApi = async () => {
      try {
        // The plugin system exposes the API via Comlink in the window object
        if (window.parent) {
          // Create a Comlink endpoint connecting to the parent window
          const endpoint = Comlink.windowEndpoint(window.parent);

          // Connect to the exposed API
          systemApi.current = Comlink.wrap<RemoteSystemAPI>(endpoint);

          // Get the actual pluginApi and sendMessage function
          // Since Comlink wraps these as promises, we need to await them
          const api = await systemApi.current.pluginApi;
          pluginApiRef.current = api;
          sendMessageRef.current = systemApi.current.sendMessage;

          console.log('Expand View: Plugin API connected via Comlink');

          // Request initial state
          requestInitialState();
        } else {
          setError('Cannot connect to plugin system: No parent window found');
        }
      } catch (error) {
        console.error('Expand View: Error connecting to plugin system', error);
        setError('Failed to connect to plugin system');
      }
    };

    initializePluginApi();

    // Set up message listener for communication from the plugin system
    const handleMessage = (event: MessageEvent) => {
      // Check if the message is from the plugin system
      if (event.data && event.data.pluginMessage) {
        const message = event.data.pluginMessage;
        handlePluginMessage(message.topic, message.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  /**
   * Request initial state from background service
   */
  const requestInitialState = async () => {
    if (!sendMessageRef.current) {
      console.warn('Expand View: System API not available yet');
      return;
    }

    setIsLoading(true);

    try {
      // Request current state from background
      await sendMessageRef.current(
        MessageTarget.BACKGROUND,
        MessageType.STATE_REQUEST,
        {}
      );
    } catch (error) {
      console.error('Expand View: Error requesting state', error);
      setError('Failed to connect to background service');
      setIsLoading(false);
    }
  };

  /**
   * Handle plugin messages from background service
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePluginMessage = (type: string, payload: any) => {
    console.log(`Expand View: Received message - ${type}`);

    switch (type) {
      case MessageType.STATE_UPDATE:
        handleStateUpdate(payload as MessagePayload.StateUpdate);
        break;

      case MessageType.SYNC_COMPLETE:
        handleSyncComplete(payload as MessagePayload.SyncComplete);
        break;

      case MessageType.SYNC_ERROR:
        handleSyncError(payload as MessagePayload.SyncError);
        break;

      case MessageType.ITEM_UPDATED:
        // If we're editing this item, close the editor
        if (editingItem && payload.item.id === editingItem.id) {
          setEditingItem(null);
        }
        // Request full state update
        requestInitialState();
        break;

      case MessageType.ITEM_DELETED:
        // If we're editing this item, close the editor
        if (editingItem && payload.id === editingItem.id) {
          setEditingItem(null);
        }
        // Request full state update
        requestInitialState();
        break;

      case MessageType.SETTINGS_UPDATED:
        // If we're editing settings, close the settings panel
        setShowSettings(false);
        // Request full state update
        requestInitialState();
        break;
    }
  };

  /**
   * Handle state update message
   */
  const handleStateUpdate = (payload: MessagePayload.StateUpdate) => {
    setIsLoading(false);
    setState(payload.state);
    setError(null);
  };

  /**
   * Handle sync complete message
   */
  const handleSyncComplete = (payload: MessagePayload.SyncComplete) => {
    setIsLoading(false);

    // Update last synced timestamp in state if available
    if (state) {
      setState({
        ...state,
        lastSynced: payload.timestamp,
        isSyncing: false,
        error: null
      });
    }
  };

  /**
   * Handle sync error message
   */
  const handleSyncError = (payload: MessagePayload.SyncError) => {
    setIsLoading(false);
    setError(payload.message);

    // Update error in state if available
    if (state) {
      setState({
        ...state,
        isSyncing: false,
        error: payload.message
      });
    }
  };

  /**
   * Handle sync button click
   */
  const handleSyncClick = async () => {
    if (!sendMessageRef.current) {
      return;
    }

    // Set syncing state
    if (state) {
      setState({
        ...state,
        isSyncing: true,
        error: null
      });
    }

    try {
      // Request sync from background
      await sendMessageRef.current(
        MessageTarget.BACKGROUND,
        MessageType.SYNC_REQUEST,
        { force: true }
      );
    } catch (error) {
      console.error('Expand View: Error requesting sync', error);
      setError('Failed to send sync request');

      // Update error in state
      if (state) {
        setState({
          ...state,
          isSyncing: false,
          error: 'Failed to send sync request'
        });
      }
    }
  };

  /**
   * Handle item edit button click
   */
  const handleEditItem = (item: DataItem) => {
    setEditingItem(item);
    setIsCreatingItem(false);
  };

  /**
   * Handle item delete button click
   */
  const handleDeleteItem = async (id: string) => {
    if (!sendMessageRef.current || !state) {
      return;
    }

    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      // Send delete message to background
      await sendMessageRef.current(
        MessageTarget.BACKGROUND,
        MessageType.ITEM_DELETED,
        { id }
      );
    } catch (error) {
      console.error('Expand View: Error deleting item', error);
      setError('Failed to delete item');
    }
  };

  /**
   * Handle form submission for creating or updating an item
   */
  const handleItemSubmit = async (formData: Omit<DataItem, 'id' | 'status' | 'timestamp'>) => {
    if (!sendMessageRef.current || !state) {
      return;
    }

    try {
      // If editing an existing item
      if (editingItem) {
        const updatedItem: DataItem = {
          ...editingItem,
          ...formData,
          timestamp: Date.now()
        };

        // Send update message to background
        await sendMessageRef.current(
          MessageTarget.BACKGROUND,
          MessageType.ITEM_UPDATED,
          { item: updatedItem }
        );

        // Close edit form
        setEditingItem(null);
      }
      // If creating a new item
      else {
        const newItem: DataItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...formData,
          timestamp: Date.now(),
          status: 'pending'
        };

        // Send create message to background
        await sendMessageRef.current(
          MessageTarget.BACKGROUND,
          MessageType.ITEM_UPDATED,
          { item: newItem }
        );

        // Close create form
        setIsCreatingItem(false);
      }
    } catch (error) {
      console.error('Expand View: Error saving item', error);
      setError('Failed to save item');
    }
  };

  /**
   * Handle saving settings
   */
  const handleSaveSettings = async (settings: Partial<PluginSettings>) => {
    if (!sendMessageRef.current || !state) {
      return;
    }

    try {
      // Send settings update to background
      await sendMessageRef.current(
        MessageTarget.BACKGROUND,
        MessageType.SETTINGS_UPDATED,
        { settings }
      );

      // Close settings panel
      setShowSettings(false);
    } catch (error) {
      console.error('Expand View: Error updating settings', error);
      setError('Failed to update settings');
    }
  };

  // Format last synced timestamp
  const formatLastSynced = (timestamp: number | null): string => {
    if (!timestamp) {
      return 'Never';
    }

    return new Date(timestamp).toLocaleString();
  };

  // Show loading state
  if (isLoading && !state) {
    return (
      <div className="plugin-expand-view">
        <div className="loading-indicator">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (error && !state) {
    return (
      <div className="plugin-expand-view">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // If showing settings panel
  if (showSettings && state) {
    return (
      <div className="plugin-expand-view">
        <SettingsPanel
          settings={state.settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  // If editing an item
  if (editingItem || isCreatingItem) {
    return (
      <div className="plugin-expand-view">
        <h2>{editingItem ? 'Edit Item' : 'Create New Item'}</h2>
        <ItemForm
          item={editingItem || undefined}
          onSubmit={handleItemSubmit}
          onCancel={() => {
            setEditingItem(null);
            setIsCreatingItem(false);
          }}
        />
      </div>
    );
  }

  // Show data when state is available
  return (
    <div className="plugin-expand-view">
      <header className="plugin-header">
        <h1>Data Sync Plugin</h1>

        <div className="plugin-status">
          <div className={`status-indicator ${state?.isSyncing ? 'syncing' : state?.error ? 'error' : 'ok'}`}>
            {state?.isSyncing ? 'Syncing...' : state?.error ? 'Error' : 'Ready'}
          </div>
        </div>
      </header>

      <div className="plugin-toolbar">
        <div className="sync-info">
          <span className="item-count">{state?.items.length || 0} items</span>
          <span className="last-synced">Last synced: {formatLastSynced(state?.lastSynced || null)}</span>
        </div>

        <div className="toolbar-actions">
          <button onClick={() => setShowSettings(true)} className="settings-button">
            Settings
          </button>
          <button onClick={handleSyncClick} disabled={state?.isSyncing} className="sync-button">
            {state?.isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button onClick={() => setIsCreatingItem(true)} className="create-button">
            New Item
          </button>
        </div>
      </div>

      {state?.error && (
        <div className="error-banner">
          Error: {state.error}
        </div>
      )}

      <div className="items-container">
        {state?.items.length === 0 ? (
          <div className="no-items">
            <p>No items yet. Create your first item to get started.</p>
            <button onClick={() => setIsCreatingItem(true)} className="create-button">
              Create Item
            </button>
          </div>
        ) : (
          <div className="items-list">
            {state?.items.map(item => (
              <DataItemComponent
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Create root element
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Render the component
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ExpandView />
  </React.StrictMode>
);