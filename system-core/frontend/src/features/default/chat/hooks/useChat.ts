import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../conf/axios';

interface Conversation {
    _id: string;
    type: 'private' | 'group';
    participants: string[];
    name?: string;
    lastMessage?: {
        content: string;
        sender: string;
        timestamp: string;
    };
}

interface UseChatReturn {
    conversations: Conversation[];
    loading: boolean;
    error: string | null;
    unreadCount: number;
    fetchConversations: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    fetchParticipantInformation: (conversationId: string, conversationType: "private") => Promise<{ name: string, imageUrl: string }>,
    createPrivateConversation: (otherUserId: string) => Promise<string | null>;
    createGroupConversation: (name: string, participantIds: string[]) => Promise<string | null>;
}

export const useChat = (accountId: string): UseChatReturn => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    // Initial data loading
    useEffect(() => {
        if (accountId) {
            fetchConversations();
            fetchUnreadCount();
        }
    }, [accountId]);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_BASE_URL}/chat/${accountId}/conversations`,
                { withCredentials: true }
            );

            if (response.data.data) {
                setConversations(response.data.data);
                setError(null);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            setError('Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    const fetchParticipantInformation = useCallback(async (conversationId: string, conversationType: "private") => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_BASE_URL}/chat/${accountId}/conversations/${conversationId}/participants?conversationType=${conversationType}`,
                { withCredentials: true }
            );

            if (response.data.data) {
                return response.data.data;
            } else {
                setError("No participant information was found");
                return null;
            }
        } catch {
            console.error('No participant information was found', conversationId);
            setError('No participant information was found');
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    // Fetch unread message count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/chat/${accountId}/messages/unread/count`,
                { withCredentials: true }
            );

            if (response.data.data && response.data.data.count !== undefined) {
                setUnreadCount(response.data.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
            // Not setting error state here since it's not critical
        }
    }, [accountId]);

    // Handle creating a private conversation
    const createPrivateConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
        try {
            setLoading(true);
            const response = await axios.post(
                `${API_BASE_URL}/chat/${accountId}/conversations/private`,
                { otherUserId },
                { withCredentials: true }
            );

            if (response.data.data) {
                await fetchConversations();
                return response.data.data._id;
            }
            return null;
        } catch (error) {
            console.error('Failed to create private conversation:', error);
            setError('Failed to create private conversation');
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, fetchConversations]);

    // Handle creating a group conversation
    const createGroupConversation = useCallback(async (name: string, participantIds: string[]): Promise<string | null> => {
        if (!name.trim() || participantIds.length === 0) return null;

        try {
            setLoading(true);
            const response = await axios.post(
                `${API_BASE_URL}/chat/${accountId}/conversations/group`,
                {
                    name,
                    participants: participantIds
                },
                { withCredentials: true }
            );

            if (response.data.data) {
                await fetchConversations();
                return response.data.data._id;
            }
            return null;
        } catch (error) {
            console.error('Failed to create group conversation:', error);
            setError('Failed to create group conversation');
            return null;
        } finally {
            setLoading(false);
        }
    }, [accountId, fetchConversations]);

    return {
        conversations,
        loading,
        error,
        unreadCount,
        fetchConversations,
        fetchUnreadCount,
        fetchParticipantInformation, 
        createPrivateConversation,
        createGroupConversation
    };
};