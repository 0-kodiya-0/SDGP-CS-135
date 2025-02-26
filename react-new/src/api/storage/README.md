# Storage API Documentation (Web Implementation)

The Storage API provides a persistent data storage interface for web environments. It uses localforage to handle browser storage while exposing a consistent API to the rest of the application.

## Architecture Overview

The Web Storage API follows a provider-based architecture with the following key components:

1. **StorageApi**: The main entry point that creates and manages storage providers
2. **StorageProvider**: Interface defining the methods each provider must implement
3. **WebStorageProvider**: Implementation for web browsers using localforage
4. **Database**: A higher-level wrapper for structured data storage
5. **React Integration**: Hooks and utilities for integrating with React components

## Core API

### Getting Started

```typescript
import storageApi from './api/storage';

// Create or retrieve a storage instance
const appSettings = storageApi.getStorage({
  namespace: 'app-settings',
  defaults: {
    theme: 'light',
    fontSize: 16
  }
});

// Use the storage instance
await appSettings.set('theme', 'dark');
const theme = await appSettings.get('theme');
```

### StorageApi Methods

#### `getStorage(options: StorageOptions): StorageProvider`

Creates a new storage provider or returns an existing one with the specified namespace.

```typescript
const userPrefs = storageApi.getStorage({
  namespace: 'user-preferences',
  defaults: { language: 'en' }
});
```

#### `createStorage(options: StorageOptions): StorageProvider`

Always creates a new storage provider instance with the specified namespace.

```typescript
const temporaryStorage = storageApi.createStorage({
  namespace: 'temp-data'
});
```

### StorageProvider Interface

Each storage provider implements the following methods:

#### `get<T>(key: string, defaultValue?: T): Promise<T | undefined>`

Retrieves a value from storage.

```typescript
const fontSize = await storage.get<number>('fontSize', 16);
```

#### `set<T>(key: string, value: T): Promise<void>`

Stores a value in storage.

```typescript
await storage.set('fontSize', 18);
```

#### `has(key: string): Promise<boolean>`

Checks if a key exists in storage.

```typescript
const hasDarkMode = await storage.has('darkMode');
```

#### `delete(key: string): Promise<void>`

Removes a key from storage.

```typescript
await storage.delete('temporarySetting');
```

#### `clear(): Promise<void>`

Removes all keys from this storage namespace.

```typescript
await storage.clear();
```

#### `keys(): Promise<string[]>`

Gets all keys in this storage namespace.

```typescript
const allKeys = await storage.keys();
```

#### `values<T = any>(): Promise<T[]>`

Gets all values in this storage namespace.

```typescript
const allValues = await storage.values();
```

#### `entries<T = any>(): Promise<Array<[string, T]>>`

Gets all key-value pairs in this storage namespace.

```typescript
const allEntries = await storage.entries();
```

## Web Implementation Details

The web implementation uses `localforage`, which provides:

- IndexedDB as primary storage
- Fallbacks to WebSQL and localStorage when necessary
- Promise-based API
- Cross-browser compatibility

```typescript
// src/api/storage/providers/webProvider.ts
import localforage from 'localforage';

export class WebStorageProvider implements StorageProvider {
  private storage: LocalForage;
  
  constructor(options: StorageOptions) {
    this.storage = localforage.createInstance({
      name: options.namespace,
    });
    
    // Initialize defaults if provided
    if (options.defaults) {
      this.initDefaults(options.defaults);
    }
  }
  
  // Implementation details...
}
```

## Database Wrapper

The Database class provides a higher-level abstraction for working with collections of objects:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const userDb = new Database<User>('app-data', 'users');

// Add a user
await userDb.add({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com'
});

// Get all users
const users = await userDb.getAll();

// Query specific users
const admins = await userDb.query(user => user.email.endsWith('@admin.com'));
```

### Database Methods

#### `getAll(): Promise<T[]>`

Retrieves all items in the collection.

#### `getById(id: string): Promise<T | undefined>`

Retrieves a specific item by ID.

#### `add(item: T): Promise<T>`

Adds a new item to the collection.

#### `update(id: string, updateData: Partial<T>): Promise<T | undefined>`

Updates an existing item by ID.

#### `remove(id: string): Promise<boolean>`

Removes an item from the collection.

#### `query(predicate: (item: T) => boolean): Promise<T[]>`

Finds items that match the given predicate function.

## React Integration

### useStorage Hook

The `useStorage` hook provides an easy way to use storage in React components:

```typescript
function SettingsPanel() {
  const { 
    value: fontSize, 
    setValue: setFontSize,
    isLoading
  } = useStorage<number>(
    'fontSize',
    16,
    { namespace: 'user-preferences' }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <label>Font Size: {fontSize}px</label>
      <button onClick={() => setFontSize(fontSize + 1)}>Increase</button>
      <button onClick={() => setFontSize(fontSize - 1)}>Decrease</button>
    </div>
  );
}
```

## Best Practices

### Namespace Organization

Organize your application's storage into logical namespaces:

- `app-settings`: Global application settings
- `user-preferences`: User-specific settings
- `app-data`: Application data storage
- `cache`: Temporary cached data

### Type Safety

Always use TypeScript generics when retrieving data:

```typescript
// Good
const theme = await storage.get<string>('theme');

// Avoid
const theme = await storage.get('theme');
```

### Error Handling

Always wrap storage operations in try/catch blocks:

```typescript
try {
  await storage.set('important-data', data);
} catch (error) {
  console.error('Failed to save data:', error);
  // Show user-friendly error message
}
```

### Default Values

Provide default values whenever getting data:

```typescript
const fontSize = await storage.get<number>('fontSize', 16);
```

### Storage Initialization

Initialize your storage with defaults when creating it:

```typescript
const appSettings = storageApi.getStorage({
  namespace: 'app-settings',
  defaults: {
    theme: 'light',
    fontSize: 16,
    notifications: true
  }
});
```

## Integration with Other APIs

### File System API Integration

For large data sets, use the File System API in conjunction with the Storage API:

```typescript
import { fileSystemApi } from '../fileSystem';

async function saveUserData(userId, data) {
  // Save reference in Storage API
  const storage = storageApi.getStorage({ namespace: 'user-data' });
  await storage.set(`user-${userId}-path`, `users/${userId}/data.json`);
  
  // Save actual data via File System API
  await fileSystemApi.writeJson(`users/${userId}/data.json`, data);
}
```

### Network API Integration

For data synchronization with remote servers:

```typescript
import { networkApi } from '../network';

async function syncUserPreferences() {
  const storage = storageApi.getStorage({ namespace: 'user-preferences' });
  const preferences = await storage.entries();
  
  // Send to server
  await networkApi.post('/api/sync/preferences', { preferences });
  
  // Update last sync timestamp
  await storage.set('lastSyncTime', new Date().toISOString());
}
```

## Web Security Considerations

When using the Web Storage API, be mindful that:

- IndexedDB/localStorage data isn't encrypted by default
- User can clear browser storage at any time
- Storage limits vary by browser (typically 5-10MB for localStorage, and 50-100MB for IndexedDB)
- Data is accessible to JavaScript from the same origin, so don't store sensitive data without additional encryption

## Testing the Storage API

### Mock Implementation

For testing, create a mock storage provider that uses an in-memory Map:

```typescript
// src/api/storage/providers/mockProvider.ts
export class MockStorageProvider implements StorageProvider {
  private data: Map<string, any> = new Map();
  
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }
  
  async has(key: string): Promise<boolean> {
    return this.data.has(key);
  }
  
  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
  
  async clear(): Promise<void> {
    this.data.clear();
  }
  
  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
  
  async values<T = any>(): Promise<T[]> {
    return Array.from(this.data.values()) as T[];
  }
  
  async entries<T = any>(): Promise<Array<[string, T]>> {
    return Array.from(this.data.entries()) as Array<[string, T]>;
  }
}
```

### Setting Up Test Environment

In your test setup file, configure the Storage API to use the mock provider:

```typescript
// src/api/storage/__tests__/setup.ts
import { StorageApi } from '../storageApi';
import { MockStorageProvider } from '../providers/mockProvider';

// Override the provider factory in the StorageApi
jest.mock('../storageApi', () => {
  const original = jest.requireActual('../storageApi');
  
  return {
    ...original,
    StorageApi: class extends original.StorageApi {
      getStorage(options) {
        return new MockStorageProvider();
      }
      
      createStorage(options) {
        return new MockStorageProvider();
      }
    },
    default: new StorageApi()
  };
});
```

### Unit Testing Example

Here's an example of how to test a component that uses the storage hook:

```typescript
// src/components/features/settings/ThemeSelector.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeSelector from './ThemeSelector';
import storageApi from '../../../api/storage/storageApi';

// Mock storage for testing
const mockStorage = {
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn()
};

jest.mock('../../../api/storage/storageApi', () => ({
  getStorage: jest.fn(() => mockStorage)
}));

describe('ThemeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.get.mockImplementation((key, defaultValue) => 
      Promise.resolve(defaultValue)
    );
  });
  
  it('renders with default theme', async () => {
    render(<ThemeSelector />);
    
    // Initially shows loading
    expect(screen.getByText(/Loading theme preference/i)).toBeInTheDocument();
    
    // Then shows the theme
    await waitFor(() => {
      expect(screen.getByText(/Current theme: light/i)).toBeInTheDocument();
    });
  });
  
  it('updates theme when button is clicked', async () => {
    render(<ThemeSelector />);
    
    await waitFor(() => {
      expect(screen.getByText(/Current theme: light/i)).toBeInTheDocument();
    });
    
    // Click dark theme button
    fireEvent.click(screen.getByText('Dark'));
    
    // Check that set was called
    expect(mockStorage.set).toHaveBeenCalledWith('theme', 'dark');
  });
});
```

## Performance Considerations

### Caching Strategy

For frequently accessed data, implement an in-memory cache:

```typescript
class CachedStorageProvider implements StorageProvider {
  private provider: StorageProvider;
  private cache: Map<string, any> = new Map();
  
  constructor(provider: StorageProvider) {
    this.provider = provider;
  }
  
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const value = await this.provider.get<T>(key, defaultValue);
    this.cache.set(key, value);
    return value;
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
    await this.provider.set(key, value);
  }
  
  // Implement remaining methods...
}
```

### Batch Operations

For multiple operations, use batch processing where possible:

```typescript
async function batchUpdate(storage: StorageProvider, updates: Record<string, any>) {
  const promises = Object.entries(updates).map(
    ([key, value]) => storage.set(key, value)
  );
  
  await Promise.all(promises);
}
```

### Storage Size Monitoring

Monitor storage size to prevent exceeding browser limits:

```typescript
async function getStorageSize(namespace: string): Promise<number> {
  const storage = storageApi.getStorage({ namespace });
  const entries = await storage.entries();
  
  // Calculate size in bytes (approximation)
  return entries.reduce((size, [key, value]) => {
    return size + key.length + JSON.stringify(value).length;
  }, 0);
}
```

## Browser Storage Limitations

Be aware of these browser storage limitations:

| Storage Type | Typical Limit | Notes |
|--------------|---------------|-------|
| localStorage | 5-10MB | Synchronous, blocks the main thread |
| IndexedDB    | 50-100MB | Asynchronous, used by localforage |
| WebSQL       | 50MB | Deprecated, but used as fallback |

These limits vary by browser and device. Always implement a strategy to handle cases where storage limits are exceeded.

## Migration Strategies

### Version-Based Migration

Handle storage schema changes with version-based migrations:

```typescript
async function migrateStorage(namespace: string, currentVersion: number) {
  const storage = storageApi.getStorage({ namespace });
  const version = await storage.get<number>('version', 0);
  
  if (version < currentVersion) {
    // Run migrations based on version
    if (version < 1) {
      await migrateV0ToV1(storage);
    }
    
    if (version < 2) {
      await migrateV1ToV2(storage);
    }
    
    // Update version
    await storage.set('version', currentVersion);
  }
}

async function migrateV0ToV1(storage: StorageProvider) {
  // Example: Rename a key
  const oldValue = await storage.get('oldKey');
  if (oldValue !== undefined) {
    await storage.set('newKey', oldValue);
    await storage.delete('oldKey');
  }
}
```

### Data Backup

Implement a backup mechanism before migrations:

```typescript
async function backupStorage(namespace: string) {
  const storage = storageApi.getStorage({ namespace });
  const backupStorage = storageApi.createStorage({ namespace: `${namespace}-backup` });
  
  const data = await storage.entries();
  
  for (const [key, value] of data) {
    await backupStorage.set(key, value);
  }
  
  await backupStorage.set('backup-time', new Date().toISOString());
}
```

## Common Patterns

### Observer Pattern

Implement observers to react to storage changes:

```typescript
class ObservableStorage {
  private storage: StorageProvider;
  private observers: Map<string, Set<(value: any) => void>> = new Map();
  
  constructor(namespace: string) {
    this.storage = storageApi.getStorage({ namespace });
  }
  
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return this.storage.get(key, defaultValue);
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    await this.storage.set(key, value);
    this.notifyObservers(key, value);
  }
  
  observe<T>(key: string, callback: (value: T) => void) {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set());
    }
    
    this.observers.get(key)!.add(callback);
    
    // Initial notification
    this.get<T>(key).then(value => {
      if (value !== undefined) {
        callback(value);
      }
    });
    
    // Return unsubscribe function
    return () => {
      const observers = this.observers.get(key);
      if (observers) {
        observers.delete(callback);
      }
    };
  }
  
  private notifyObservers(key: string, value: any) {
    const observers = this.observers.get(key);
    if (observers) {
      for (const callback of observers) {
        callback(value);
      }
    }
  }
}
```

### Singleton Pattern

Ensure consistent access to storage instances:

```typescript
// src/api/storage/instances.ts
import storageApi from './storageApi';

// Singleton instances for common storage namespaces
export const appSettings = storageApi.getStorage({
  namespace: 'app-settings',
  defaults: {
    theme: 'light',
    fontSize: 16,
    notifications: true
  }
});

export const userPreferences = storageApi.getStorage({
  namespace: 'user-preferences'
});

export const appData = storageApi.getStorage({
  namespace: 'app-data'
});
```

## Offline-First Considerations

When building web applications with the Storage API, consider these offline-first patterns:

1. **Cache network responses** in the Storage API
2. **Queue operations** when offline for later synchronization
3. **Implement conflict resolution** for data synchronized after being offline
4. **Provide feedback** to users about online/offline status

Example of a network caching pattern:

```typescript
async function fetchWithCache(url, namespace = 'api-cache') {
  const storage = storageApi.getStorage({ namespace });
  const cacheKey = `url:${url}`;
  
  try {
    // Try to fetch fresh data
    const response = await fetch(url);
    const data = await response.json();
    
    // Update cache
    await storage.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    // If offline, try to use cached data
    const cached = await storage.get(cacheKey);
    
    if (cached) {
      return cached.data;
    }
    
    // No cached data available
    throw new Error('Cannot fetch data and no cache available');
  }
}
```

## Conclusion

The Web Storage API provides a robust solution for data persistence in your web application. By using localforage, it offers a consistent API with good cross-browser compatibility and handles the complexities of browser storage for you.

Key advantages of this design include:

1. **Promise-based API**: Modern async/await compatibility
2. **Type Safety**: Full TypeScript support
3. **React Integration**: Easy-to-use hooks
4. **Extensibility**: Higher-level abstractions like Database
5. **Fallback Support**: Works across all modern browsers

When implementing your application's data persistence needs, leverage the Storage API to ensure a seamless experience for your users, even when offline.
