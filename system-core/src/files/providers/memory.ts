import { FileMetadata, FileEntry, FileReadOptions, MemoryProvider } from '../types';

/**
 * Implements an in-memory file system provider for temporary file storage
 */
export class MemoryFileSystemProvider implements MemoryProvider {
    readonly name = 'memory';
    private files: Map<string, FileEntry> = new Map<string, FileEntry>();

    /**
     * Generates a unique ID for a file
     * @returns A unique ID string
     */
    private generateUniqueId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Creates file metadata from a File object
     * @param file The file object
     * @param id Optional ID override
     * @returns The file metadata
     */
    private createFileMetadata(file: File, id?: string): FileMetadata {
        return {
            id: id || this.generateUniqueId(),
            name: file.name,
            size: file.size,
            type: file.type || this.getTypeFromName(file.name),
            lastModified: file.lastModified || Date.now(),
            createdAt: Date.now()
        };
    }

    /**
     * Creates file metadata from file content
     * @param name The filename
     * @param content The file content as ArrayBuffer
     * @param type The MIME type
     * @param id Optional ID override
     * @returns The file metadata
     */
    private createFileMetadataFromContent(
        name: string,
        content: ArrayBuffer,
        type: string,
        id?: string
    ): FileMetadata {
        return {
            id: id || this.generateUniqueId(),
            name: name,
            size: content.byteLength,
            type: type || this.getTypeFromName(name),
            lastModified: Date.now(),
            createdAt: Date.now()
        };
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
     * Stores a file in memory
     * @param file The file or content to store
     * @param metadata Optional metadata to associate with the file
     * @returns Promise resolving to the file metadata
     */
    async storeFile(file: File | ArrayBuffer, metadata?: Partial<FileMetadata>): Promise<FileMetadata> {
        try {
            let fileMetadata: FileMetadata;
            let content: ArrayBuffer;

            if (file instanceof File) {
                content = await this.readFileAsArrayBuffer(file);
                fileMetadata = this.createFileMetadata(file);
            } else {
                // If direct ArrayBuffer, require metadata with at least name and type
                if (!metadata || !metadata.name) {
                    throw new Error('Filename is required when storing ArrayBuffer content');
                }

                content = file;
                const type = metadata.type || this.getTypeFromName(metadata.name);

                fileMetadata = this.createFileMetadataFromContent(
                    metadata.name,
                    content,
                    type,
                    metadata.id
                );
            }

            // Apply any additional metadata passed in
            if (metadata) {
                fileMetadata = { ...fileMetadata, ...metadata, size: content.byteLength };
            }

            this.files.set(fileMetadata.id, {
                metadata: fileMetadata,
                content
            });

            return fileMetadata;
        } catch (error) {
            console.error('Error storing file:', error);
            throw new Error('Failed to store file in memory');
        }
    }

    /**
     * Reads a file from memory by ID
     * @param fileId The file ID to read
     * @returns Promise resolving to the file entry
     */
    async readFile(fileId: string): Promise<FileEntry> {
        const fileEntry = this.files.get(fileId);

        if (!fileEntry) {
            throw new Error(`File with ID ${fileId} not found in memory`);
        }

        return fileEntry;
    }

    /**
     * Reads a file from memory as text
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
     * Deletes a file from memory by ID
     * @param fileId The file ID to delete
     * @returns Promise resolving once the file is deleted
     */
    async deleteFile(fileId: string): Promise<void> {
        if (!this.files.has(fileId)) {
            throw new Error(`File with ID ${fileId} not found in memory`);
        }

        this.files.delete(fileId);
    }

    /**
     * Lists all files in memory
     * @returns Promise resolving to an array of file metadata
     */
    async listFiles(): Promise<FileMetadata[]> {
        return Array.from(this.files.values()).map(file => file.metadata);
    }

    /**
     * Checks if a file exists in memory
     * @param fileId The file ID to check
     * @returns Promise resolving to a boolean indicating if the file exists
     */
    async hasFile(fileId: string): Promise<boolean> {
        return this.files.has(fileId);
    }

    /**
     * Updates a file's metadata
     * @param fileId The file ID to update
     * @param metadata The new metadata
     * @returns Promise resolving to the updated metadata
     */
    async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
        const fileEntry = this.files.get(fileId);

        if (!fileEntry) {
            throw new Error(`File with ID ${fileId} not found in memory`);
        }

        const updatedMetadata = {
            ...fileEntry.metadata,
            ...metadata,
            lastModified: Date.now()
        };

        fileEntry.metadata = updatedMetadata;
        this.files.set(fileId, fileEntry);

        return updatedMetadata;
    }

    /**
     * Clears all files from memory
     * @returns Promise resolving once all files are cleared
     */
    async clearAll(): Promise<void> {
        this.files.clear();
    }
}