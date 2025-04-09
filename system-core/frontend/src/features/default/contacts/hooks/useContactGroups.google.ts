import axios from "axios";
import { useState, useCallback } from "react";
import { ContactGroupType } from "../types/types.data";
import { UseContactGroupsReturn } from "../types/types.google.api";
import { API_BASE_URL, ApiResponse } from "../../../../conf/axios";
import { handleApiError } from "../../user_account/utils/utils.google";
import { useServicePermissions } from "../../user_account/hooks/useServicePermissions.google";

/**
 * Hook for managing Google Contact Groups
 * 
 * @param accountId The Google account ID to use for all operations
 */
export const useContactGroups = (accountId: string): UseContactGroupsReturn => {
    const [groups, setGroups] = useState<ContactGroupType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [syncToken, setSyncToken] = useState<string | undefined>();

    const {
        hasRequiredPermission,
        invalidateServicePermission,
    } = useServicePermissions(accountId, 'people');

    // Fetch contact groups
    const fetchGroups = useCallback(async (
        params?: {
            pageToken?: string;
            maxResults?: number;
            syncToken?: string;
        }
    ) => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission("readonly")) {
                setError("Permission error: You need additional permissions to access contact groups");
                setLoading(false);
                return;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params?.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());
            if (params?.syncToken) queryParams.append('syncToken', params.syncToken);

            const response = await axios.get<ApiResponse<{
                groups: ContactGroupType[],
                nextPageToken?: string,
                syncToken?: string
            }>>(
                `${API_BASE_URL}/google/${accountId}/people/contactGroups?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                setGroups(response.data.data.groups);
                setNextPageToken(response.data.data.nextPageToken);
                setSyncToken(response.data.data.syncToken);
            } else {
                setError(response.data.error?.message || 'Failed to fetch contact groups');
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("readonly");
                setError("Permission error: You need additional permissions to access contact groups");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while fetching contact groups');
            }
        } finally {
            setLoading(false);
        }
    }, [hasRequiredPermission, accountId, invalidateServicePermission]);

    // Get a single contact group
    const getGroup = useCallback(async (
        resourceName: string
    ): Promise<ContactGroupType | null> => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission("readonly")) {
                setError("Permission error: You need additional permissions to access contact groups");
                setLoading(false);
                return null;
            }

            const response = await axios.get<ApiResponse<{ group: ContactGroupType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contactGroups/${resourceName}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.group;
            } else {
                setError(response.data.error?.message || 'Failed to get contact group');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("readonly");
                setError("Permission error: You need additional permissions to access contact groups");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting contact group');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [hasRequiredPermission, accountId, invalidateServicePermission]);

    // Create a new contact group
    const createGroup = useCallback(async (
        name: string
    ): Promise<ContactGroupType | null> => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission("full")) {
                setError("Permission error: You need additional permissions to create contact groups");
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ group: ContactGroupType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contactGroups`,
                { name },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.group;
            } else {
                setError(response.data.error?.message || 'Failed to create contact group');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to create contact groups");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while creating contact group');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [hasRequiredPermission, accountId, invalidateServicePermission]);

    // Update a contact group
    const updateGroup = useCallback(async (
        resourceName: string,
        name: string,
        etag?: string
    ): Promise<ContactGroupType | null> => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission("full")) {
                setError("Permission error: You need additional permissions to update contact groups");
                setLoading(false);
                return null;
            }

            const response = await axios.put<ApiResponse<{ group: ContactGroupType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contactGroups/${resourceName}`,
                { name, etag },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.group;
            } else {
                setError(response.data.error?.message || 'Failed to update contact group');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to update contact groups");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while updating contact group');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [hasRequiredPermission, accountId, invalidateServicePermission]);

    // Delete a contact group
    const deleteGroup = useCallback(async (
        resourceName: string,
        deleteContacts?: boolean
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission("full")) {
                setError("Permission error: You need additional permissions to delete contact groups");
                setLoading(false);
                return false;
            }

            const queryParams = new URLSearchParams();
            if (deleteContacts) queryParams.append('deleteContacts', 'true');

            const response = await axios.delete<ApiResponse<{ message: string }>>(
                `${API_BASE_URL}/google/${accountId}/people/contactGroups/${resourceName}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to delete contact group');
                return false;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to delete contact groups");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting contact group');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [hasRequiredPermission, accountId, invalidateServicePermission]);

    // Add contacts to a group
    const addContactsToGroup = useCallback(async (
        resourceName: string,
        contactResourceNames: string[]
    ): Promise<ContactGroupType | null> => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission("full")) {
                setError("Permission error: You need additional permissions to modify contact groups");
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ group: ContactGroupType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contactGroups/${resourceName}/members/add`,
                { resourceNames: contactResourceNames },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.group;
            } else {
                setError(response.data.error?.message || 'Failed to add contacts to group');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to modify contact groups");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while adding contacts to group');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [hasRequiredPermission, accountId, invalidateServicePermission]);

    // Remove contacts from a group
    const removeContactsFromGroup = useCallback(async (
        resourceName: string,
        contactResourceNames: string[]
    ): Promise<ContactGroupType | null> => {
        setLoading(true);
        setError(null);

        try {
            if (!hasRequiredPermission("full")) {
                setError("Permission error: You need additional permissions to modify contact groups");
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ group: ContactGroupType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contactGroups/${resourceName}/members/remove`,
                { resourceNames: contactResourceNames },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.group;
            } else {
                setError(response.data.error?.message || 'Failed to remove contacts from group');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidateServicePermission("full");
                setError("Permission error: You need additional permissions to modify contact groups");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while removing contacts from group');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [hasRequiredPermission, accountId, invalidateServicePermission]);

    return {
        groups,
        loading,
        error,
        nextPageToken,
        syncToken,
        fetchGroups,
        getGroup,
        createGroup,
        updateGroup,
        deleteGroup,
        addContactsToGroup,
        removeContactsFromGroup
    };
};