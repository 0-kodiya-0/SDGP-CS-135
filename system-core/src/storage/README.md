# Enhanced Storage API

A flexible, provider-based storage system for web applications that provides a unified interface for different storage backends.

## Features

- **Multiple Storage Providers**: Choose from IndexedDB, SessionStorage, or LocalForage
- **Consistent API**: Same interface regardless of the underlying storage mechanism
- **Type-Safe**: Full TypeScript support for all operations
- **Promise-Based**: Modern async/await compatible API
- **React Integration**: Easy-to-use React hooks
- **High-Level Abstractions**: Database wrapper for collections of objects
- **Automatic Fallbacks**: Auto-detection of best available storage mechanism

## Available Storage Providers

| Provider | Description | Best For | Persistence |
|----------|-------------|----------|-------------|
| **IndexedDB** | Native browser IndexedDB implementation | Large amounts of structured data | Persistent across sessions |
| **LocalForage** | Uses IndexedDB with fallbacks to WebSQL and localStorage | General purpose with broad compatibility | Persistent across sessions |
| **SessionStorage** | Browser's sessionStorage implementation | Temporary session data | Cleared when session ends |

## Basic Usage

```typescript
import storageApi from './api/storage';
import { StorageType } from './api/storage/types';

// Create or retrieve a storage provider
const userPrefs = storageApi.getStorage({
  namespace: 'user-preferences',
  type: StorageType.INDEXEDDB, // Explicitly choose IndexedDB
  defaults: {
    theme: 'light',
    fontSize: 16
  }
});

// Basic operations
async function storeUserPreferences() {
  // Store a value
  await userPrefs.set('theme', 'dark');
  
  // Retrieve a value (with type safety)
  const theme = await userPrefs.get<string>('theme');
  console.log('User theme:', theme); // 'dark'
  
  // Check if a key exists
  const hasFontSize = await userPrefs.has('fontSize');
  console.log('Has font size setting:', hasFontSize); // true
  
  // Delete a key
  await userPrefs.delete('temporarySetting');
  
  // Get all keys
  const allKeys = await userPrefs.keys();
  console.log('All settings:', allKeys); // ['theme', 'fontSize']
}
```

## Choosing a Provider

You can explicitly choose a storage provider or let the system automatically select the best available:

```typescript
// Explicitly choose IndexedDB
const dbStorage = storageApi.getStorage({
  namespace: 'app-data',
  type: StorageType.INDEXEDDB
});

// Explicitly choose SessionStorage
const sessionData = storageApi.getStorage({
  namespace: 'session-data',
  type: StorageType.SESSION
});

// Explicitly choose LocalForage
const compatStorage = storageApi.getStorage({
  namespace: 'compat-data',
  type: StorageType.LOCALFORAGE
});

// Auto-detect the best available (defaults to StorageType.AUTO)
const autoStorage = storageApi.getStorage({
  namespace: 'auto-detect-storage'
});
```

## Database Abstraction

The Storage API includes a higher-level Database abstraction for working with collections of objects:

```typescript
import { Database } from './api/storage/database';

interface User {
  id: string;
  name: string;
  email: string;
}

// Create a database for users
const userDb = new Database<User>('app-data', 'users');

// Add a user
await userDb.add({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com'
});

// Get all users
const users = await userDb.getAll();

// Get a specific user
const user = await userDb.getById('user-1');

// Update a user
await userDb.update('user-1', { name: 'John Smith' });

// Query users
const adminUsers = await userDb.query(user => 
  user.email.endsWith('@admin.com')
);

// Remove a user
await userDb.remove('user-1');
```

## React Integration

Use the `useStorage` hook to easily integrate with React components:

```tsx
import { useStorage } from './api/storage';
import { StorageType } from './api/storage/types';

function SettingsPanel() {
  const { 
    value: fontSize, 
    setValue: setFontSize,
    isLoading,
    error,
    remove,
    reset
  } = useStorage<number>(
    'fontSize',
    16,
    { 
      namespace: 'user-preferences',
      type: StorageType.INDEXEDDB
    }
  );

  if (isLoading) {
    return <div>Loading settings...</div>;
  }
  
  if (error) {
    return <div>Error loading settings: {error.message}</div>;
  }

  return (
    <div>
      <h2>Font Size Settings</h2>
      <div>Current font size: {fontSize}px</div>
      <button onClick={() => setFontSize(fontSize + 1)}>Increase</button>
      <button onClick={() => setFontSize(fontSize - 1)}>Decrease</button>
      <button onClick={reset}>Reset to Default</button>
      <button onClick={remove}>Remove Setting</button>
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
- `session-data`: Session-specific data

### Provider Selection

Choose the appropriate provider based on your needs:

- **IndexedDB**: For large amounts of structured data that needs to persist
- **SessionStorage**: For temporary data that should be cleared when the session ends
- **LocalForage**: For maximum compatibility when you're unsure about browser support

### Error Handling

Always implement proper error handling:

```typescript
try {
  await storage.set('important-data', data);
} catch (error) {
  console.error('Failed to save data:', error);
  // Show user-friendly error message
  notifyUser('Could not save your data. Please try again.');
}
```

### Type Safety

Always use TypeScript generics when retrieving data:

```typescript
// Good
const theme = await storage.get<string>('theme');

// Avoid
const theme = await storage.get('theme');
```

### Batch Operations

For multiple operations, process them in parallel:

```typescript
async function batchUpdate(updates: Record<string, any>) {
  const promises = Object.entries(updates).map(
    ([key, value]) => storage.set(key, value)
  );
  
  await Promise.all(promises);
}

// Usage
await batchUpdate({
  theme: 'dark',
  fontSize: 18,
  notifications: false
});
```

## Advanced Configuration

### LocalForage Provider Options

You can pass additional options to the LocalForage provider:

```typescript
const storage = storageApi.getStorage({
  namespace: 'custom-storage',
  type: StorageType.LOCALFORAGE,
  connectionOptions: {
    driver: [localforage.INDEXEDDB, localforage.WEBSQL],
    description: 'Custom storage instance',
    version: 1.0,
    size: 4980736, // Size in bytes (default is ~5MB)
    storeName: 'keyvaluepairs',
  }
});
```

### IndexedDB Provider Configuration

The IndexedDB provider includes options to customize its behavior:

```typescript
const storage = storageApi.getStorage({
  namespace: 'db-storage',
  type: StorageType.INDEXEDDB,
  connectionOptions: {
    version: 1, // Database version
    storeName: 'customStore', // Name of the object store
  }
});
```

## Storage Limitations

Be aware of storage limitations in browsers:

| Storage Type | Typical Limit | Notes |
|--------------|---------------|-------|
| IndexedDB    | 50-100MB      | Varies by browser/device |
| SessionStorage | 5-10MB      | Cleared when session ends |
| LocalStorage | 5-10MB        | Used as fallback by LocalForage |

## Contributing

Contributions are welcome! To add a new storage provider:

1. Implement the `StorageProvider` interface
2. Add the provider type to the `StorageType` enum
3. Update the factory method in `StorageApi`
4. Add tests for the new provider

## License

MIT