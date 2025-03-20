import { useState, useCallback } from 'react';
import axios from 'axios';
import { PersonType, CreateContactParams, UpdateContactParams } from '../types/types.data';
import { UseContactsReturn } from '../types/types.google.api';
import { API_BASE_URL, ApiResponse } from '../../../../conf/axios';
import { useTokenApi } from '../../user_account';
import { createPermissionError, requestPermission, handleApiError } from '../../user_account/utils/utils.google';

/**
 * Hook for managing Google Contacts
 */
export const useContacts = (accountId: string): UseContactsReturn => {
    const [contacts, setContacts] = useState<PersonType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [syncToken, setSyncToken] = useState<string | undefined>();
    
    // Use token API to check for scopes
    const { checkServiceAccess } = useTokenApi();

    /**
     * Verify the user has appropriate access for operation
     */
    const verifyAccess = useCallback(async (
        scopeLevel: "readonly" | "full" = "readonly"
    ): Promise<boolean> => {
        try {
            const accessCheck = await checkServiceAccess(accountId, "people", scopeLevel);
            
            if (!accessCheck || !accessCheck.hasAccess) {
                // Create and handle permission error
                const permissionError = createPermissionError("people", scopeLevel, accountId);
                requestPermission(permissionError);
                setError(`You need additional permissions to access contacts`);
                return false;
            }
            
            return true;
        } catch (err) {
            console.error("Error checking people access:", err);
            return false;
        }
    }, [accountId, checkServiceAccess]);

    // Fetch contacts list
    const fetchContacts = useCallback(async (
        params?: {
            pageToken?: string;
            maxResults?: number;
            personFields?: string;
            sortOrder?: string;
            syncToken?: string;
        }
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params?.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());
            if (params?.personFields) queryParams.append('personFields', params.personFields);
            if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
            if (params?.syncToken) queryParams.append('syncToken', params.syncToken);

            const response = await axios.get<ApiResponse<{
                contacts: PersonType[],
                nextPageToken?: string,
                syncToken?: string
            }>>(
                `${API_BASE_URL}/google/${accountId}/people/contacts?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                setContacts(response.data.data.contacts);
                setNextPageToken(response.data.data.nextPageToken);
                setSyncToken(response.data.data.syncToken);
            } else {
                setError(response.data.error?.message || 'Failed to fetch contacts');
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while fetching contacts');
            }
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    // Get a single contact
    const getContact = useCallback(async (
        resourceName: string,
        params?: {
            personFields?: string;
        }
    ): Promise<PersonType | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const queryParams = new URLSearchParams();
            if (params?.personFields) queryParams.append('personFields', params.personFields);

            const response = await axios.get<ApiResponse<{ contact: PersonType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contacts/${resourceName}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.contact;
            } else {
                setError(response.data.error?.message || 'Failed to get contact');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting contact');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    // Create a new contact
    const createContact = useCallback(async (
        contactData: CreateContactParams
    ): Promise<PersonType | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - creating contacts requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ contact: PersonType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contacts`,
                contactData,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.contact;
            } else {
                setError(response.data.error?.message || 'Failed to create contact');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while creating contact');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    // Update a contact
    const updateContact = useCallback(async (
        resourceName: string,
        contactData: UpdateContactParams
    ): Promise<PersonType | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - updating contacts requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.put<ApiResponse<{ contact: PersonType }>>(
                `${API_BASE_URL}/google/${accountId}/people/contacts/${resourceName}`,
                contactData,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.contact;
            } else {
                setError(response.data.error?.message || 'Failed to update contact');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while updating contact');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    // Delete a contact
    const deleteContact = useCallback(async (
        resourceName: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - deleting contacts requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return false;
            }

            const response = await axios.delete<ApiResponse<{ message: string }>>(
                `${API_BASE_URL}/google/${accountId}/people/contacts/${resourceName}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to delete contact');
                return false;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting contact');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    // Search contacts
    const searchContacts = useCallback(async (
        query: string,
        params?: {
            pageToken?: string;
            pageSize?: number;
            readMask?: string;
            sources?: string;
        }
    ): Promise<{ contacts: PersonType[], nextPageToken?: string } | null> => {
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
            queryParams.append('q', query);
            if (params?.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
            if (params?.readMask) queryParams.append('readMask', params.readMask);
            if (params?.sources) queryParams.append('sources', params.sources);

            const response = await axios.get<ApiResponse<{
                contacts: PersonType[],
                nextPageToken?: string
            }>>(
                `${API_BASE_URL}/google/${accountId}/people/contacts/search?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return {
                    contacts: response.data.data.contacts,
                    nextPageToken: response.data.data.nextPageToken
                };
            } else {
                setError(response.data.error?.message || 'Failed to search contacts');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while searching contacts');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    return {
        contacts,
        loading,
        error,
        nextPageToken,
        syncToken,
        fetchContacts,
        getContact,
        createContact,
        updateContact,
        deleteContact,
        searchContacts
    };
};