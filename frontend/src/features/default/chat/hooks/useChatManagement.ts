import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { useChatStore } from '../store/useChatStore';
import { API_BASE_URL } from '../../../../conf/axios';
import { searchAccounts } from '../../user_account/utils/account.utils';
import { PersonType } from '../../contacts';
import { ConversationSummary } from '../types/types.data';

interface UseChatManagementReturn {
  // Conversation list management
  conversations: ConversationSummary[];
  loading: boolean;
  error: string | null;
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  createPrivateConversation: (otherUserId: string) => Promise<string | null>;
  createGroupConversation: (name: string, participantIds: string[]) => Promise<string | null>;
  createConversationWithContact: (contact: PersonType) => Promise<string | null>;
  createGroupWithContacts: (groupName: string, contacts: PersonType[]) => Promise<string | null>;
  
  // Utilities
  refreshAll: () => Promise<void>;
}

/**
 * Hook for managing conversations list and creation
 */
export const useChatManagement = (accountId: string): UseChatManagementReturn => {
  const {
    accountData,
    setConversations,
    setConversationsLoading,
    setConversationsError,
    updateConversation,
    setUnreadCounts,
  } = useChatStore();
  
  // Initialize account data
  // useEffect(() => {
  //   initializeAccount(accountId);
  // }, [accountId]);
  
  const accountInfo = accountData[accountId] || {
    conversations: [],
    conversationsLoading: false,
    conversationsError: null,
    unreadCounts: {},
    totalUnreadCount: 0,
  };
  
  // Load participant information for a conversation
  const loadConversationDisplayInfo = useCallback(async (conversation: any): Promise<ConversationSummary> => {
    let displayName = conversation.name || 'Unknown';
    let imageUrl: string | undefined;
    
    if (conversation.type === 'private') {
      try {
        const participantResponse = await axios.get(
          `${API_BASE_URL}/${accountId}/chat/conversations/${conversation._id}/participants?conversationType=private`,
          { withCredentials: true }
        );
        
        const participantData = participantResponse.data.data;
        displayName = participantData.name || participantData.email || 'Unknown';
        imageUrl = participantData.imageUrl;
      } catch (error) {
        console.error('Error loading conversation display info:', error);
      }
    }
    
    return {
      ...conversation,
      displayName,
      imageUrl,
    };
  }, [accountId]);
  
  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    if (!accountId) return;
    
    setConversationsLoading(accountId, true);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/${accountId}/chat/conversations`,
        { withCredentials: true }
      );
      
      if (response.data.data) {
        // Load display info for each conversation
        const conversationsWithDisplayInfo = await Promise.all(
          response.data.data.map((conv: any) => loadConversationDisplayInfo(conv))
        );
        
        setConversations(accountId, conversationsWithDisplayInfo);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversationsError(accountId, 'Failed to fetch conversations');
    } finally {
      setConversationsLoading(accountId, false);
    }
  }, [accountId, setConversations, setConversationsLoading, setConversationsError, loadConversationDisplayInfo]);
  
  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!accountId) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/${accountId}/chat/messages/unread/count/byConversation`,
        { withCredentials: true }
      );
      
      if (response.data.data) {
        setUnreadCounts(accountId, response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [accountId, setUnreadCounts]);
  
  // Create private conversation
  const createPrivateConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!accountId) return null;
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/${accountId}/chat/conversations/private`,
        { otherUserId },
        { withCredentials: true }
      );
      
      if (response.data.data) {
        const conversation = response.data.data;
        const conversationWithDisplayInfo = await loadConversationDisplayInfo(conversation);
        updateConversation(accountId, conversationWithDisplayInfo);
        return conversation._id;
      }
    } catch (error) {
      console.error('Failed to create private conversation:', error);
    }
    
    return null;
  }, [accountId, updateConversation, loadConversationDisplayInfo]);
  
  // Create group conversation
  const createGroupConversation = useCallback(async (name: string, participantIds: string[]): Promise<string | null> => {
    if (!accountId || !name.trim() || participantIds.length === 0) return null;
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/${accountId}/chat/conversations/group`,
        {
          name,
          participants: participantIds
        },
        { withCredentials: true }
      );
      
      if (response.data.data) {
        const conversation = response.data.data;
        const conversationWithDisplayInfo = await loadConversationDisplayInfo(conversation);
        updateConversation(accountId, conversationWithDisplayInfo);
        return conversation._id;
      }
    } catch (error) {
      console.error('Failed to create group conversation:', error);
    }
    
    return null;
  }, [accountId, updateConversation, loadConversationDisplayInfo]);
  
  // Create conversation with contact
  const createConversationWithContact = useCallback(async (contact: PersonType): Promise<string | null> => {
    if (!contact.emailAddresses || contact.emailAddresses.length === 0) {
      console.error("Contact doesn't have an email address");
      return null;
    }
    
    const emailAddress = contact.emailAddresses.find(v => v.metadata?.primary)?.value ||
      contact.emailAddresses[0].value;
    
    if (!emailAddress) {
      console.error("No valid email address found for contact");
      return null;
    }
    
    try {
      const account = await searchAccounts(emailAddress);
      if (!account || !account.accountId) {
        console.error("Contact doesn't use fusion space application");
        return null;
      }
      
      return await createPrivateConversation(account.accountId);
    } catch (error) {
      console.error("Error creating conversation with contact:", error);
      return null;
    }
  }, [createPrivateConversation]);
  
  // Create group with contacts
  const createGroupWithContacts = useCallback(async (groupName: string, contacts: PersonType[]): Promise<string | null> => {
    if (!groupName.trim() || contacts.length === 0) return null;
    
    try {
      const participantPromises = contacts.map(async (contact) => {
        const emailAddress = contact.emailAddresses?.find(v => v.metadata?.primary)?.value ||
          (contact.emailAddresses && contact.emailAddresses.length > 0 ?
            contact.emailAddresses[0].value : null);
        
        if (!emailAddress) return null;
        
        const account = await searchAccounts(emailAddress);
        return account?.accountId || null;
      });
      
      const participantIds = (await Promise.all(participantPromises))
        .filter((id): id is string => id !== null);
      
      if (participantIds.length === 0) {
        console.error("No valid participants found");
        return null;
      }
      
      return await createGroupConversation(groupName, participantIds);
    } catch (error) {
      console.error("Error creating group with contacts:", error);
      return null;
    }
  }, [createGroupConversation]);
  
  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchConversations(),
      fetchUnreadCounts(),
    ]);
  }, [fetchConversations, fetchUnreadCounts]);
  
  // Load initial data
  useEffect(() => {
    if (accountId) {
      refreshAll();
    }
  }, [accountId]);
  
  return {
    conversations: accountInfo.conversations,
    loading: accountInfo.conversationsLoading,
    error: accountInfo.conversationsError,
    unreadCounts: accountInfo.unreadCounts,
    totalUnreadCount: accountInfo.totalUnreadCount,
    fetchConversations,
    fetchUnreadCounts,
    createPrivateConversation,
    createGroupConversation,
    createConversationWithContact,
    createGroupWithContacts,
    refreshAll,
  };
};