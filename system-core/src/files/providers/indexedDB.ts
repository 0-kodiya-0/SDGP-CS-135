import { FileMetadata, FileEntry, FileReadOptions, PersistenceProvider } from '../types';
import { StorageApi } from '../../storage';
import { StorageType } from '../../storage/types';

/**
 * Storage namespace for persisted files
 */
const FILES_STORAGE_NAMESPACE = 'file-system-files';

/**
 * Storage namespace for file metadata
 */
const METADATA_STORAGE_NAMESPACE = 'file-system-metadata';

/**
 * Implements a file system provider using IndexedDB for persistence
 */
export class IndexedDBFileSystemProvider implements PersistenceProvider {
    readonly name = 'indexeddb';
    private storageApi: StorageApi;
    private metadataStorage: ReturnType<StorageApi['getStorage']>;
    private filesStorage: ReturnType<StorageApi['getStorage']>;

    constructor(storageApi: StorageApi) {
        this.storageApi = storageApi;

        // Initialize storage providers
        this.metadataStorage = this.storageApi.getStorage({
            namespace: METADATA_STORAGE_NAMESPACE,
            type: StorageType.INDEXEDDB
        });

        this.filesStorage = this.storageApi.getStorage({
            namespace: FILES_STORAGE_NAMESPACE,
            type: StorageType.INDEXEDDB
        });
    }

    /**
     * Generates a unique ID for a file
     * @returns A unique ID string
     */
    private generateUniqueId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Attempts to determine MIME type from filename
     * @param name The filename
     * @returns The guessed MIME type or generic binary type
     */
    private getTypeFromName(name: string): string {
        const extension = name.split('.').pop()?.toLowerCase();
        const mimeTypeMap: Record<string, string> = {
            'txt': 'text/plain',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'text/javascript',
            'ts': 'text/typescript',
            'json': 'application/json',
            'xml': 'application/xml',
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'zip': 'application/zip',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };

        return extension && mimeTypeMap[extension] ? mimeTypeMap[extension] : 'application/octet-stream';
    }

    /**
     * Reads a File object as an ArrayBuffer
     * @param file The file to read
     * @returns Promise resolving to an ArrayBuffer
     */
    private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to read file as ArrayBuffer'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Stores a file in IndexedDB
     * @param file The file or content to store
     * @param metadata Optional metadata to associate with the file
     * @returns Promise resolving to the file metadata
     */
    async storeFile(file: File | ArrayBuffer, metadata?: Partial<FileMetadata>): Promise<FileMetadata> {
        try {
            let fileMetadata: FileMetadata;
            let content: ArrayBuffer;

            // Generate a file ID if not provided
            const fileId = metadata?.id || this.generateUniqueId();

            if (file instanceof File) {
                content = await this.readFileAsArrayBuffer(file);
                fileMetadata = {
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    type: file.type || this.getTypeFromName(file.name),
                    lastModified: file.lastModified || Date.now(),
                    createdAt: Date.now()
                };
            } else {
                // If direct ArrayBuffer, require metadata with at least name
                if (!metadata || !metadata.name) {
                    throw new Error('Filename is required when storing ArrayBuffer content');
                }

                content = file;
                const type = metadata.type || this.getTypeFromName(metadata.name);

                fileMetadata = {
                    id: fileId,
                    name: metadata.name,
                    size: content.byteLength,
                    type,
                    lastModified: Date.now(),
                    createdAt: Date.now()
                };
            }

            // Apply any additional metadata passed in
            if (metadata) {
                fileMetadata = { ...fileMetadata, ...metadata, size: content.byteLength };
            }

            // Store file content as Uint8Array (more compatible with IndexedDB)
            await this.filesStorage.set(fileId, Array.from(new Uint8Array(content)));

            // Store metadata
            await this.metadataStorage.set(fileId, fileMetadata);

            return fileMetadata;
        } catch (error) {
            console.error('Error storing file in IndexedDB:', error);
            throw new Error('Failed to store file in IndexedDB');
        }
    }

    /**
     * Reads a file from IndexedDB by ID
     * @param fileId The file ID to read
     * @returns Promise resolving to the file entry
     */
    async readFile(fileId: string): Promise<FileEntry> {
        try {
            // Get metadata from storage
            const metadata = await this.metadataStorage.get<FileMetadata>(fileId);

            if (!metadata) {
                throw new Error(`File metadata with ID ${fileId} not found in IndexedDB`);
            }

            // Get file content from storage
            const contentArray = await this.filesStorage.get<number[]>(fileId);

            if (!contentArray) {
                throw new Error(`File content with ID ${fileId} not found in IndexedDB`);
            }

            // Convert array back to ArrayBuffer
            const content = new Uint8Array(contentArray).buffer;

            return { metadata, content };
        } catch (error) {
            console.error('Error reading file from IndexedDB:', error);
            throw new Error(`Failed to read file with ID ${fileId} from IndexedDB`);
        }
    }

    /**
     * Reads a file from IndexedDB as text
     * @param fileId The file ID to read
     * @param options Reading options
     * @returns Promise resolving to the text content
     */
    async readFileAsText(fileId: string, options?: FileReadOptions): Promise<string> {
        const encoding = options?.encoding || 'utf-8';
        const fileEntry = await this.readFile(fileId);

        try {
            return new TextDecoder(encoding).decode(fileEntry.content);
        } catch (error) {
            console.error('Error decoding file as text:', error);
            throw new Error(`Failed to decode file as text with encoding ${encoding}`);
        }
    }

    /**
     * Deletes a file from IndexedDB by ID
     * @param fileId The file ID to delete
     * @returns Promise resolving once the file is deleted
     */
    async deleteFile(fileId: string): Promise<void> {
        try {
            // Delete content
            await this.filesStorage.delete(fileId);

            // Delete metadata
            await this.metadataStorage.delete(fileId);
        } catch (error) {
            console.error('Error deleting file from IndexedDB:', error);
            throw new Error(`Failed to delete file with ID ${fileId} from IndexedDB`);
        }
    }

    /**
     * Lists all files in IndexedDB
     * @returns Promise resolving to an array of file metadata
     */
    async listFiles(): Promise<FileMetadata[]> {
        try {
            // Get all persisted file IDs
            const fileIds = await this.metadataStorage.keys();

            // Get metadata for each file
            const metadataPromises = fileIds.map(fileId =>
                this.metadataStorage.get<FileMetadata>(fileId)
            );

            const metadataResults = await Promise.all(metadataPromises);

            // Filter out any null values
            return metadataResults.filter((metadata): metadata is FileMetadata => !!metadata);
        } catch (error) {
            console.error('Error listing files from IndexedDB:', error);
            throw new Error('Failed to list files from IndexedDB');
        }
    }

    /**
     * Checks if a file exists in IndexedDB
     * @param fileId The file ID to check
     * @returns Promise resolving to a boolean indicating if the file exists
     */
    async hasFile(fileId: string): Promise<boolean> {
        try {
            const metadata = await this.metadataStorage.get<FileMetadata>(fileId);
            return !!metadata;
        } catch {
            return false;
        }
    }

    /**
     * Updates a file's metadata in IndexedDB
     * @param fileId The file ID to update
     * @param metadata The new metadata
     * @returns Promise resolving to the updated metadata
     */
    async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
        try {
            // Get existing metadata
            const existingMetadata = await this.metadataStorage.get<FileMetadata>(fileId);

            if (!existingMetadata) {
                throw new Error(`File with ID ${fileId} not found in IndexedDB`);
            }

            // Update metadata
            const updatedMetadata = {
                ...existingMetadata,
                ...metadata,
                lastModified: Date.now()
            };

            // Store updated metadata
            await this.metadataStorage.set(fileId, updatedMetadata);

            return updatedMetadata;
        } catch (error) {
            console.error('Error updating file metadata in IndexedDB:', error);
            throw new Error(`Failed to update metadata for file with ID ${fileId}`);
        }
    }

    /**
     * Clears all files from IndexedDB
     * @returns Promise resolving once all files are cleared
     */
    async clearAll(): Promise<void> {
        try {
            await Promise.all([
                this.filesStorage.clear(),
                this.metadataStorage.clear()
            ]);
        } catch (error) {
            console.error('Error clearing files from IndexedDB:', error);
            throw new Error('Failed to clear files from IndexedDB');
        }
    }

    /**
     * Check if a file is persisted in IndexedDB
     * @param fileId ID of the file to check
     * @returns Promise resolving to a boolean indicating if the file is persisted
     */
    async isFilePersisted(fileId: string): Promise<boolean> {
        return this.hasFile(fileId);
    }
}