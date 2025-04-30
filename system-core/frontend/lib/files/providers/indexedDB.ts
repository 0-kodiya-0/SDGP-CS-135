import { FileMetadata, FileEntry, FileReadOptions, PersistenceProvider } from '../types';
import { StorageApi } from '../../storage';
import { StorageType } from '../../storage/types';
import { filesLogger } from '../../logger';

// Get the IndexedDB provider logger
const indexedDbLogger = filesLogger.extend('indexeddb');

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
        indexedDbLogger('Initializing IndexedDBFileSystemProvider');
        this.storageApi = storageApi;

        // Initialize storage providers
        indexedDbLogger('Creating metadata storage namespace: %s', METADATA_STORAGE_NAMESPACE);
        this.metadataStorage = this.storageApi.getStorage({
            namespace: METADATA_STORAGE_NAMESPACE,
            type: StorageType.INDEXEDDB
        });

        indexedDbLogger('Creating files storage namespace: %s', FILES_STORAGE_NAMESPACE);
        this.filesStorage = this.storageApi.getStorage({
            namespace: FILES_STORAGE_NAMESPACE,
            type: StorageType.INDEXEDDB
        });
        
        indexedDbLogger('IndexedDBFileSystemProvider initialized successfully');
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
        indexedDbLogger('Reading file as ArrayBuffer: %s', file.name);
        return new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    indexedDbLogger('Successfully read file as ArrayBuffer: %s (%d bytes)', 
                                  file.name, reader.result.byteLength);
                    resolve(reader.result);
                } else {
                    indexedDbLogger('Failed to read file as ArrayBuffer: %s', file.name);
                    reject(new Error('Failed to read file as ArrayBuffer'));
                }
            };

            reader.onerror = () => {
                indexedDbLogger('Error reading file: %s', file.name);
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
                indexedDbLogger('Storing File object in IndexedDB: %s (%s, %d bytes)', 
                              file.name, file.type, file.size);
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
                    indexedDbLogger('Missing name when storing ArrayBuffer content');
                    throw new Error('Filename is required when storing ArrayBuffer content');
                }

                indexedDbLogger('Storing ArrayBuffer in IndexedDB: %s (%s, %d bytes)', 
                              metadata.name, metadata.type || 'unknown', file.byteLength);
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
            indexedDbLogger('Storing file content in IndexedDB: %s', fileId);
            await this.filesStorage.set(fileId, Array.from(new Uint8Array(content)));

            // Store metadata
            indexedDbLogger('Storing file metadata in IndexedDB: %s', fileId);
            await this.metadataStorage.set(fileId, fileMetadata);

            indexedDbLogger('File stored in IndexedDB with ID: %s', fileId);
            return fileMetadata;
        } catch (error) {
            indexedDbLogger('Error storing file in IndexedDB: %o', error);
            throw new Error('Failed to store file in IndexedDB');
        }
    }

    /**
     * Reads a file from IndexedDB by ID
     * @param fileId The file ID to read
     * @returns Promise resolving to the file entry
     */
    async readFile(fileId: string): Promise<FileEntry> {
        indexedDbLogger('Reading file from IndexedDB: %s', fileId);
        try {
            // Get metadata from storage
            const metadata = await this.metadataStorage.get<FileMetadata>(fileId);

            if (!metadata) {
                indexedDbLogger('File metadata not found in IndexedDB: %s', fileId);
                throw new Error(`File metadata with ID ${fileId} not found in IndexedDB`);
            }

            // Get file content from storage
            const contentArray = await this.filesStorage.get<number[]>(fileId);

            if (!contentArray) {
                indexedDbLogger('File content not found in IndexedDB: %s', fileId);
                throw new Error(`File content with ID ${fileId} not found in IndexedDB`);
            }

            // Convert array back to ArrayBuffer
            const content = new Uint8Array(contentArray).buffer;
            
            indexedDbLogger('Successfully read file from IndexedDB: %s (%s, %d bytes)', 
                          fileId, metadata.name, metadata.size);
            return { metadata, content };
        } catch (error) {
            indexedDbLogger('Error reading file from IndexedDB: %s, %o', fileId, error);
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
        indexedDbLogger('Reading file as text: %s (encoding: %s)', fileId, encoding);
        
        const fileEntry = await this.readFile(fileId);

        try {
            const text = new TextDecoder(encoding).decode(fileEntry.content);
            indexedDbLogger('Successfully read file as text: %s (%d characters)', 
                          fileId, text.length);
            return text;
        } catch (error) {
            indexedDbLogger('Error decoding file as text: %s, %o', fileId, error);
            throw new Error(`Failed to decode file as text with encoding ${encoding}`);
        }
    }

    /**
     * Deletes a file from IndexedDB by ID
     * @param fileId The file ID to delete
     * @returns Promise resolving once the file is deleted
     */
    async deleteFile(fileId: string): Promise<void> {
        indexedDbLogger('Deleting file from IndexedDB: %s', fileId);
        try {
            // Delete content
            await this.filesStorage.delete(fileId);
            indexedDbLogger('Deleted file content: %s', fileId);

            // Delete metadata
            await this.metadataStorage.delete(fileId);
            indexedDbLogger('Deleted file metadata: %s', fileId);
            
            indexedDbLogger('File successfully deleted from IndexedDB: %s', fileId);
        } catch (error) {
            indexedDbLogger('Error deleting file from IndexedDB: %s, %o', fileId, error);
            throw new Error(`Failed to delete file with ID ${fileId} from IndexedDB`);
        }
    }

    /**
     * Lists all files in IndexedDB
     * @returns Promise resolving to an array of file metadata
     */
    async listFiles(): Promise<FileMetadata[]> {
        indexedDbLogger('Listing all files in IndexedDB');
        try {
            // Get all persisted file IDs
            const fileIds = await this.metadataStorage.keys();
            indexedDbLogger('Found %d file IDs in IndexedDB', fileIds.length);

            // Get metadata for each file
            const metadataPromises = fileIds.map(fileId =>
                this.metadataStorage.get<FileMetadata>(fileId)
            );

            const metadataResults = await Promise.all(metadataPromises);

            // Filter out any null values
            const files = metadataResults.filter((metadata): metadata is FileMetadata => !!metadata);
            indexedDbLogger('Retrieved metadata for %d files', files.length);
            return files;
        } catch (error) {
            indexedDbLogger('Error listing files from IndexedDB: %o', error);
            throw new Error('Failed to list files from IndexedDB');
        }
    }

    /**
     * Checks if a file exists in IndexedDB
     * @param fileId The file ID to check
     * @returns Promise resolving to a boolean indicating if the file exists
     */
    async hasFile(fileId: string): Promise<boolean> {
        indexedDbLogger('Checking if file exists in IndexedDB: %s', fileId);
        try {
            const metadata = await this.metadataStorage.get<FileMetadata>(fileId);
            const exists = !!metadata;
            indexedDbLogger('File %s exists in IndexedDB: %s', fileId, exists);
            return exists;
        } catch (error) {
            indexedDbLogger('Error checking if file exists in IndexedDB: %s, %o', fileId, error);
            return false;
        }
    }

    async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
        indexedDbLogger('Updating metadata for file: %s', fileId);
        try {
            // Get existing metadata
            const existingMetadata = await this.metadataStorage.get<FileMetadata>(fileId);

            if (!existingMetadata) {
                indexedDbLogger('File not found for metadata update: %s', fileId);
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
            indexedDbLogger('Metadata updated for file: %s', fileId);

            return updatedMetadata;
        } catch (error) {
            indexedDbLogger('Error updating file metadata in IndexedDB: %s, %o', fileId, error);
            throw new Error(`Failed to update metadata for file with ID ${fileId}`);
        }
    }

    /**
     * Clears all files from IndexedDB
     * @returns Promise resolving once all files are cleared
     */
    async clearAll(): Promise<void> {
        indexedDbLogger('Clearing all files from IndexedDB');
        try {
            await Promise.all([
                this.filesStorage.clear(),
                this.metadataStorage.clear()
            ]);
            indexedDbLogger('Successfully cleared all files from IndexedDB');
        } catch (error) {
            indexedDbLogger('Error clearing files from IndexedDB: %o', error);
            throw new Error('Failed to clear files from IndexedDB');
        }
    }

    /**
     * Check if a file is persisted in IndexedDB
     * @param fileId ID of the file to check
     * @returns Promise resolving to a boolean indicating if the file is persisted
     */
    async isFilePersisted(fileId: string): Promise<boolean> {
        indexedDbLogger('Checking if file is persisted in IndexedDB: %s', fileId);
        const isPersisted = await this.hasFile(fileId);
        indexedDbLogger('File %s is persisted in IndexedDB: %s', fileId, isPersisted);
        return isPersisted;
    }
}