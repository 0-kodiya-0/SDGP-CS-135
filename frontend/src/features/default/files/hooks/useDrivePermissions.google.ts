import axios from "axios";
import { useState, useCallback } from "react";
import { API_BASE_URL } from "../../../../conf/axios";
import { Permission } from "../types/types.google.api";
import { useGooglePermissions, handleApiError } from "../../user_account";

/**
 * Hook for managing file permissions
 */
export const useDrivePermissions = (accountId: string) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);

    const {
        hasRequiredPermission,
        invalidatePermission,
    } = useGooglePermissions();

    /**
     * List permissions for a file
     */
    const listPermissions = useCallback(async (
        fileId: string,
        params: {
            fields?: string;
            supportsAllDrives?: boolean;
        } = {}
    ) => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission(accountId, 'drive', 'readonly')) {
                setLoading(false);
                return null;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.fields) queryParams.append('fields', params.fields);
            if (params.supportsAllDrives) queryParams.append('supportsAllDrives', 'true');

            const response = await axios.get<{ permissions: Permission[] }>(
                `${API_BASE_URL}/${accountId}/google/drive/files/${fileId}/permissions?${queryParams.toString()}`,
                { withCredentials: true }
            );

            setPermissions(response.data.permissions);
            return response.data.permissions;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, 'drive', 'readonly');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to list permissions');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, hasRequiredPermission, invalidatePermission]);

    /**
     * Share a file with another user
     */
    const shareFile = useCallback(async (
        fileId: string,
        params: {
            role: string;
            type: string;
            emailAddress?: string;
            domain?: string;
            transferOwnership?: boolean;
            sendNotificationEmail?: boolean;
            emailMessage?: string;
        }
    ) => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission(accountId, 'drive', 'file')) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<{ permission: Permission }>(
                `${API_BASE_URL}/${accountId}/google/drive/files/${fileId}/permissions`,
                params,
                { withCredentials: true }
            );

            // Refresh permissions list
            await listPermissions(fileId);

            return response.data.permission;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, 'drive', 'file');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to share file');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, listPermissions, hasRequiredPermission, invalidatePermission]);

    /**
     * Delete a permission from a file
     */
    const deletePermission = useCallback(async (
        fileId: string,
        permissionId: string,
        params: {
            supportsAllDrives?: boolean;
        } = {}
    ) => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission(accountId, 'drive', 'file')) {
                setLoading(false);
                return null;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.supportsAllDrives) queryParams.append('supportsAllDrives', 'true');

            await axios.delete(
                `${API_BASE_URL}/${accountId}/google/drive/files/${fileId}/permissions/${permissionId}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            // Update permissions state by removing the deleted permission
            setPermissions(prevPermissions =>
                prevPermissions.filter(permission => permission.id !== permissionId)
            );

            return { success: true };
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, 'drive', 'file');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to delete permission');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, hasRequiredPermission, invalidatePermission]);

    return {
        permissions,
        loading,
        error,
        listPermissions,
        shareFile,
        deletePermission
    };
};