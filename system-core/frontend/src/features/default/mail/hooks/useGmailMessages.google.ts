import { useState, useCallback } from 'react';
import axios from 'axios';
import { ApiResponse, API_BASE_URL } from '../../../../conf/axios';
import { UseGmailMessagesReturn, GmailMessage, SendMessageParams } from '../types/types.google.api';
import { useTokenApi } from '../../user_account';
import { createPermissionError, requestPermission, handleApiError } from '../../user_account/utils/utils.google';

/**
 * Hook for managing Gmail Messages
 */
export const useGmailMessages = (accountId: string): UseGmailMessagesReturn => {
    const [messages, setMessages] = useState<GmailMessage[]>([]);
    const [message, setMessage] = useState<GmailMessage | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();

    // Use token API to check for scopes
    const { checkServiceAccess } = useTokenApi();

    /**
     * Verify the user has appropriate access for operation
     */
    const verifyAccess = useCallback(async (
        scopeLevel: "readonly" | "send" | "compose" | "full" = "readonly"
    ): Promise<boolean> => {
        try {
            const accessCheck = await checkServiceAccess(accountId, "gmail", scopeLevel);

            if (!accessCheck || !accessCheck.hasAccess) {
                // Create and handle permission error
                const permissionError = createPermissionError("gmail", scopeLevel, accountId);
                requestPermission(permissionError);
                setError(`You need additional permissions to access Gmail messages`);
                return false;
            }

            return true;
        } catch (err) {
            console.error("Error checking gmail access:", err);
            return false;
        }
    }, [accountId, checkServiceAccess]);

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
        }
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

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params?.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());
            if (params?.q) queryParams.append('q', params.q);
            if (params?.labelIds && params.labelIds.length > 0) queryParams.append('labelIds', params.labelIds.join(','));
            if (params?.includeSpamTrash) queryParams.append('includeSpamTrash', 'true');

            const response = await axios.get<ApiResponse<{
                messages: GmailMessage[];
                nextPageToken?: string;
            }>>(
                `${API_BASE_URL}/google/${accountId}/gmail/messages?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                if (params?.pageToken) {
                    // If using pagination, append to existing messages
                    setMessages(prev => [...prev, ...response.data.data!.messages]);
                } else {
                    // Otherwise replace the messages list
                    setMessages(response.data.data.messages);
                }
                setNextPageToken(response.data.data.nextPageToken);
            } else {
                setError(response.data.error?.message || 'Failed to list messages');
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while listing messages');
            }
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

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
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting the message');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Send a new email
     */
    const sendMessage = useCallback(async (
        params: SendMessageParams
    ): Promise<GmailMessage | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - sending emails requires 'send' scope level
            const hasAccess = await verifyAccess("send");
            if (!hasAccess) {
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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while sending the message');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Trash a message
     */
    const trashMessage = useCallback(async (
        messageId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - modifying messages requires 'full' scope level
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while trashing the message');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Permanently delete a message
     */
    const deleteMessage = useCallback(async (
        messageId: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - deleting messages requires 'full' scope level
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting the message');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

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
            // Verify access first - modifying messages requires 'full' scope level
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
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
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while modifying message labels');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, message, verifyAccess]);

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