# File System API

A comprehensive file system API for web applications that provides flexible storage options, persistence, and browser-compatible file operations.

## Features

- **Provider-Based Architecture**: Choose from multiple storage backends
- **In-Memory File Storage**: Store and manage files in browser memory
- **IndexedDB Persistence**: Save files to IndexedDB for longer-term storage
- **File Import/Export**: Import files from and export to the user's device
- **Rich Metadata**: Track file properties including name, size, and type
- **TypeScript Support**: Fully typed API for improved developer experience
- **React Integration**: Ready-to-use React hooks for file operations
- **Content Transformation**: Convert file content between different formats
- **Download Support**: Save files back to the user's device

## Architecture

The File System API uses a provider-based architecture:

- **FileSystemAPI**: Main API interface for client code
- **FileManager**: Coordinates operations between providers
- **Providers**: Pluggable storage backends
  - **MemoryFileSystemProvider**: Fast in-memory storage
  - **IndexedDBFileSystemProvider**: Persistent storage using IndexedDB

## Basic Usage

```typescript
import fileSystemApi from './api/fileSystem';

// Import a file from the user's device
const importFiles = async () => {
  const files = await fileSystemApi.importFiles(['image/*', '.pdf'], false);
  console.log('Imported file:', files[0]);
  return files;
};

// Read a file from any provider (memory or persistence)
const readFile = async (fileId) => {
  const fileEntry = await fileSystemApi.readFile(fileId);
  console.log('File name:', fileEntry.metadata.name);
  console.log('File size:', fileEntry.metadata.size);
  
  // For text files, you can read as text
  if (fileEntry.metadata.type.startsWith('text/')) {
    const text = await fileSystemApi.readFileAsText(fileId);
    console.log('Text content:', text);
  }
  
  return fileEntry;
};

// Save a file for persistence between sessions
const persistFile = async (fileId) => {
  const metadata = await fileSystemApi.persistFile(fileId);
  console.log('File persisted:', metadata.name);
  return metadata;
};

// Download a file to the user's device
const downloadFile = async (fileId) => {
  await fileSystemApi.downloadFile(fileId);
  console.log('File download initiated');
};

// Delete a file from all providers
const deleteFile = async (fileId) => {
  await fileSystemApi.deleteFile(fileId);
  console.log('File deleted');
};
```

## React Integration

### Using Hooks

```tsx
import React, { useState, useEffect } from 'react';
import { useFileList, useFile, useFileImport } from './api/fileSystem/hooks';

function FileViewer({ fileId }) {
  const {
    metadata,
    isLoading,
    error,
    isPersisted,
    persistFile,
    deleteFile,
    downloadFile,
    getDataUrl
  } = useFile(fileId);
  
  const [dataUrl, setDataUrl] = useState(null);
  
  useEffect(() => {
    if (metadata && metadata.type.startsWith('image/')) {
      getDataUrl().then(setDataUrl);
    }
  }, [metadata, getDataUrl]);
  
  if (isLoading) return <div>Loading file...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!metadata) return <div>File not found</div>;
  
  return (
    <div>
      <h2>{metadata.name}</h2>
      <p>Size: {formatFileSize(metadata.size)}</p>
      <p>Type: {metadata.type}</p>
      
      {dataUrl && (
        <div>
          <img src={dataUrl} alt={metadata.name} style={{ maxWidth: '100%' }} />
        </div>
      )}
      
      <div className="actions">
        <button onClick={downloadFile}>Download</button>
        {!isPersisted ? (
          <button onClick={persistFile}>Save to Browser Storage</button>
        ) : (
          <span className="badge">Saved</span>
        )}
        <button onClick={deleteFile}>Delete</button>
      </div>
    </div>
  );
}

function FileExplorer() {
  const { files, isLoading, error, refreshFiles } = useFileList();
  const { importFiles, isImporting } = useFileImport();
  const [selectedFileId, setSelectedFileId] = useState(null);
  
  const handleImport = async () => {
    const importedFiles = await importFiles(['*'], true);
    refreshFiles();
  };
  
  if (isLoading) return <div>Loading files...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div className="file-explorer">
      <div className="toolbar">
        <button onClick={handleImport} disabled={isImporting}>
          {isImporting ? 'Importing...' : 'Import Files'}
        </button>
        <button onClick={refreshFiles}>Refresh</button>
      </div>
      
      <div className="file-list">
        {files.length === 0 ? (
          <p>No files available. Import some files to get started.</p>
        ) : (
          <ul>
            {files.map(file => (
              <li 
                key={file.id} 
                className={selectedFileId === file.id ? 'selected' : ''}
                onClick={() => setSelectedFileId(file.id)}
              >
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {selectedFileId && (
        <FileViewer fileId={selectedFileId} />
      )}
    </div>
  );
}
```

## Provider Architecture

### Memory Provider

The MemoryFileSystemProvider stores files in memory for fast access:

```typescript
// Using memory provider directly (though usually accessed through FileManager)
import { MemoryFileSystemProvider } from './api/fileSystem';

const memoryProvider = new MemoryFileSystemProvider();

// Store a file
const file = new File(['Hello, world!'], 'hello.txt', { type: 'text/plain' });
const metadata = await memoryProvider.storeFile(file);

// Read a file
const fileEntry = await memoryProvider.readFile(metadata.id);
```

### IndexedDB Provider

The IndexedDBFileSystemProvider stores files in IndexedDB for persistence:

```typescript
// Using IndexedDB provider directly (though usually accessed through FileManager)
import { IndexedDBFileSystemProvider } from './api/fileSystem';
import storageApi from './api/storage';

const indexedDBProvider = new IndexedDBFileSystemProvider(storageApi);

// Store a file
const file = new File(['Hello, world!'], 'hello.txt', { type: 'text/plain' });
const metadata = await indexedDBProvider.storeFile(file);

// Read a file
const fileEntry = await indexedDBProvider.readFile(metadata.id);
```

### Creating Custom Providers

You can extend the provider system by implementing the FileSystemProvider interface:

```typescript
import { FileSystemProvider, FileMetadata, FileEntry } from './api/fileSystem/types';

class CustomProvider implements FileSystemProvider {
  readonly name = 'custom-provider';
  
  // Implement required methods
  async storeFile(file: File | ArrayBuffer, metadata?: Partial<FileMetadata>): Promise<FileMetadata> {
    // Custom implementation
  }
  
  async readFile(fileId: string): Promise<FileEntry> {
    // Custom implementation
  }
  
  // ... implement other methods
}

// Create a custom FileManager with your provider
import { FileManager } from './api/fileSystem';

const customFileSystem = new FileManager({
  memoryProvider: new MemoryFileSystemProvider(),
  persistenceProvider: new CustomProvider()
});
```

## API Reference

### FileManager

The FileManager coordinates operations between memory and persistence providers:

#### `storeFile(file: File): Promise<FileMetadata>`

Stores a File object in memory.

#### `storeFileContent(name: string, content: ArrayBuffer, type: string): Promise<FileMetadata>`

Stores raw file content in memory.

#### `readFile(fileId: string): Promise<FileEntry>`

Reads a file from memory first, falling back to persistence if not found.

#### `readFileAsText(fileId: string, options?: FileReadOptions): Promise<string>`

Reads a file as text with optional encoding.

#### `deleteFile(fileId: string): Promise<void>`

Deletes a file from both memory and persistence if present.

#### `listFiles(): Promise<FileMetadata[]>`

Lists all files currently in memory.

#### `persistFile(fileId: string): Promise<FileMetadata>`

Persists a file to the persistence provider.

#### `persistAllFiles(): Promise<FileMetadata[]>`

Persists all in-memory files to the persistence provider.

#### `isFilePersisted(fileId: string): Promise<boolean>`

Checks if a file is already persisted.

#### `loadPersistedFile(fileId: string): Promise<FileMetadata>`

Loads a persisted file into memory.

#### `loadAllPersistedFiles(): Promise<FileMetadata[]>`

Loads all persisted files into memory.

#### `deletePersistedFile(fileId: string): Promise<void>`

Deletes a file from the persistence provider.

#### `listPersistedFiles(): Promise<FileMetadata[]>`

Lists all files in the persistence provider.

#### `downloadFile(fileId: string): Promise<void>`

Initiates a download of the file to the user's device.

#### `exportAsDataURL(fileId: string): Promise<string>`

Exports a file as a data URL (useful for images).

#### `exportAsObjectURL(fileId: string): Promise<string>`

Exports a file as an object URL (must be revoked when done).

#### `revokeObjectURL(url: string): void`

Revokes an object URL to free up memory.

#### `importFiles(acceptedTypes?: string[], multiple?: boolean): Promise<FileMetadata[]>`

Opens a file picker dialog for the user to select files to import.

### Provider Interface

All providers implement this common interface:

#### `storeFile(file: File | ArrayBuffer, metadata?: Partial<FileMetadata>): Promise<FileMetadata>`

Stores a file or raw content in the provider.

#### `readFile(fileId: string): Promise<FileEntry>`

Reads a file from the provider.

#### `readFileAsText(fileId: string, options?: FileReadOptions): Promise<string>`

Reads a file as text from the provider.

#### `deleteFile(fileId: string): Promise<void>`

Deletes a file from the provider.

#### `listFiles(): Promise<FileMetadata[]>`

Lists all files in the provider.

#### `hasFile(fileId: string): Promise<boolean>`

Checks if a file exists in the provider.

#### `updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata>`

Updates a file's metadata in the provider.

#### `clearAll(): Promise<void>`

Clears all files from the provider.

## Models and Types

### FileMetadata

```typescript
interface FileMetadata {
  id: string;           // Unique identifier for the file
  name: string;         // Original file name
  size: number;         // File size in bytes
  type: string;         // MIME type
  lastModified: number; // Last modified timestamp
  createdAt: number;    // Creation timestamp
}
```

### FileEntry

```typescript
interface FileEntry {
  metadata: FileMetadata;
  content: ArrayBuffer;
}
```

### FileReadOptions

```typescript
interface FileReadOptions {
  encoding?: string;    // Encoding to use for text files (e.g., 'utf-8')
}
```

## React Hooks

### `useFileList(refreshInterval?: number)`

Hook for listing files in memory.

```typescript
const { files, isLoading, error, refreshFiles } = useFileList();
```

### `usePersistedFileList(refreshInterval?: number)`

Hook for listing persisted files.

```typescript
const { files, isLoading, error, refreshFiles } = usePersistedFileList();
```

### `useFile(fileId: string)`

Hook to work with a single file.

```typescript
const {
  metadata,
  content,
  isLoading,
  error,
  isPersisted,
  loadFile,
  readAsText,
  persistFile,
  deleteFile,
  downloadFile,
  getDataUrl,
  getObjectUrl
} = useFile(fileId);
```

### `useFileImport()`

Hook for importing files.

```typescript
const { importFiles, isImporting, importedFiles, error } = useFileImport();
```

### `useFilePersistence()`

Hook to manage persisted file operations.

```typescript
const {
  isLoading,
  error,
  persistFile,
  persistAllFiles,
  loadPersistedFile,
  loadAllPersistedFiles,
  deletePersistedFile
} = useFilePersistence();
```

## Best Practices

### Working with Large Files

For large files, consider:

1. Streaming the data when possible
2. Using `exportAsObjectURL` instead of `exportAsDataURL` for better performance
3. Persisting files immediately after import to avoid memory pressure

### Security Considerations

1. Always validate files before processing
2. Consider content security implications when displaying user-imported content
3. Sanitize text content when appropriate

### Memory Management

1. Revoke object URLs when no longer needed
2. Delete files from memory when no longer needed
3. Be cautious with very large files in memory

### Performance Optimization

1. Persist files in a background process
2. Load files on demand rather than all at once
3. Use object URLs for media files instead of data URLs

## Storage Limitations

Be aware of storage limitations in browsers:

| Storage Type | Typical Limit | Notes |
|--------------|---------------|-------|
| Memory       | Limited by available system RAM | Can cause performance issues with large files |
| IndexedDB    | 50-100MB      | Varies by browser/device |

## Examples

### Creating a Text File

```typescript
async function createTextFile(name, content) {
  // Convert text to ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // Store the file
  const metadata = await fileSystemApi.storeFileContent(
    name,
    data.buffer,
    'text/plain'
  );
  
  return metadata;
}

// Usage
const fileMetadata = await createTextFile('notes.txt', 'Hello, world!');
console.log(`Created file: ${fileMetadata.name} (${fileMetadata.id})`);
```

### Working with Images

```typescript
async function displayImage(fileId) {
  try {
    // Get the file metadata
    const { metadata } = await fileSystemApi.readFile(fileId);
    
    if (!metadata.type.startsWith('image/')) {
      throw new Error('Not an image file');
    }
    
    // Generate a data URL for display
    const dataUrl = await fileSystemApi.exportAsDataURL(fileId);
    
    // Create an image element
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = metadata.name;
    
    // Add to the document
    document.getElementById('image-container').appendChild(img);
  } catch (error) {
    console.error('Error displaying image:', error);
  }
}
```

### Listing and Filtering Files

```typescript
async function listImageFiles() {
  // Get all files
  const files = await fileSystemApi.listFiles();
  
  // Filter to images only
  const imageFiles = files.filter(file => 
    file.type.startsWith('image/')
  );
  
  return imageFiles;
}
```

### Persisting and Synchronizing Files

```typescript
async function synchronizeFiles() {
  // Get all files in memory
  const memoryFiles = await fileSystemApi.listFiles();
  
  // Get all persisted files
  const persistedFiles = await fileSystemApi.listPersistedFiles();
  
  // Find files that need to be persisted
  const unpersisted = memoryFiles.filter(memFile => 
    !persistedFiles.some(persFile => persFile.id === memFile.id)
  );
  
  // Persist new files
  for (const file of unpersisted) {
    await fileSystemApi.persistFile(file.id);
    console.log(`Persisted: ${file.name}`);
  }
  
  // Load any persisted files not in memory
  const notLoaded = persistedFiles.filter(persFile => 
    !memoryFiles.some(memFile => memFile.id === persFile.id)
  );
  
  for (const file of notLoaded) {
    await fileSystemApi.loadPersistedFile(file.id);
    console.log(`Loaded from storage: ${file.name}`);
  }
  
  console.log('Files synchronized');
}
```

## Integration with Other APIs

### Using with Canvas

```typescript
async function captureCanvasAsFile(canvasElement, fileName = 'canvas.png') {
  // Convert canvas to blob
  const blob = await new Promise<Blob>(resolve => {
    canvasElement.toBlob(blob => resolve(blob), 'image/png');
  });
  
  // Convert blob to file
  const file = new File([blob], fileName, { type: 'image/png' });
  
  // Store the file
  return fileSystemApi.storeFile(file);
}
```

### Using with Fetch API

```typescript
async function downloadAndStoreFile(url, fileName) {
  // Fetch the file
  const response = await fetch(url);
  const blob = await response.blob();
  
  // Create file object
  const file = new File(
    [blob], 
    fileName || url.split('/').pop() || 'downloaded-file',
    { type: blob.type }
  );
  
  // Store the file
  return fileSystemApi.storeFile(file);
}
```

## Conclusion

The File System API provides a comprehensive solution for managing files in web applications. With its provider-based architecture, it offers flexibility, performance, and ease of use for a wide range of file management scenarios.