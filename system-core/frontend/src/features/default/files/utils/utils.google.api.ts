import { DriveFile } from "../types/types.google.api";

/**
 * Type guard to check if a file is a folder
 */
export function isFolder(file: DriveFile): boolean {
    // Add logging to debug folder detection
    console.log(`Checking if file is folder: ${file.name}, mimeType: ${file.mimeType}`);
    
    // Google Drive folder MIME type
    const folderMimeTypes = [
        'application/vnd.google-apps.folder',
        // Add any other possible folder mime types your API might return
    ];
    
    return folderMimeTypes.includes(file.mimeType);
}

/**
 * Type guard to check if a file is a Google Docs type
 */
export function isGoogleDocsFile(file: DriveFile): boolean {
    return file.mimeType.startsWith('application/vnd.google-apps.');
}

/**
 * Get file extension from mimeType
 */
export function getFileExtension(file: DriveFile): string {
    if (isFolder(file)) return '';
    
    // Map common mimeTypes to extensions
    const mimeMap: Record<string, string> = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'text/plain': '.txt',
        'text/csv': '.csv',
        'text/html': '.html',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'application/vnd.google-apps.document': '.gdoc',
        'application/vnd.google-apps.spreadsheet': '.gsheet',
        'application/vnd.google-apps.presentation': '.gslides',
        'application/vnd.google-apps.form': '.gform',
        'application/vnd.google-apps.drawing': '.gdraw',
    };
    
    return mimeMap[file.mimeType] || '';
}

/**
 * Get human-readable file size
 */
export function formatFileSize(file: DriveFile): string {
    if (!file.size) return '';
    
    const bytes = parseInt(file.size);
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
    
    return `${formattedSize} ${sizes[i]}`;
}