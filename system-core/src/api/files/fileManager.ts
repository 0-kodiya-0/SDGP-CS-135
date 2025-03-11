import {
    FileSystemAPI,
    FileMetadata,
    FileEntry,
    FileReadOptions,
    FileSystemProviders,
    MemoryProvider,
    PersistenceProvider
} from './types';

/**
 * Main File Manager implementation of the FileSystemAPI
 * Coordinates between memory and persistence providers
 */
export class FileManager implements FileSystemAPI {
    private memoryProvider: MemoryProvider;
    private persistenceProvider: PersistenceProvider;
    private objectUrls: Map<string, string> = new Map<string, string>();

    constructor(providers: FileSystemProviders) {
        this.memoryProvider = providers.memoryProvider;
        this.persistenceProvider = providers.persistenceProvider;
    }

    /**
     * Store a file in memory
     * @param file File object to store
     * @returns Promise resolving to the file metadata
     */
    async storeFile(file: File): Promise<FileMetadata> {
        return this.memoryProvider.storeFile(file);
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
        return this.memoryProvider.storeFile(content, { name, type });
    }

    /**
     * Read a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving to the file entry
     */
    async readFile(fileId: string): Promise<FileEntry> {
        try {
            // First try to read from memory
            return await this.memoryProvider.readFile(fileId);
        } catch (error) {
            // If not in memory, try to load from persistent storage
            try {
                // Check if the file exists in persistence
                if (await this.persistenceProvider.hasFile(fileId)) {
                    // Load from persistence
                    const fileEntry = await this.persistenceProvider.readFile(fileId);

                    // Also store in memory for faster future access
                    await this.memoryProvider.storeFile(
                        fileEntry.content,
                        fileEntry.metadata
                    );

                    return fileEntry;
                }
            } catch (persistenceError) {
                // If persistence also fails, throw the original error
                console.error('Error reading from persistence:', persistenceError);
            }

            // If we get here, the file wasn't found in memory or persistence
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
        try {
            // First try to read from memory
            return await this.memoryProvider.readFileAsText(fileId, options);
        } catch (error) {
            // If not in memory, try to load from persistent storage
            try {
                // Check if the file exists in persistence
                if (await this.persistenceProvider.hasFile(fileId)) {
                    // Load the file to memory first
                    const fileEntry = await this.persistenceProvider.readFile(fileId);

                    // Store in memory for faster future access
                    await this.memoryProvider.storeFile(
                        fileEntry.content,
                        fileEntry.metadata
                    );

                    // Then read as text from memory
                    return await this.memoryProvider.readFileAsText(fileId, options);
                }
            } catch (persistenceError) {
                // If persistence also fails, throw the original error
                console.error('Error reading from persistence:', persistenceError);
            }

            // If we get here, the file wasn't found in memory or persistence
            throw error;
        }
    }

    /**
     * Delete a file by ID
     * @param fileId The unique file ID
     * @returns Promise resolving once the file is deleted
     */
    async deleteFile(fileId: string): Promise<void> {
        const memoryPromise = this.memoryProvider.hasFile(fileId)
            .then(exists => exists ? this.memoryProvider.deleteFile(fileId) : Promise.resolve())
            .catch(error => console.error('Error deleting from memory:', error));

        const persistencePromise = this.persistenceProvider.hasFile(fileId)
            .then(exists => exists ? this.persistenceProvider.deleteFile(fileId) : Promise.resolve())
            .catch(error => console.error('Error deleting from persistence:', error));

        await Promise.all([memoryPromise, persistencePromise]);
    }

    /**
     * List all files in memory
     * @returns Promise resolving to an array of file metadata
     */
    async listFiles(): Promise<FileMetadata[]> {
        return this.memoryProvider.listFiles();
    }

    /**
     * Persist a file to storage
     * @param fileId ID of the file to persist
     * @returns Promise resolving to the file metadata
     */
    async persistFile(fileId: string): Promise<FileMetadata> {
        try {
            // Read the file from memory
            const fileEntry = await this.memoryProvider.readFile(fileId);

            // Store in persistence provider
            return await this.persistenceProvider.storeFile(
                fileEntry.content,
                fileEntry.metadata
            );
        } catch (error) {
            console.error('Error persisting file:', error);
            throw new Error(`Failed to persist file with ID ${fileId}`);
        }
    }

    /**
     * Persist all files in memory to storage
     * @returns Promise resolving to an array of persisted file metadata
     */
    async persistAllFiles(): Promise<FileMetadata[]> {
        const files = await this.memoryProvider.listFiles();
        const persistPromises = files.map(file => this.persistFile(file.id));
        return Promise.all(persistPromises);
    }

    /**
     * Check if a file is persisted
     * @param fileId ID of the file to check
     * @returns Promise resolving to a boolean indicating if the file is persisted
     */
    async isFilePersisted(fileId: string): Promise<boolean> {
        return this.persistenceProvider.isFilePersisted(fileId);
    }

    /**
     * Load a persisted file into memory
     * @param fileId ID of the file to load
     * @returns Promise resolving to the file metadata
     */
    async loadPersistedFile(fileId: string): Promise<FileMetadata> {
        try {
            // Check if file exists in persistence
            if (!(await this.persistenceProvider.hasFile(fileId))) {
                throw new Error(`File with ID ${fileId} not found in persistence storage`);
            }

            // Read from persistence
            const fileEntry = await this.persistenceProvider.readFile(fileId);

            // Store in memory
            return await this.memoryProvider.storeFile(
                fileEntry.content,
                fileEntry.metadata
            );
        } catch (error) {
            console.error('Error loading persisted file:', error);
            throw new Error(`Failed to load persisted file with ID ${fileId}`);
        }
    }

    /**
     * Load all persisted files into memory
     * @returns Promise resolving to an array of loaded file metadata
     */
    async loadAllPersistedFiles(): Promise<FileMetadata[]> {
        try {
            // List all persisted files
            const fileList = await this.persistenceProvider.listFiles();

            // Load each file into memory
            const loadPromises = fileList.map(fileMetadata =>
                this.loadPersistedFile(fileMetadata.id)
            );

            return Promise.all(loadPromises);
        } catch (error) {
            console.error('Error loading all persisted files:', error);
            throw new Error('Failed to load all persisted files');
        }
    }

    /**
     * Delete a persisted file
     * @param fileId ID of the file to delete
     * @returns Promise resolving once the file is deleted
     */
    async deletePersistedFile(fileId: string): Promise<void> {
        await this.persistenceProvider.deleteFile(fileId);
    }

    /**
     * List all persisted files
     * @returns Promise resolving to an array of file metadata
     */
    async listPersistedFiles(): Promise<FileMetadata[]> {
        return this.persistenceProvider.listFiles();
    }

    /**
     * Download a file to the user's device
     * @param fileId ID of the file to download
     * @returns Promise resolving once the download starts
     */
    async downloadFile(fileId: string): Promise<void> {
        try {
            // Get file from memory or persistent storage
            const fileEntry = await this.readFile(fileId);

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
            }, 0);
        } catch (error) {
            console.error('Error downloading file:', error);
            throw new Error(`Failed to download file with ID ${fileId}`);
        }
    }

    /**
     * Export a file as a data URL
     * @param fileId ID of the file to export
     * @returns Promise resolving to a data URL
     */
    async exportAsDataURL(fileId: string): Promise<string> {
        try {
            // Get file from memory or persistent storage
            const fileEntry = await this.readFile(fileId);

            // Create a blob from the file content
            const blob = new Blob([fileEntry.content], { type: fileEntry.metadata.type });

            // Convert blob to data URL
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to convert file to data URL'));
                    }
                };

                reader.onerror = () => {
                    reject(new Error('Error reading file as data URL'));
                };

                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error exporting as data URL:', error);
            throw new Error(`Failed to export file with ID ${fileId} as data URL`);
        }
    }

    /**
     * Export a file as an Object URL
     * @param fileId ID of the file to export
     * @returns Promise resolving to an Object URL (must be revoked when done)
     */
    async exportAsObjectURL(fileId: string): Promise<string> {
        try {
            // Get file from memory or persistent storage
            const fileEntry = await this.readFile(fileId);

            // Create a blob from the file content
            const blob = new Blob([fileEntry.content], { type: fileEntry.metadata.type });

            // Create object URL and store for cleanup
            const url = URL.createObjectURL(blob);
            this.objectUrls.set(fileId, url);

            return url;
        } catch (error) {
            console.error('Error exporting as object URL:', error);
            throw new Error(`Failed to export file with ID ${fileId} as object URL`);
        }
    }

    /**
     * Release an Object URL
     * @param url The Object URL to release
     */
    revokeObjectURL(url: string): void {
        URL.revokeObjectURL(url);

        // Remove from tracked URLs
        for (const [fileId, storedUrl] of this.objectUrls.entries()) {
            if (storedUrl === url) {
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
        return new Promise<FileMetadata[]>((resolve, reject) => {
            // Create a file input element
            const input = document.createElement('input');
            input.type = 'file';

            // Set accepted file types if specified
            if (acceptedTypes && acceptedTypes.length > 0) {
                input.accept = acceptedTypes.join(',');
            }

            // Set multiple attribute if needed
            if (multiple) {
                input.multiple = true;
            }

            // Set up change handler
            input.onchange = async () => {
                try {
                    if (!input.files || input.files.length === 0) {
                        resolve([]);
                        return;
                    }

                    // Store each selected file
                    const filePromises: Promise<FileMetadata>[] = [];

                    for (let i = 0; i < input.files.length; i++) {
                        const file = input.files[i];
                        filePromises.push(this.storeFile(file));
                    }

                    const metadata = await Promise.all(filePromises);
                    resolve(metadata);
                } catch (error) {
                    reject(error);
                } finally {
                    // Clean up
                    input.remove();
                }
            };

            // Handle cancellation
            input.onabort = () => {
                resolve([]);
                input.remove();
            };

            // Trigger file selection dialog
            document.body.appendChild(input);
            input.click();
            input.style.display = 'none';
        });
    }
}