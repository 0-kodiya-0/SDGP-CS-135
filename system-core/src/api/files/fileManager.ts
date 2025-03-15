import {
    FileSystemAPI,
    FileMetadata,
    FileEntry,
    FileReadOptions,
    FileSystemProviders,
    MemoryProvider,
    PersistenceProvider
} from './types';
import { filesLogger } from '../logger';

/**
 * Main File Manager implementation of the FileSystemAPI
 * Coordinates between memory and persistence providers
 */
export class FileManager implements FileSystemAPI {
    private memoryProvider: MemoryProvider;
    private persistenceProvider: PersistenceProvider;
    private objectUrls: Map<string, string> = new Map<string, string>();

    constructor(providers: FileSystemProviders) {
        filesLogger('Creating FileManager instance');
        this.memoryProvider = providers.memoryProvider;
        this.persistenceProvider = providers.persistenceProvider;
        filesLogger('Initialized with providers: memory=%s, persistence=%s',
            this.memoryProvider.name, this.persistenceProvider.name);
    }

    /**
     * Store a file in memory
     * @param file File object to store
     * @returns Promise resolving to the file metadata
     */
    async storeFile(file: File): Promise<FileMetadata> {
        filesLogger('Storing file: %s (%d bytes, type: %s)', file.name, file.size, file.type);
        const metadata = await this.memoryProvider.storeFile(file);
        filesLogger('File stored successfully with ID: %s', metadata.id);
        return metadata;
    }

    /**
     * Store file content directly
     * @param name Filename
     * @param content File content as ArrayBuffer
     * @param type MIME type
     * @returns Promise resolving to the file metadata
     */
    async storeFileContent(
        name: string,
        content: ArrayBuffer,
        type: string
    ): Promise<FileMetadata> {
        filesLogger('Storing file content: %s (%d bytes, type: %s)', name, content.byteLength, type);
        const metadata = await this.memoryProvider.storeFile(content, { name, type });
        filesLogger('File content stored successfully with ID: %s', metadata.id);
        return metadata;
    }

    /**
     * Read a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving to the file entry
     */
    async readFile(fileId: string): Promise<FileEntry> {
        filesLogger('Reading file: %s', fileId);
        try {
            // First try to read from memory
            filesLogger('Attempting to read from memory: %s', fileId);
            const fileEntry = await this.memoryProvider.readFile(fileId);
            filesLogger('File %s read successfully from memory', fileId);
            return fileEntry;
        } catch (error) {
            filesLogger('File not found in memory: %s, attempting persistence', fileId);

            // If not in memory, try to load from persistent storage
            try {
                // Check if the file exists in persistence
                const exists = await this.persistenceProvider.hasFile(fileId);
                filesLogger('File exists in persistence? %s', exists);

                if (exists) {
                    // Load from persistence
                    filesLogger('Loading from persistence: %s', fileId);
                    const fileEntry = await this.persistenceProvider.readFile(fileId);

                    // Also store in memory for faster future access
                    filesLogger('Caching file in memory for future access: %s', fileId);
                    await this.memoryProvider.storeFile(
                        fileEntry.content,
                        fileEntry.metadata
                    );

                    filesLogger('File %s read successfully from persistence', fileId);
                    return fileEntry;
                }
            } catch (persistenceError) {
                // If persistence also fails, throw the original error
                filesLogger('Error reading from persistence: %o', persistenceError);
            }

            // If we get here, the file wasn't found in memory or persistence
            filesLogger('File not found in memory or persistence: %s', fileId);
            throw error;
        }
    }

    /**
     * Read file content as text
     * @param fileId The unique file ID
     * @param options Reading options
     * @returns Promise resolving to the text content
     */
    async readFileAsText(fileId: string, options?: FileReadOptions): Promise<string> {
        filesLogger('Reading file as text: %s, options: %o', fileId, options);
        try {
            // First try to read from memory
            filesLogger('Attempting to read text from memory: %s', fileId);
            const text = await this.memoryProvider.readFileAsText(fileId, options);
            filesLogger('File text read successfully from memory: %s', fileId);
            return text;
        } catch (error) {
            filesLogger('File text not in memory: %s, attempting persistence', fileId);

            // If not in memory, try to load from persistent storage
            try {
                // Check if the file exists in persistence
                const exists = await this.persistenceProvider.hasFile(fileId);
                filesLogger('File exists in persistence? %s', exists);

                if (exists) {
                    // Load the file to memory first
                    filesLogger('Loading from persistence: %s', fileId);
                    const fileEntry = await this.persistenceProvider.readFile(fileId);

                    // Store in memory for faster future access
                    filesLogger('Caching file in memory for future access: %s', fileId);
                    await this.memoryProvider.storeFile(
                        fileEntry.content,
                        fileEntry.metadata
                    );

                    // Then read as text from memory
                    filesLogger('Reading cached file as text: %s', fileId);
                    const text = await this.memoryProvider.readFileAsText(fileId, options);
                    filesLogger('File text read successfully after caching: %s', fileId);
                    return text;
                }
            } catch (persistenceError) {
                // If persistence also fails, throw the original error
                filesLogger('Error reading from persistence: %o', persistenceError);
            }

            // If we get here, the file wasn't found in memory or persistence
            filesLogger('File not found in memory or persistence: %s', fileId);
            throw error;
        }
    }

    /**
     * Delete a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving once the file is deleted
     */
    async deleteFile(fileId: string): Promise<void> {
        filesLogger('Deleting file: %s', fileId);

        const memoryPromise = this.memoryProvider.hasFile(fileId)
            .then(exists => {
                if (exists) {
                    filesLogger('Deleting from memory: %s', fileId);
                    return this.memoryProvider.deleteFile(fileId);
                } else {
                    filesLogger('File not in memory: %s', fileId);
                    return Promise.resolve();
                }
            })
            .catch(error => {
                filesLogger('Error deleting from memory: %o', error);
                console.error(`Error deleting from memory:`, error);
            });

        const persistencePromise = this.persistenceProvider.hasFile(fileId)
            .then(exists => {
                if (exists) {
                    filesLogger('Deleting from persistence: %s', fileId);
                    return this.persistenceProvider.deleteFile(fileId);
                } else {
                    filesLogger('File not in persistence: %s', fileId);
                    return Promise.resolve();
                }
            })
            .catch(error => {
                filesLogger('Error deleting from persistence: %o', error);
                console.error(`Error deleting from persistence:`, error);
            });

        await Promise.all([memoryPromise, persistencePromise]);
        filesLogger('File deletion complete: %s', fileId);
    }

    /**
     * List all files in memory
     * @returns Promise resolving to an array of file metadata
     */
    async listFiles(): Promise<FileMetadata[]> {
        filesLogger('Listing all files in memory');
        const files = await this.memoryProvider.listFiles();
        filesLogger('Found %d files in memory', files.length);
        return files;
    }

    /**
     * Persist a file to storage
     * @param fileId ID of the file to persist
     * @returns Promise resolving to the file metadata
     */
    async persistFile(fileId: string): Promise<FileMetadata> {
        filesLogger('Persisting file: %s', fileId);
        try {
            // Read the file from memory
            filesLogger('Reading file from memory: %s', fileId);
            const fileEntry = await this.memoryProvider.readFile(fileId);

            // Store in persistence provider
            filesLogger('Storing in persistence provider: %s', fileId);
            const metadata = await this.persistenceProvider.storeFile(
                fileEntry.content,
                fileEntry.metadata
            );

            filesLogger('File persisted successfully: %s', fileId);
            return metadata;
        } catch (error) {
            filesLogger('Error persisting file %s: %o', fileId, error);
            throw new Error(`Failed to persist file with ID ${fileId}`);
        }
    }

    /**
     * Persist all files in memory to storage
     * @returns Promise resolving to an array of persisted file metadata
     */
    async persistAllFiles(): Promise<FileMetadata[]> {
        filesLogger('Persisting all files in memory');
        const files = await this.memoryProvider.listFiles();
        filesLogger('Found %d files to persist', files.length);

        const persistPromises = files.map(file => {
            filesLogger('Persisting file: %s', file.id);
            return this.persistFile(file.id);
        });

        const results = await Promise.all(persistPromises);
        filesLogger('Persisted %d files successfully', results.length);
        return results;
    }

    /**
     * Check if a file is persisted
     * @param fileId ID of the file to check
     * @returns Promise resolving to a boolean indicating if the file is persisted
     */
    async isFilePersisted(fileId: string): Promise<boolean> {
        filesLogger('Checking if file is persisted: %s', fileId);
        const isPersisted = await this.persistenceProvider.isFilePersisted(fileId);
        filesLogger('File %s is persisted: %s', fileId, isPersisted);
        return isPersisted;
    }

    /**
     * Load a persisted file into memory
     * @param fileId ID of the file to load
     * @returns Promise resolving to the file metadata
     */
    async loadPersistedFile(fileId: string): Promise<FileMetadata> {
        filesLogger('Loading persisted file into memory: %s', fileId);
        try {
            // Check if file exists in persistence
            const exists = await this.persistenceProvider.hasFile(fileId);
            filesLogger('File exists in persistence? %s', exists);

            if (!exists) {
                filesLogger('File not found in persistence: %s', fileId);
                throw new Error(`File with ID ${fileId} not found in persistence storage`);
            }

            // Read from persistence
            filesLogger('Reading from persistence: %s', fileId);
            const fileEntry = await this.persistenceProvider.readFile(fileId);

            // Store in memory
            filesLogger('Storing in memory: %s', fileId);
            const metadata = await this.memoryProvider.storeFile(
                fileEntry.content,
                fileEntry.metadata
            );

            filesLogger('File loaded into memory successfully: %s', fileId);
            return metadata;
        } catch (error) {
            filesLogger('Error loading persisted file %s: %o', fileId, error);
            throw new Error(`Failed to load persisted file with ID ${fileId}`);
        }
    }

    /**
     * Load all persisted files into memory
     * @returns Promise resolving to an array of loaded file metadata
     */
    async loadAllPersistedFiles(): Promise<FileMetadata[]> {
        filesLogger('Loading all persisted files into memory');
        try {
            // List all persisted files
            const fileList = await this.persistenceProvider.listFiles();
            filesLogger('Found %d persisted files to load', fileList.length);

            // Load each file into memory
            const loadPromises = fileList.map(fileMetadata => {
                filesLogger('Loading persisted file: %s', fileMetadata.id);
                return this.loadPersistedFile(fileMetadata.id);
            });

            const results = await Promise.all(loadPromises);
            filesLogger('Successfully loaded %d persisted files into memory', results.length);
            return results;
        } catch (error) {
            filesLogger('Error loading all persisted files: %o', error);
            throw new Error('Failed to load all persisted files');
        }
    }

    /**
     * Delete a persisted file
     * @param fileId ID of the file to delete
     * @returns Promise resolving once the file is deleted
     */
    async deletePersistedFile(fileId: string): Promise<void> {
        filesLogger('Deleting persisted file: %s', fileId);
        await this.persistenceProvider.deleteFile(fileId);
        filesLogger('Persisted file deleted successfully: %s', fileId);
    }

    /**
     * List all persisted files
     * @returns Promise resolving to an array of file metadata
     */
    async listPersistedFiles(): Promise<FileMetadata[]> {
        filesLogger('Listing all persisted files');
        const files = await this.persistenceProvider.listFiles();
        filesLogger('Found %d persisted files', files.length);
        return files;
    }

    /**
     * Download a file to the user's device
     * @param fileId ID of the file to download
     * @returns Promise resolving once the download starts
     */
    async downloadFile(fileId: string): Promise<void> {
        filesLogger('Downloading file: %s', fileId);
        try {
            // Get file from memory or persistent storage
            const fileEntry = await this.readFile(fileId);
            filesLogger('File read successful, preparing for download: %s', fileId);

            // Create a blob from the file content
            const blob = new Blob([fileEntry.content], { type: fileEntry.metadata.type });

            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileEntry.metadata.name;

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                filesLogger('Download cleanup completed for file: %s', fileId);
            }, 0);

            filesLogger('Download initiated for file: %s', fileId);
        } catch (error) {
            filesLogger('Error downloading file %s: %o', fileId, error);
            throw new Error(`Failed to download file with ID ${fileId}`);
        }
    }

    /**
     * Export a file as a data URL
     * @param fileId ID of the file to export
     * @returns Promise resolving to a data URL
     */
    async exportAsDataURL(fileId: string): Promise<string> {
        filesLogger('Exporting file as data URL: %s', fileId);
        try {
            // Get file from memory or persistent storage
            const fileEntry = await this.readFile(fileId);
            filesLogger('File read successful, converting to data URL: %s', fileId);

            // Create a blob from the file content
            const blob = new Blob([fileEntry.content], { type: fileEntry.metadata.type });

            // Convert blob to data URL
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        filesLogger('Successfully converted file to data URL: %s', fileId);
                        resolve(reader.result);
                    } else {
                        filesLogger('Failed to convert file to data URL: %s', fileId);
                        reject(new Error('Failed to convert file to data URL'));
                    }
                };

                reader.onerror = () => {
                    filesLogger('Error reading file as data URL: %s', fileId);
                    reject(new Error('Error reading file as data URL'));
                };

                reader.readAsDataURL(blob);
            });
        } catch (error) {
            filesLogger('Error exporting as data URL: %s, %o', fileId, error);
            throw new Error(`Failed to export file with ID ${fileId} as data URL`);
        }
    }

    /**
     * Export a file as an Object URL
     * @param fileId ID of the file to export
     * @returns Promise resolving to an Object URL (must be revoked when done)
     */
    async exportAsObjectURL(fileId: string): Promise<string> {
        filesLogger('Exporting file as object URL: %s', fileId);
        try {
            // Get file from memory or persistent storage
            const fileEntry = await this.readFile(fileId);
            filesLogger('File read successful, creating object URL: %s', fileId);

            // Create a blob from the file content
            const blob = new Blob([fileEntry.content], { type: fileEntry.metadata.type });

            // Create object URL and store for cleanup
            const url = URL.createObjectURL(blob);
            this.objectUrls.set(fileId, url);

            filesLogger('Successfully created object URL for file: %s', fileId);
            return url;
        } catch (error) {
            filesLogger('Error exporting as object URL: %s, %o', fileId, error);
            throw new Error(`Failed to export file with ID ${fileId} as object URL`);
        }
    }

    /**
     * Release an Object URL
     * @param url The Object URL to release
     */
    revokeObjectURL(url: string): void {
        filesLogger('Revoking object URL');
        URL.revokeObjectURL(url);

        // Remove from tracked URLs
        for (const [fileId, storedUrl] of this.objectUrls.entries()) {
            if (storedUrl === url) {
                filesLogger('Removed object URL for file: %s', fileId);
                this.objectUrls.delete(fileId);
                break;
            }
        }
    }

    /**
     * Import files from the user's file system
     * @param acceptedTypes Array of accepted MIME types or file extensions
     * @param multiple Whether to allow multiple file selection
     * @returns Promise resolving to an array of file metadata
     */
    async importFiles(acceptedTypes?: string[], multiple = false): Promise<FileMetadata[]> {
        filesLogger('Importing files. Types: %o, Multiple: %s', acceptedTypes, multiple);
        return new Promise<FileMetadata[]>((resolve, reject) => {
            // Create a file input element
            const input = document.createElement('input');
            input.type = 'file';

            // Set accepted file types if specified
            if (acceptedTypes && acceptedTypes.length > 0) {
                input.accept = acceptedTypes.join(',');
                filesLogger('Setting accepted file types: %s', input.accept);
            }

            // Set multiple attribute if needed
            if (multiple) {
                input.multiple = true;
                filesLogger('Enabling multiple file selection');
            }

            // Set up change handler
            input.onchange = async () => {
                try {
                    if (!input.files || input.files.length === 0) {
                        filesLogger('No files selected during import');
                        resolve([]);
                        return;
                    }

                    filesLogger('%d files selected for import', input.files.length);

                    // Store each selected file
                    const filePromises: Promise<FileMetadata>[] = [];

                    for (let i = 0; i < input.files.length; i++) {
                        const file = input.files[i];
                        filesLogger('Importing file: %s (%s, %d bytes)', file.name, file.type, file.size);
                        filePromises.push(this.storeFile(file));
                    }

                    const metadata = await Promise.all(filePromises);
                    filesLogger('Successfully imported %d files', metadata.length);
                    resolve(metadata);
                } catch (error) {
                    filesLogger('Error importing files: %o', error);
                    reject(error);
                } finally {
                    // Clean up
                    input.remove();
                }
            };

            // Handle cancellation
            input.onabort = () => {
                filesLogger('File import was aborted by user');
                resolve([]);
                input.remove();
            };

            // Trigger file selection dialog
            document.body.appendChild(input);
            input.click();
            input.style.display = 'none';
            filesLogger('File selection dialog opened');
        });
    }
}