import { useEffect, useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useChatSocket } from '../contexts/ChatContext';
import axios from 'axios';
import { API_BASE_URL } from '../../../../conf/axios';
import { ChatData, Participant } from '../types/types.data';

interface UseChatDataReturn {
    // Cached chat data
    chatData: ChatData | null;
    isLoading: boolean;
    error: string | null;

    // Real-time data
    typingUsers: Array<{ userId: string; displayName: string }>;

    // Actions
    loadConversation: () => Promise<void>;
    refreshMessages: () => Promise<void>;
    reloadParticipants: () => Promise<void>;
}

/**
 * Hook for managing individual conversation data with caching
 */
export const useChatData = (accountId: string, conversationId: string | null): UseChatDataReturn => {
    const store = useChatStore();
    const {
        getCachedChat,
        setCachedChat,
        markChatAsAccessed,
    } = store;

    const {
        joinConversation,
        leaveConversation,
        markAsRead,
    } = useChatSocket(accountId);

    // Get cached chat data directly from store
    const chatData = conversationId ? getCachedChat(accountId, conversationId) : null;

    // Get typing users for this conversation directly from store
    const typingUsers = conversationId && store.accountData[accountId] 
        ? store.accountData[accountId].typingUsers
            .filter(user => user.conversationId === conversationId)
            .map(user => ({ userId: user.userId, displayName: user.displayName }))
        : [];

    // Load conversation data
    const loadConversation = useCallback(async () => {
        if (!accountId || !conversationId) return;

        // Mark as accessed for cache management
        markChatAsAccessed(accountId, conversationId);

        // Check if we already have cached data that's not stale
        const cached = getCachedChat(accountId, conversationId);
        const now = Date.now();
        const isStale = !cached || (now - cached.lastAccessed > 5 * 60 * 1000); // 5 minutes

        // If we have valid cached data with a conversation, just join and return
        if (cached && !isStale && cached.conversation) {
            // Join conversation for real-time updates
            joinConversation(conversationId);
            return;
        }

        // Set loading state
        setCachedChat(accountId, conversationId, {
            loading: true,
            error: null,
            conversation: cached?.conversation || null,
            messages: cached?.messages || [],
            participants: cached?.participants || {},
            lastAccessed: now,
        });

        try {
            // Load conversation details and messages in parallel
            const [conversationResponse, messagesResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/${accountId}/chat/conversations/${conversationId}`, {
                    withCredentials: true
                }),
                axios.get(`${API_BASE_URL}/${accountId}/chat/conversations/${conversationId}/messages`, {
                    withCredentials: true
                })
            ]);

            const conversation = conversationResponse.data.data;
            const messages = messagesResponse.data.data;

            // Load participants
            const participants: Record<string, Participant> = {};
            if (conversation.type === 'private') {
                try {
                    const participantResponse = await axios.get(
                        `${API_BASE_URL}/${accountId}/chat/conversations/${conversationId}/participants?conversationType=private`,
                        { withCredentials: true }
                    );

                    const participantData = participantResponse.data.data;
                    participants[participantData._id] = {
                        _id: participantData._id,
                        name: participantData.name || participantData.email || `User ${participantData._id.slice(0, 6)}...`,
                        email: participantData.email,
                        imageUrl: participantData.imageUrl
                    };
                } catch (err) {
                    console.error('Error loading private conversation participant:', err);
                }
            } else if (conversation.type === 'group') {
                try {
                    const participantResponse = await axios.get(
                        `${API_BASE_URL}/${accountId}/chat/conversations/${conversationId}/participants?conversationType=group`,
                        { withCredentials: true }
                    );

                    const participantData = participantResponse.data.data;
                    participantData.forEach((participant: Participant) => {
                        const displayName = participant._id === accountId
                            ? 'You'
                            : participant.name || participant.email || `User ${participant._id.slice(0, 6)}...`;

                        participants[participant._id] = {
                            _id: participant._id,
                            name: displayName,
                            email: participant.email,
                            imageUrl: participant.imageUrl
                        };
                    });
                } catch (err) {
                    console.error('Error loading group conversation participants:', err);
                }
            }

            // Update cache with loaded data
            setCachedChat(accountId, conversationId, {
                conversation,
                messages,
                participants,
                loading: false,
                error: null,
                lastAccessed: now,
            });

            // Join conversation for real-time updates
            joinConversation(conversationId);

            // Mark messages as read
            if (messages.length > 0) {
                markAsRead(conversationId);
            }

        } catch (error) {
            console.error('Error loading conversation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load conversation';
            setCachedChat(accountId, conversationId, {
                loading: false,
                error: errorMessage,
                conversation: cached?.conversation || null,
                messages: cached?.messages || [],
                participants: cached?.participants || {},
                lastAccessed: now,
            });
        }
    }, [accountId, conversationId, getCachedChat, joinConversation, markAsRead, markChatAsAccessed, setCachedChat]);

    // Refresh messages only
    const refreshMessages = useCallback(async () => {
        if (!accountId || !conversationId) return;

        try {
            const response = await axios.get(
                `${API_BASE_URL}/${accountId}/chat/conversations/${conversationId}/messages`,
                { withCredentials: true }
            );

            const messages = response.data.data;
            setCachedChat(accountId, conversationId, { messages });

            // Mark as read after refresh
            if (messages.length > 0) {
                markAsRead(conversationId);
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
        }
    }, [accountId, conversationId, markAsRead, setCachedChat]);

    // Reload participants
    const reloadParticipants = useCallback(async () => {
        if (!accountId || !conversationId || !chatData?.conversation) return;

        try {
            const participants: Record<string, Participant> = {};
            const conversationType = chatData.conversation.type;

            const participantResponse = await axios.get(
                `${API_BASE_URL}/${accountId}/chat/conversations/${conversationId}/participants?conversationType=${conversationType}`,
                { withCredentials: true }
            );

            if (conversationType === 'private') {
                const participantData = participantResponse.data.data;
                participants[participantData._id] = {
                    _id: participantData._id,
                    name: participantData.name || participantData.email || `User ${participantData._id.slice(0, 6)}...`,
                    email: participantData.email,
                    imageUrl: participantData.imageUrl
                };
            } else {
                const participantData = participantResponse.data.data;
                participantData.forEach((participant: Participant) => {
                    const displayName = participant._id === accountId
                        ? 'You'
                        : participant.name || participant.email || `User ${participant._id.slice(0, 6)}...`;

                    participants[participant._id] = {
                        _id: participant._id,
                        name: displayName,
                        email: participant.email,
                        imageUrl: participant.imageUrl
                    };
                });
            }

            setCachedChat(accountId, conversationId, { participants });
        } catch (error) {
            console.error('Error reloading participants:', error);
        }
    }, [accountId, conversationId, chatData?.conversation, setCachedChat]);

    // Join/leave conversation on mount/unmount
    useEffect(() => {
        if (conversationId) {
            // Load conversation data on mount
            loadConversation();

            return () => {
                // Leave conversation on unmount
                leaveConversation(conversationId);
            };
        }
    }, [conversationId]);

    return {
        chatData,
        isLoading: chatData?.loading || false,
        error: chatData?.error || null,
        typingUsers,
        loadConversation,
        refreshMessages,
        reloadParticipants,
    };
};