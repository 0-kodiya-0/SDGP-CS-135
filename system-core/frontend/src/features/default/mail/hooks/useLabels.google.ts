import axios from "axios";
import { useState, useCallback } from "react";
import { ApiResponse, API_BASE_URL } from "../../../../conf/axios";
import { UseGmailLabelsReturn, GmailLabel, CreateLabelParams, UpdateLabelParams } from "../types/types.google.api";
import { useTokenApi } from "../../user_account";
import { createPermissionError, requestPermission, handleApiError } from "../../user_account/utils/utils.google";

/**
 * Hook for managing Gmail Labels
 */
export const useGmailLabels = (accountId: string): UseGmailLabelsReturn => {
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Use token API to check for scopes
    const { checkServiceAccess } = useTokenApi();

    /**
     * Verify the user has appropriate access for operation
     */
    const verifyAccess = useCallback(async (
        scopeLevel: "readonly" | "full" = "readonly"
    ): Promise<boolean> => {
        try {
            const accessCheck = await checkServiceAccess(accountId, "gmail", scopeLevel);

            if (!accessCheck || !accessCheck.hasAccess) {
                // Create and handle permission error
                const permissionError = createPermissionError("gmail", scopeLevel, accountId);
                requestPermission(permissionError);
                setError(`You need additional permissions to access Gmail labels`);
                return false;
            }

            return true;
        } catch (err) {
            console.error("Error checking gmail access:", err);
            return false;
        }
    }, [accountId, checkServiceAccess]);

    /**
     * List all labels in the user's Gmail account
     */
    const listLabels = useCallback(async (
    ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return;
            }

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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while listing labels');
            }
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Create a new Gmail label
     */
    const createLabel = useCallback(async (
        params: CreateLabelParams
    ): Promise<GmailLabel | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - creating labels requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while creating the label');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Update an existing Gmail label
     */
    const updateLabel = useCallback(async (
        labelId: string,
        params: Omit<UpdateLabelParams, 'id'>
    ): Promise<GmailLabel | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - updating labels requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while updating the label');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Delete a Gmail label
     */
    const deleteLabel = useCallback(async (
        labelId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - deleting labels requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return false;
            }

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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting the label');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Get a specific label by ID
     */
    const getLabel = useCallback(async (
        labelId: string
    ): Promise<GmailLabel | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting the label');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    return {
        labels,
        loading,
        error,
        listLabels,
        createLabel,
        updateLabel,
        deleteLabel,
        getLabel
    };
};