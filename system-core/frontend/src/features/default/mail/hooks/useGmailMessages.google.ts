import { useState, useCallback } from 'react';
import axios from 'axios';
import { ApiResponse, API_BASE_URL } from '../../../../conf/axios';
import { UseGmailMessagesReturn, GmailMessage, SendMessageParams } from '../types/types.google.api';
import { handleApiError } from '../../user_account/utils/utils.google';
import { useGooglePermissions } from '../../user_account/hooks/usePermissions.google';

/**
 * Hook for managing Gmail Messages
 */
export const useGmailMessages = (accountId: string): UseGmailMessagesReturn => {
    const [messages, setMessages] = useState<GmailMessage[]>([]);
    const [message, setMessage] = useState<GmailMessage | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();

    // Use Google Permissions hook
    const { verifyServiceAccess, invalidatePermission } = useGooglePermissions();

    /**
     * List messages in the user's Gmail account
     */
    const listMessages = useCallback(async (
        params?: {
            pageToken?: string;
            maxResults?: number;
            q?: string;
            labelIds?: string[];
            includeSpamTrash?: boolean;
            format?: 'metadata' | 'minimal' | 'full' | 'raw';
        }
    ): Promise<void> => {
        setLoading(true);
        setError(null);
    
        try {
            const hasAccess = await verifyServiceAccess(accountId, "gmail", "readonly");
            if (!hasAccess) {
                setError("You need additional permissions to access Gmail messages");
                setLoading(false);
                return;
            }
    
            const queryParams = new URLSearchParams();
            if (params?.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());
            if (params?.q) queryParams.append('q', params.q);
            if (params?.labelIds && params.labelIds.length > 0) queryParams.append('labelIds', params.labelIds.join(','));
            if (params?.includeSpamTrash) queryParams.append('includeSpamTrash', 'true');
            queryParams.append('format', params?.format || 'metadata'); // added format here
    
            const response = await axios.get<ApiResponse<{
                messages: GmailMessage[];
                nextPageToken?: string;
            }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/messages?${queryParams.toString()}`,
                { withCredentials: true }
            );
    
            if (response.data.success && response.data.data) {
                if (params?.pageToken) {
                    setMessages(prev => [...prev, ...response.data.data!.messages]);
                } else {
                    setMessages(response.data.data.messages);
                }
                setNextPageToken(response.data.data.nextPageToken);
            } else {
                setError(response.data.error?.message || 'Failed to list messages');
            }
        } catch (err) {
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, "gmail", "readonly");
                setError("Permission error: You need additional permissions to access Gmail messages");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while listing messages');
            }
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyServiceAccess, invalidatePermission]);

    /**
     * Get a specific message by ID
     */
    const getMessage = useCallback(async (
        messageId: string,
        format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'
    ): Promise<GmailMessage | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access using the updated permission hook
            const hasAccess = await verifyServiceAccess(accountId, "gmail", "readonly");
            if (!hasAccess) {
                setError("You need additional permissions to access Gmail messages");
                setLoading(false);
                return null;
            }

            const queryParams = new URLSearchParams();
            queryParams.append('format', format);

            const response = await axios.get<ApiResponse<{ message: GmailMessage }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/messages/${messageId}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const fetchedMessage = response.data.data.message;
                setMessage(fetchedMessage);
                return fetchedMessage;
            } else {
                setError(response.data.error?.message || 'Failed to get message');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, "gmail", "readonly");
                setError("Permission error: You need additional permissions to access Gmail messages");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting the message');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyServiceAccess, invalidatePermission]);

    /**
     * Send a new email
     */
    const sendMessage = useCallback(async (
        params: SendMessageParams
    ): Promise<GmailMessage | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access using the updated permission hook
            const hasAccess = await verifyServiceAccess(accountId, "gmail", "send");
            if (!hasAccess) {
                setError("You need additional permissions to send Gmail messages");
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ message: GmailMessage }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/messages`,
                params,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data.message;
            } else {
                setError(response.data.error?.message || 'Failed to send message');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, "gmail", "send");
                setError("Permission error: You need additional permissions to send Gmail messages");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while sending the message');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyServiceAccess, invalidatePermission]);

    /**
     * Trash a message
     */
    const trashMessage = useCallback(async (
        messageId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access using the updated permission hook
            const hasAccess = await verifyServiceAccess(accountId, "gmail", "full");
            if (!hasAccess) {
                setError("You need additional permissions to manage Gmail messages");
                setLoading(false);
                return false;
            }

            const response = await axios.post<ApiResponse<{ message: string }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/messages/${messageId}/trash`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                // Remove the message from the messages list
                setMessages(prev => prev.filter(m => m.id !== messageId));
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to trash message');
                return false;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, "gmail", "full");
                setError("Permission error: You need additional permissions to manage Gmail messages");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while trashing the message');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyServiceAccess, invalidatePermission]);

    /**
     * Permanently delete a message
     */
    const deleteMessage = useCallback(async (
        messageId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access using the updated permission hook
            const hasAccess = await verifyServiceAccess(accountId, "gmail", "full");
            if (!hasAccess) {
                setError("You need additional permissions to manage Gmail messages");
                setLoading(false);
                return false;
            }

            const response = await axios.delete<ApiResponse<{ message: string }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/messages/${messageId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Remove the message from the messages list
                setMessages(prev => prev.filter(m => m.id !== messageId));
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to delete message');
                return false;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, "gmail", "full");
                setError("Permission error: You need additional permissions to manage Gmail messages");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting the message');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [accountId, verifyServiceAccess, invalidatePermission]);

    /**
     * Modify labels for a message (add/remove)
     */
    const modifyLabels = useCallback(async (
        messageId: string,
        addLabelIds: string[] = [],
        removeLabelIds: string[] = []
    ): Promise<GmailMessage | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access using the updated permission hook
            const hasAccess = await verifyServiceAccess(accountId, "gmail", "full");
            if (!hasAccess) {
                setError("You need additional permissions to manage Gmail messages");
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ message: GmailMessage }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/messages/${messageId}/modify`,
                { addLabelIds, removeLabelIds },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const updatedMessage = response.data.data.message;

                // Update the current message if it matches
                if (message && message.id === messageId) {
                    setMessage(updatedMessage);
                }

                // Update the message in the messages list if it exists
                setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));

                return updatedMessage;
            } else {
                setError(response.data.error?.message || 'Failed to modify message labels');
                return null;
            }
        } catch (err) {
            // Handle API errors and invalidate permissions if needed
            const permissionError = handleApiError(err);
            if (permissionError) {
                invalidatePermission(accountId, "gmail", "full");
                setError("Permission error: You need additional permissions to manage Gmail messages");
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while modifying message labels');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, message, verifyServiceAccess, invalidatePermission]);

    return {
        messages,
        message,
        loading,
        error,
        nextPageToken,
        listMessages,
        getMessage,
        sendMessage,
        trashMessage,
        deleteMessage,
        modifyLabels
    };
};