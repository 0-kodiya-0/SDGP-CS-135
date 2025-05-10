import storageApi from '../storage';
import { FileSystemAPI } from './types';
import { FileManager } from './fileManager';
import { MemoryFileSystemProvider } from './providers/memory';
import { IndexedDBFileSystemProvider } from './providers/indexedDB';

/**
 * Export the main FileSystemAPI instance
 */
const fileSystemApi: FileSystemAPI = new FileManager({
    memoryProvider: new MemoryFileSystemProvider(),
    persistenceProvider: new IndexedDBFileSystemProvider(storageApi)
});

export default fileSystemApi;
export * from './types';
export { FileManager } from './fileManager';
export { MemoryFileSystemProvider } from './providers/memory';
export { IndexedDBFileSystemProvider } from './providers/indexedDB';