import axios from "axios";
import { useState, useCallback, useEffect } from "react";
import { API_BASE_URL } from "../../../../conf/axios";
import { DriveFile, CreateFolderParams, CreateFileParams, UpdateFileParams, SearchFilesParams } from "../types/types.google.api";
import { useTokenApi } from "../../user_account";
import { createPermissionError, requestPermission, handleApiError } from "../../user_account/utils/utils.google";

/**
 * Hook for interacting with Google Drive files
 * Provides methods for listing, creating, updating, and deleting files
 * 
 * @param accountId The Google account ID to use for all operations
 */
export const useDriveFiles = (accountId: string) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [currentFile, setCurrentFile] = useState<DriveFile | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);

    // Use token API to check for scopes
    const { checkServiceAccess } = useTokenApi();

    useEffect(() => {
        if (accountId && !initialized) {
            verifyAccess("readonly").then(hasAccess => {
                if (hasAccess) {
                    setInitialized(true);
                }
            });
        }
    }, [accountId, initialized]);

    /**
     * Verify the user has appropriate access for operation
     */
    const verifyAccess = useCallback(async (
        scopeLevel: "readonly" | "file" | "full" = "readonly"
    ): Promise<boolean> => {
        try {
            console.log(`Checking ${scopeLevel} access for account ${accountId}`);
            const accessCheck = await checkServiceAccess(accountId, "drive", scopeLevel);
            console.log("Access check result:", accessCheck);

            if (!accessCheck || !accessCheck.hasAccess) {
                // Create and handle permission error using the utility function
                const permissionError = createPermissionError("drive", scopeLevel, accountId);
                requestPermission(permissionError);
                setError(`You need additional permissions to access Drive files`);
                return false;
            }

            return true;
        } catch (err) {
            console.error("Error checking drive access:", err);
            return false;
        }
    }, [accountId, checkServiceAccess]);

    /**
 * List files and folders with optional filtering
 */
    const listFiles = useCallback(async (
        params: {
            maxResults?: number;
            pageToken?: string;
            q?: string;
            orderBy?: string;
            fields?: string;
            supportsAllDrives?: boolean;
        } = {}
    ) => {
        setLoading(true);
        setError(null);

        try {
            console.log("listFiles called with params:", params);

            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.maxResults) queryParams.append('maxResults', params.maxResults.toString());
            if (params.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params.q) queryParams.append('q', params.q);
            if (params.orderBy) queryParams.append('orderBy', params.orderBy);
            if (params.fields) queryParams.append('fields', params.fields);
            if (params.supportsAllDrives) queryParams.append('supportsAllDrives', 'true');

            const url = `${API_BASE_URL}/google/${accountId}/drive/files?${queryParams.toString()}`;
            console.log("Making API request to:", url);

            const response = await axios.get(
                url,
                { withCredentials: true }
            );

            console.log("API response:", response.data);

            // Extract files from the success/data format
            if (!response.data.success || !response.data.data) {
                console.error("Invalid API response format - missing success/data:", response.data);
                setError("Invalid API response format");
                return null;
            }

            const filesData = response.data.data.files || [];
            const nextPageTokenValue = response.data.data.nextPageToken;

            console.log("Extracted files:", filesData.length, "Next page token:", nextPageTokenValue);

            // Update state - handle both first load and pagination
            if (params.pageToken) {
                // If we're paginating, append to existing files
                setFiles(prevFiles => [...prevFiles, ...filesData]);
            } else {
                // Otherwise replace the files array
                setFiles(filesData);
            }

            setNextPageToken(nextPageTokenValue);

            return {
                files: filesData,
                nextPageToken: nextPageTokenValue
            };
        } catch (err) {
            console.error("Error in listFiles:", err);

            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to list files');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyAccess]);

    /**
 * Get a specific file by ID
 */
    const getFile = useCallback(async (
        fileId: string,
        params: {
            fields?: string;
            supportsAllDrives?: boolean;
        } = {}
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.fields) queryParams.append('fields', params.fields);
            if (params.supportsAllDrives) queryParams.append('supportsAllDrives', 'true');

            const response = await axios.get(
                `${API_BASE_URL}/google/${accountId}/drive/files/${fileId}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            console.log("getFile response:", response.data);

            // Extract file from response
            if (!response.data.success || !response.data.data || !response.data.data.file) {
                console.error("Invalid API response format:", response.data);
                setError("Invalid API response format");
                return null;
            }

            const fileData = response.data.data.file;
            setCurrentFile(fileData);
            return fileData;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to get file');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyAccess]);

    /**
     * Create a new folder
     */
    const createFolder = useCallback(async (
        params: CreateFolderParams
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - creating requires 'file' access
            const hasAccess = await verifyAccess("file");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<{ folder: DriveFile }>(
                `${API_BASE_URL}/google/${accountId}/drive/folders`,
                params,
                { withCredentials: true }
            );

            // Refresh the file list to include the new folder
            await listFiles();

            return response.data.folder;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to create folder');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, listFiles, verifyAccess]);

    /**
     * Create a new empty file
     */
    const createFile = useCallback(async (
        params: CreateFileParams
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - creating requires 'file' access
            const hasAccess = await verifyAccess("file");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<{ file: DriveFile }>(
                `${API_BASE_URL}/google/${accountId}/drive/files`,
                params,
                { withCredentials: true }
            );

            // Refresh the file list to include the new file
            await listFiles();

            return response.data.file;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to create file');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, listFiles, verifyAccess]);

    /**
     * Upload a file
     */
    const uploadFile = useCallback(async (
        file: File,
        params: {
            name?: string;
            parents?: string[];
            mimeType?: string;
            description?: string;
        } = {}
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - uploading requires 'file' access
            const hasAccess = await verifyAccess("file");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            // Create form data with file and parameters
            const formData = new FormData();
            formData.append('file', file);
            if (params.name) formData.append('name', params.name);
            if (params.description) formData.append('description', params.description);
            if (params.mimeType) formData.append('mimeType', params.mimeType);
            if (params.parents && params.parents.length > 0) {
                params.parents.forEach(parent => {
                    formData.append('parents', parent);
                });
            }

            const response = await axios.post<{ file: DriveFile }>(
                `${API_BASE_URL}/google/${accountId}/drive/files/upload`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Refresh the file list to include the new file
            await listFiles();

            return response.data.file;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to upload file');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, listFiles, verifyAccess]);

    /**
     * Update an existing file
     */
    const updateFile = useCallback(async (
        fileId: string,
        params: UpdateFileParams
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - updating requires 'file' access
            const hasAccess = await verifyAccess("file");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.put<{ file: DriveFile }>(
                `${API_BASE_URL}/google/${accountId}/drive/files/${fileId}`,
                params,
                { withCredentials: true }
            );

            // Update the current file if it matches the updated one
            if (currentFile && currentFile.id === fileId) {
                setCurrentFile(response.data.file);
            }

            // Refresh the file list to reflect changes
            await listFiles();

            return response.data.file;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to update file');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, currentFile, listFiles, verifyAccess]);

    /**
     * Delete a file or folder
     */
    const deleteFile = useCallback(async (
        fileId: string,
        params: {
            supportsAllDrives?: boolean;
        } = {}
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - deleting requires 'file' access
            const hasAccess = await verifyAccess("file");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.supportsAllDrives) queryParams.append('supportsAllDrives', 'true');

            await axios.delete(
                `${API_BASE_URL}/google/${accountId}/drive/files/${fileId}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            // Remove the file from current state if it matches
            if (currentFile && currentFile.id === fileId) {
                setCurrentFile(null);
            }

            // Remove the file from the file list
            setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));

            return { success: true };
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to delete file');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, currentFile, verifyAccess]);

    /**
     * Search for files and folders
     */
    const searchFiles = useCallback(async (
        params: SearchFilesParams
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.q) queryParams.append('q', params.q);
            if (params.maxResults) queryParams.append('maxResults', params.maxResults.toString());
            if (params.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params.orderBy) queryParams.append('orderBy', params.orderBy);
            if (params.fields) queryParams.append('fields', params.fields);
            if (params.supportsAllDrives) queryParams.append('supportsAllDrives', 'true');

            const response = await axios.get<{ files: DriveFile[], nextPageToken?: string }>(
                `${API_BASE_URL}/google/${accountId}/drive/files/search?${queryParams.toString()}`,
                { withCredentials: true }
            );

            setFiles(response.data.files);
            setNextPageToken(response.data.nextPageToken);
            return response.data;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to search files');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyAccess]);

    /**
     * Download a file
     * Returns a URL that can be used to download the file
     */
    const getDownloadUrl = useCallback((
        fileId: string,
        acknowledgeAbuse = false
    ) => {
        const queryParams = new URLSearchParams();
        if (acknowledgeAbuse) queryParams.append('acknowledgeAbuse', 'true');

        return `${API_BASE_URL}/google/${accountId}/drive/files/${fileId}/download?${queryParams.toString()}`;
    }, [accountId]);

    return {
        files,
        nextPageToken,
        currentFile,
        loading,
        error,
        listFiles,
        getFile,
        createFolder,
        createFile,
        uploadFile,
        updateFile,
        deleteFile,
        searchFiles,
        getDownloadUrl
    };
};