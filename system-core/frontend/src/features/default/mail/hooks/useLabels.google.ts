import axios from "axios";
import { useState, useCallback } from "react";
import { ApiResponse, API_BASE_URL } from "../../../../conf/axios";
import { UseGmailLabelsReturn, GmailLabel, CreateLabelParams, UpdateLabelParams } from "../types/types.google.api";
import { handleApiError } from "../../user_account/utils/utils.google";
import { useServicePermissions } from "../../user_account/hooks/useServicePermissions.google";

/**
 * Hook for managing Gmail Labels with centralized permission management
 */
export const useGmailLabels = (accountId: string): UseGmailLabelsReturn => {
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Use Gmail Permissions hook via the generic service permissions hook
    const {
        permissions,
        permissionsLoading,
        permissionError,
        checkAllServicePermissions,
        hasRequiredPermission,
        invalidateServicePermission,
        availableScopes
    } = useServicePermissions(accountId, 'gmail');

    // Check permissions when the hook is first used
    // useEffect(() => {
    //     if (!permissionsLoaded && !permissionsLoading) {
    //         checkAllServicePermissions();
    //     }
    // }, [permissionsLoaded, permissionsLoading, checkAllServicePermissions]);

    /**
     * List all labels in the user's Gmail account
     */
    const listLabels = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        // Check if we have readonly permission
        if (!hasRequiredPermission('readonly')) {
            setError("You need additional permissions to access Gmail labels");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get<ApiResponse<{ labels: GmailLabel[] }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/labels`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                setLabels(response.data.data.labels);
            } else {
                setError(response.data.error?.message || 'Failed to list labels');
            }
        } catch (err) {
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("readonly");
                setError("Permission error: You need additional permissions to access Gmail labels");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while listing labels');
            }
        } finally {
            setLoading(false);
        }
    }, [accountId, hasRequiredPermission, invalidateServicePermission]);

    /**
     * Create a new Gmail label
     */
    const createLabel = useCallback(async (
        params: CreateLabelParams
    ): Promise<GmailLabel | null> => {
        setLoading(true);
        setError(null);

        // Check if we have full permission
        if (!hasRequiredPermission('full')) {
            setError("You need additional permissions to manage Gmail labels");
            setLoading(false);
            return null;
        }

        try {
            const response = await axios.post<ApiResponse<{ label: GmailLabel }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/labels`,
                params,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const newLabel = response.data.data.label;
                setLabels(prev => [...prev, newLabel]);
                return newLabel;
            } else {
                setError(response.data.error?.message || 'Failed to create label');
                return null;
            }
        } catch (err) {
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to manage Gmail labels");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while creating the label');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, hasRequiredPermission, invalidateServicePermission]);

    /**
     * Update an existing Gmail label
     */
    const updateLabel = useCallback(async (
        labelId: string,
        params: Omit<UpdateLabelParams, 'id'>
    ): Promise<GmailLabel | null> => {
        setLoading(true);
        setError(null);

        // Check if we have full permission
        if (!hasRequiredPermission('full')) {
            setError("You need additional permissions to manage Gmail labels");
            setLoading(false);
            return null;
        }

        try {
            const response = await axios.put<ApiResponse<{ label: GmailLabel }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/labels/${labelId}`,
                params,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const updatedLabel = response.data.data.label;
                setLabels(prev => prev.map(label =>
                    label.id === labelId ? updatedLabel : label
                ));
                return updatedLabel;
            } else {
                setError(response.data.error?.message || 'Failed to update label');
                return null;
            }
        } catch (err) {
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to manage Gmail labels");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while updating the label');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, hasRequiredPermission, invalidateServicePermission]);

    /**
     * Delete a Gmail label
     */
    const deleteLabel = useCallback(async (
        labelId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        // Check if we have full permission
        if (!hasRequiredPermission('full')) {
            setError("You need additional permissions to manage Gmail labels");
            setLoading(false);
            return false;
        }

        try {
            const response = await axios.delete<ApiResponse<{ message: string }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/labels/${labelId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setLabels(prev => prev.filter(label => label.id !== labelId));
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to delete label');
                return false;
            }
        } catch (err) {
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to manage Gmail labels");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting the label');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [accountId, hasRequiredPermission, invalidateServicePermission]);

    /**
     * Get a specific label by ID
     */
    const getLabel = useCallback(async (
        labelId: string
    ): Promise<GmailLabel | null> => {
        setLoading(true);
        setError(null);

        // Check if we have readonly permission
        if (!hasRequiredPermission('readonly')) {
            setError("You need additional permissions to access Gmail labels");
            setLoading(false);
            return null;
        }

        try {
            const response = await axios.get<ApiResponse<{ label: GmailLabel }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/labels/${labelId}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.label;
            } else {
                setError(response.data.error?.message || 'Failed to get label');
                return null;
            }
        } catch (err) {
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("readonly");
                setError("Permission error: You need additional permissions to access Gmail labels");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting the label');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, hasRequiredPermission, invalidateServicePermission]);

    return {
        labels,
        loading,
        error,
        // Add permission-related states for UI feedback
        permissionsLoading,
        permissionError,
        permissions,
        // Add the permission check function for direct use
        checkAllGmailPermissions: checkAllServicePermissions,
        // Regular label functions
        availableScopes,
        listLabels,
        createLabel,
        updateLabel,
        deleteLabel,
        getLabel
    };
};