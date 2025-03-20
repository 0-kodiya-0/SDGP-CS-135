import axios from "axios";
import { useState, useCallback } from "react";
import { API_BASE_URL } from "../../../../conf/axios";
import { Permission } from "../types/types.google.api";
import { useTokenApi } from "../../user_account";
import { createPermissionError, requestPermission, handleApiError } from "../../user_account/utils/utils.google";

/**
 * Hook for managing file permissions
 */
export const useDrivePermissions = (accountId: string) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);

    // Use token API to check for scopes
    const { checkServiceAccess } = useTokenApi();

    /**
     * Verify the user has appropriate access for operation
     */
    const verifyAccess = useCallback(async (
        scopeLevel: "readonly" | "file" | "full" = "readonly"
    ): Promise<boolean> => {
        try {
            const accessCheck = await checkServiceAccess(accountId, "drive", scopeLevel);

            if (!accessCheck || !accessCheck.hasAccess) {
                // Create and handle permission error
                const permissionError = createPermissionError("drive", scopeLevel, accountId);
                requestPermission(permissionError);
                setError(`You need additional permissions to access Drive permissions`);
                return false;
            }

            return true;
        } catch (err) {
            console.error("Error checking drive access:", err);
            return false;
        }
    }, [accountId, checkServiceAccess]);

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

            const response = await axios.get<{ permissions: Permission[] }>(
                `${API_BASE_URL}/google/${accountId}/drive/files/${fileId}/permissions?${queryParams.toString()}`,
                { withCredentials: true }
            );

            setPermissions(response.data.permissions);
            return response.data.permissions;
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to list permissions');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyAccess]);

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
            // Verify access first - sharing requires 'file' access
            const hasAccess = await verifyAccess("file");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<{ permission: Permission }>(
                `${API_BASE_URL}/google/${accountId}/drive/files/${fileId}/permissions`,
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
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to share file');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, listPermissions, verifyAccess]);

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
            // Verify access first - deleting permissions requires 'file' access
            const hasAccess = await verifyAccess("file");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.supportsAllDrives) queryParams.append('supportsAllDrives', 'true');

            await axios.delete(
                `${API_BASE_URL}/google/${accountId}/drive/files/${fileId}/permissions/${permissionId}?${queryParams.toString()}`,
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
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to delete permission');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyAccess]);

    return {
        permissions,
        loading,
        error,
        listPermissions,
        shareFile,
        deletePermission,
        verifyAccess
    };
};