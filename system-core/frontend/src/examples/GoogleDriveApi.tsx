import React, { useState, useEffect, useCallback } from "react";
import {
    useDriveFiles,
    DriveFile,
    isFolder,
    formatFileSize,
    useDrivePermissions,
    Permission
} from "../features/default/files";
import { useAuth, useAccount } from "../features/default/user_account";

export const DriveFilesList: React.FC<{ accountId: string }> = ({ accountId }) => {
    const {
        files = [], // Default to empty array
        nextPageToken,
        loading,
        error,
        listFiles,
        deleteFile,
        getDownloadUrl
    } = useDriveFiles(accountId);

    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string, name: string }[]>([]);

    // Load files on component mount or when folder changes
    useEffect(() => {
        const loadFiles = async () => {
            console.log("Loading files for account:", accountId, "folder:", currentFolder || "root");
            try {
                // Build query to show files in current folder or root if no folder selected
                const query = currentFolder
                    ? `'${currentFolder}' in parents and trashed = false`
                    : "'root' in parents and trashed = false";

                const result = await listFiles({
                    q: query,
                    orderBy: 'folder,name',
                    maxResults: 100
                });

                console.log("Files loaded:", result?.files?.length || 0);
            } catch (err) {
                console.error('Error loading files:', err);
            }
        };

        if (accountId) {
            loadFiles();
        }
    }, [accountId, currentFolder, listFiles]);

    // Log files for debugging
    useEffect(() => {
        if (files && files.length > 0) {
            console.log("All files:", files);

            // Check if any folders exist in the data
            const folders = files.filter(file => isFolder(file));
            console.log("Folders found:", folders.length, folders);

            // Check if any regular files exist
            const regularFiles = files.filter(file => !isFolder(file));
            console.log("Regular files found:", regularFiles.length);

            // Log MIME types to see what's coming from the API
            const mimeTypes = [...new Set(files.map(file => file.mimeType))];
            console.log("Unique MIME types:", mimeTypes);
        }
    }, [files]);

    // Handle folder navigation
    const navigateToFolder = async (file: DriveFile) => {
        if (isFolder(file)) {
            console.log("Navigating to folder:", file.name, file.id);
            // Add current folder to breadcrumbs before navigating
            if (currentFolder) {
                const currentFolderItem = files.find(f => f.id === currentFolder);
                if (currentFolderItem) {
                    setBreadcrumbs([...breadcrumbs, {
                        id: currentFolder,
                        name: currentFolderItem.name
                    }]);
                }
            }

            setCurrentFolder(file.id);
        }
    };

    // Navigate to parent folder
    const navigateUp = () => {
        if (breadcrumbs.length > 0) {
            // Get the last breadcrumb
            const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];

            // Remove it from breadcrumbs
            setBreadcrumbs(breadcrumbs.slice(0, breadcrumbs.length - 1));

            // Set current folder to this breadcrumb
            setCurrentFolder(lastBreadcrumb.id);
        } else {
            // If no breadcrumbs, go to root
            setCurrentFolder(null);
        }
    };

    // Load more files (pagination)
    const loadMore = async () => {
        if (nextPageToken) {
            try {
                const query = currentFolder
                    ? `'${currentFolder}' in parents and trashed = false`
                    : "'root' in parents and trashed = false";

                await listFiles({
                    q: query,
                    pageToken: nextPageToken,
                    maxResults: 100
                });
            } catch (err) {
                console.error('Error loading more files:', err);
            }
        }
    };

    // Handle file deletion
    const handleDeleteFile = async (fileId: string) => {
        try {
            await deleteFile(fileId);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    };

    // Get file icon based on mimeType
    const getFileIcon = (file: DriveFile) => {
        if (isFolder(file)) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
            );
        }

        const mimeTypeIconMap: Record<string, React.ReactNode> = {
            'application/pdf': (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            ),
            // Other mime types...
        };

        return mimeTypeIconMap[file.mimeType] || (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Google Drive Files</h2>

            {/* Debugging info - remove in production */}
            <div className="text-xs mb-4 bg-gray-100 p-2 rounded-md">
                Account ID: {accountId} | Current Folder: {currentFolder || "root"} | Files Count: {files?.length || 0}
            </div>

            {/* Breadcrumbs navigation */}
            <div className="flex items-center flex-wrap mb-6 bg-gray-50 p-2 rounded-md text-sm">
                <button
                    onClick={() => { setCurrentFolder(null); setBreadcrumbs([]); }}
                    className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
                >
                    Root
                </button>

                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        <span className="mx-2 text-gray-400">/</span>
                        <button
                            onClick={() => {
                                setCurrentFolder(crumb.id);
                                setBreadcrumbs(breadcrumbs.slice(0, index));
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}

                {currentFolder && (
                    <button
                        onClick={navigateUp}
                        className="ml-auto flex items-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back
                    </button>
                )}
            </div>

            {/* Display error if any */}
            {error && (
                <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md">
                    Error: {error}
                </div>
            )}

            {/* Files table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Type</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                            <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {files.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    {loading ? 'Loading files...' : (currentFolder ? 'This folder is empty' : 'No files found')}
                                </td>
                            </tr>
                        ) : (
                            // Make sure to map over the files array safely
                            Array.isArray(files) && files.map(file => (
                                <tr key={file.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">{getFileIcon(file)}</td>
                                    <td className="py-3 px-4">
                                        {isFolder(file) ? (
                                            <button
                                                className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                                                onClick={() => navigateToFolder(file)}
                                            >
                                                {file.name}
                                            </button>
                                        ) : (
                                            <a
                                                href={file.webViewLink || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                            >
                                                {file.name}
                                            </a>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-500">{formatFileSize(file)}</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-500">
                                        {file.modifiedTime
                                            ? new Date(file.modifiedTime).toLocaleDateString()
                                            : ''}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            {!isFolder(file) && (
                                                <a
                                                    href={getDownloadUrl(file.id)}
                                                    download={file.name}
                                                    className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                                    title="Download"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDeleteFile(file.id)}
                                                className="text-red-600 hover:text-red-800 focus:outline-none"
                                                title="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {nextPageToken && (
                <div className="mt-6 text-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Component for uploading files to Google Drive
 */
export const DriveFileUploader: React.FC<{
    accountId: string;
    currentFolderId?: string;
    onUploadComplete?: () => void;
}> = ({ accountId, currentFolderId, onUploadComplete }) => {
    const { uploadFile, loading, error } = useDriveFiles(accountId);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            return;
        }

        try {
            // Create params object
            const params: any = {};

            // Add the current folder ID if provided
            if (currentFolderId) {
                params.parents = [currentFolderId];
            }

            // Upload the file
            await uploadFile(selectedFile, params);

            // Clear the selected file
            setSelectedFile(null);

            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Call the onUploadComplete callback if provided
            if (onUploadComplete) {
                onUploadComplete();
            }
        } catch (err) {
            console.error('Error uploading file:', err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Upload File</h3>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <input
                        type="file"
                        id="file-upload"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={loading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none"
                    />

                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                    >
                        {loading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>

                {selectedFile && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </div>
                )}

                {loading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Component for creating a new folder
 */
export const NewFolderCreator: React.FC<{
    accountId: string;
    currentFolderId?: string;
    onFolderCreated?: () => void;
}> = ({ accountId, currentFolderId, onFolderCreated }) => {
    const { createFolder, loading, error } = useDriveFiles(accountId);
    const [folderName, setFolderName] = useState<string>('');

    const handleCreateFolder = async () => {
        if (!folderName) {
            return;
        }

        try {
            const params: any = {
                name: folderName
            };

            // Add the current folder ID if provided
            if (currentFolderId) {
                params.parents = [currentFolderId];
            }

            await createFolder(params);

            // Clear the folder name
            setFolderName('');

            // Call the onFolderCreated callback if provided
            if (onFolderCreated) {
                onFolderCreated();
            }
        } catch (err) {
            console.error('Error creating folder:', err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Folder</h3>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Folder name"
                        disabled={loading}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />

                    <button
                        onClick={handleCreateFolder}
                        disabled={!folderName || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                    >
                        {loading ? 'Creating...' : 'Create Folder'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Component for sharing files and managing permissions
 */
export const FileSharing: React.FC<{
    accountId: string;
    fileId: string;
}> = ({ accountId, fileId }) => {
    const {
        permissions,
        loading,
        error,
        listPermissions,
        shareFile,
        deletePermission
    } = useDrivePermissions(accountId);

    const [email, setEmail] = useState<string>('');
    const [role, setRole] = useState<string>('reader');

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                await listPermissions(fileId);
            } catch (err) {
                console.error('Error loading permissions:', err);
            }
        };

        loadPermissions();
    }, [fileId, listPermissions]);

    const handleShareFile = async () => {
        if (!email) {
            return;
        }

        try {
            await shareFile(fileId, {
                role: role as any,
                type: 'user',
                emailAddress: email,
                sendNotificationEmail: true
            });

            // Clear the email
            setEmail('');
        } catch (err) {
            console.error('Error sharing file:', err);
        }
    };

    const handleDeletePermission = async (permissionId: string) => {
        try {
            await deletePermission(fileId, permissionId);
        } catch (err) {
            console.error('Error deleting permission:', err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Share File</h3>

            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            disabled={loading}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={loading}
                            className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="reader">Reader</option>
                            <option value="commenter">Commenter</option>
                            <option value="writer">Writer</option>
                        </select>

                        <button
                            onClick={handleShareFile}
                            disabled={!email || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                        >
                            {loading ? 'Sharing...' : 'Share'}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-md">
                            {error}
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Current Permissions</h4>

                    {loading && permissions.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">Loading permissions...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {permissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No permissions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        permissions.map((permission: Permission) => (
                                            <tr key={permission.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {permission.emailAddress || permission.domain || permission.type}
                                                    {permission.displayName && <span className="ml-1 text-gray-500">({permission.displayName})</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${permission.role === 'writer' ? 'bg-green-100 text-green-800' :
                                                            permission.role === 'commenter' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {permission.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDeletePermission(permission.id)}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900 focus:outline-none"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Search functionality for Google Drive files
 */
export const DriveFileSearch: React.FC<{
    accountId: string;
}> = ({ accountId }) => {
    const { files, loading, error, searchFiles } = useDriveFiles(accountId);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const handleSearch = async () => {
        if (!searchQuery) {
            return;
        }

        setIsSearching(true);

        try {
            await searchFiles({
                q: `name contains '${searchQuery}' and trashed = false`,
                maxResults: 50
            });
        } catch (err) {
            console.error('Error searching files:', err);
        } finally {
            setIsSearching(true);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Search Files</h3>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search by filename"
                        disabled={loading}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />

                    <button
                        onClick={handleSearch}
                        disabled={!searchQuery || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md">
                        {error}
                    </div>
                )}

                {isSearching && (
                    <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Search Results</h4>

                        {loading ? (
                            <div className="text-center py-4 text-gray-500">Searching...</div>
                        ) : (
                            <>
                                {files.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">No files found matching "{searchQuery}"</div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {files.map(file => (
                                            <li key={file.id} className="py-4 flex items-start">
                                                <div className="flex-shrink-0 mr-3 mt-1">
                                                    {isFolder(file) ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <a
                                                        href={file.webViewLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        {file.name}
                                                    </a>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {isFolder(file) ? 'Folder' : formatFileSize(file)}
                                                        {file.modifiedTime && ` • Modified ${new Date(file.modifiedTime).toLocaleDateString()}`}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Main Drive App component that combines all the functionality
 */
export const DriveApp: React.FC<{
    accountId: string;
}> = ({ accountId }) => {
    const [activeView, setActiveView] = useState<'files' | 'search'>('files');
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);

    // Reference to the files list component for refreshing
    const { listFiles } = useDriveFiles(accountId);

    const refreshFiles = useCallback(() => {
        const query = currentFolderId
            ? `'${currentFolderId}' in parents and trashed = false`
            : "'root' in parents and trashed = false";

        listFiles({
            q: query,
            orderBy: 'folder,name'
        });
    }, [accountId, currentFolderId, listFiles]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Google Drive</h1>

                    <div className="flex space-x-2">
                        <button
                            className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeView === 'files'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            onClick={() => setActiveView('files')}
                        >
                            My Files
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeView === 'search'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            onClick={() => setActiveView('search')}
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {activeView === 'files' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NewFolderCreator
                            accountId={accountId}
                            currentFolderId={currentFolderId}
                            onFolderCreated={refreshFiles}
                        />
                        <DriveFileUploader
                            accountId={accountId}
                            currentFolderId={currentFolderId}
                            onUploadComplete={refreshFiles}
                        />
                    </div>

                    <DriveFilesList
                        accountId={accountId}
                    />
                </div>
            )}

            {activeView === 'search' && (
                <DriveFileSearch
                    accountId={accountId}
                />
            )}

            {selectedFile && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">{selectedFile.name}</h2>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500">Type</span>
                                        <span className="font-medium">{selectedFile.mimeType}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Size</span>
                                        <span className="font-medium">{formatFileSize(selectedFile)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Created</span>
                                        <span className="font-medium">{selectedFile.createdTime && new Date(selectedFile.createdTime).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Modified</span>
                                        <span className="font-medium">{selectedFile.modifiedTime && new Date(selectedFile.modifiedTime).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <FileSharing
                                accountId={accountId}
                                fileId={selectedFile.id}
                            />

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const GoogleDriveApi: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { currentAccount } = useAccount();

    if (isLoading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800">Google Drive Manager</h1>
                </div>
            </header>
            <main className="container mx-auto p-4">
                {isAuthenticated && currentAccount?.id ? (
                    <DriveApp accountId={currentAccount.id} />
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
                        <p className="text-gray-600">Please sign in to access your Drive files.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GoogleDriveApi;