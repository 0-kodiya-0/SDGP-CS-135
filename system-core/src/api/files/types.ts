// src/api/fileSystem/types.ts

/**
 * File metadata structure
 */
export interface FileMetadata {
    id: string;           // Unique identifier for the file
    name: string;         // Original file name
    size: number;         // File size in bytes
    type: string;         // MIME type
    lastModified: number; // Last modified timestamp
    createdAt: number;    // Creation timestamp
}

/**
 * File entry that includes both metadata and content
 */
export interface FileEntry {
    metadata: FileMetadata;
    content: ArrayBuffer;
}

/**
 * File read options
 */
export interface FileReadOptions {
    encoding?: string;    // Encoding to use for text files (e.g., 'utf-8')
}

/**
 * File System Provider interface - implemented by different storage mechanisms
 */
export interface FileSystemProvider {
    /**
     * The name of the provider
     */
    readonly name: string;

    /**
     * Store a file
     * @param file File object or content to store
     * @param metadata Optional metadata to associate with the file
     * @returns Promise resolving to the file metadata
     */
    storeFile(file: File | ArrayBuffer, metadata?: Partial<FileMetadata>): Promise<FileMetadata>;

    /**
     * Read a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving to the file entry
     */
    readFile(fileId: string): Promise<FileEntry>;

    /**
     * Read file content as text
     * @param fileId The unique file ID
     * @param options Reading options
     * @returns Promise resolving to the text content
     */
    readFileAsText(fileId: string, options?: FileReadOptions): Promise<string>;

    /**
     * Delete a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving once the file is deleted
     */
    deleteFile(fileId: string): Promise<void>;

    /**
     * List all files
     * @returns Promise resolving to an array of file metadata
     */
    listFiles(): Promise<FileMetadata[]>;

    /**
     * Check if a file exists
     * @param fileId The file ID to check
     * @returns Promise resolving to a boolean indicating if the file exists
     */
    hasFile(fileId: string): Promise<boolean>;

    /**
     * Update a file's metadata
     * @param fileId The file ID to update
     * @param metadata The new metadata
     * @returns Promise resolving to the updated metadata
     */
    updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata>;

    /**
     * Clear all files from this provider
     * @returns Promise resolving once all files are cleared
     */
    clearAll(): Promise<void>;
}

/**
 * Memory file system provider interface - used for temporary in-memory storage
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MemoryProvider extends FileSystemProvider {
    // Memory-specific methods can be added here
}

/**
 * Persistence provider interface - used for long-term storage
 */
export interface PersistenceProvider extends FileSystemProvider {
    /**
     * Check if a file is persisted in this provider
     * @param fileId ID of the file to check
     * @returns Promise resolving to a boolean indicating if the file is persisted
     */
    isFilePersisted(fileId: string): Promise<boolean>;
}

/**
 * File system export operations
 */
export interface FileSystemExport {
    /**
     * Download a file to the user's device
     * @param fileId ID of the file to download
     * @returns Promise resolving once the download starts
     */
    downloadFile(fileId: string): Promise<void>;

    /**
     * Export a file as a data URL
     * @param fileId ID of the file to export
     * @returns Promise resolving to a data URL
     */
    exportAsDataURL(fileId: string): Promise<string>;

    /**
     * Export a file as an Object URL
     * @param fileId ID of the file to export
     * @returns Promise resolving to an Object URL (must be revoked when done)
     */
    exportAsObjectURL(fileId: string): Promise<string>;

    /**
     * Release an Object URL
     * @param url The Object URL to release
     */
    revokeObjectURL(url: string): void;
}

/**
 * Combined FileSystemAPI interface
 */
export interface FileSystemAPI extends FileSystemExport {
    /**
     * Store a file in memory
     * @param file File object to store
     * @returns Promise resolving to the file metadata
     */
    storeFile(file: File): Promise<FileMetadata>;

    /**
     * Store file content directly
     * @param name Filename
     * @param content File content as ArrayBuffer
     * @param type MIME type
     * @returns Promise resolving to the file metadata
     */
    storeFileContent(name: string, content: ArrayBuffer, type: string): Promise<FileMetadata>;

    /**
     * Read a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving to the file entry
     */
    readFile(fileId: string): Promise<FileEntry>;

    /**
     * Read file content as text
     * @param fileId The unique file ID
     * @param options Reading options
     * @returns Promise resolving to the text content
     */
    readFileAsText(fileId: string, options?: FileReadOptions): Promise<string>;

    /**
     * Delete a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving once the file is deleted
     */
    deleteFile(fileId: string): Promise<void>;

    /**
     * List all files in memory
     * @returns Promise resolving to an array of file metadata
     */
    listFiles(): Promise<FileMetadata[]>;

    /**
     * Persist a file to storage
     * @param fileId ID of the file to persist
     * @returns Promise resolving to the file metadata
     */
    persistFile(fileId: string): Promise<FileMetadata>;

    /**
     * Persist all files in memory to storage
     * @returns Promise resolving to an array of persisted file metadata
     */
    persistAllFiles(): Promise<FileMetadata[]>;

    /**
     * Check if a file is persisted
     * @param fileId ID of the file to check
     * @returns Promise resolving to a boolean indicating if the file is persisted
     */
    isFilePersisted(fileId: string): Promise<boolean>;

    /**
     * Load a persisted file into memory
     * @param fileId ID of the file to load
     * @returns Promise resolving to the file metadata
     */
    loadPersistedFile(fileId: string): Promise<FileMetadata>;

    /**
     * Load all persisted files into memory
     * @returns Promise resolving to an array of loaded file metadata
     */
    loadAllPersistedFiles(): Promise<FileMetadata[]>;

    /**
     * Delete a persisted file
     * @param fileId ID of the file to delete
     * @returns Promise resolving once the file is deleted
     */
    deletePersistedFile(fileId: string): Promise<void>;

    /**
     * List all persisted files
     * @returns Promise resolving to an array of file metadata
     */
    listPersistedFiles(): Promise<FileMetadata[]>;

    /**
     * Import files from the user's file system
     * @param acceptedTypes Array of accepted MIME types or file extensions
     * @param multiple Whether to allow multiple file selection
     * @returns Promise resolving to an array of file metadata
     */
    importFiles(acceptedTypes?: string[], multiple?: boolean): Promise<FileMetadata[]>;
}

// Provider Factory configuration
export interface FileSystemProviders {
    memoryProvider: MemoryProvider;
    persistenceProvider: PersistenceProvider;
}