import React, { useState, useCallback, useEffect } from 'react';
import { PersonType } from '../../contacts';
import { ComponentTypes, useTabStore } from '../../../required/tab_view';
import ContactSearchComponent from './ContactSearchComponent';
import CreateGroupComponent from './CreateGroupComponent';
import { useChat } from '../hooks/useChat';
import { searchAccounts } from '../../user_account/utils/account.utils';
import { RefreshCw } from 'lucide-react';

interface ChatSummaryViewProps {
  accountId: string;
}

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
  unreadCount?: number;
}

export const ChatSummaryView: React.FC<ChatSummaryViewProps> = ({
  accountId
}) => {
  // State management
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [conversationNames, setConversationNames] = useState<Record<string, string>>({});
  const [conversationsWithUnread, setConversationsWithUnread] = useState<Record<string, number>>({});

  // Use the chat hook
  const {
    conversations,
    loading,
    error,
    // unreadCount,
    fetchConversations,
    // fetchUnreadCount,
    fetchUnreadCountByConversation,
    createPrivateConversation,
    createGroupConversation,
    fetchParticipantInformation
  } = useChat(accountId);

  // Get the tab store functions
  const { addTab, tabs } = useTabStore();

  // Load unread count data
  // Replace the useEffect that fetches unread counts
  useEffect(() => {
    if (accountId) {
      fetchConversations();
    }
  }, [accountId]);

  // Replace the polling interval too
  useEffect(() => {
    if (accountId) {
      const intervalId = setInterval(() => {
        if (loading) return;
        fetchConversations();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [accountId]);

  // Load conversation names
  useEffect(() => {
    loadConversationNames().then(() => {
      fetchUnreadCountByConversation().then((unreadCounts) => {
        if (unreadCounts) {
          setConversationsWithUnread(unreadCounts);
        }
      });
    });
  }, [conversations]);

  // Get participant name from conversation
  const getConversationName = useCallback(async (conversation: Conversation) => {
    if (conversation.type === 'group' && conversation.name) {
      return conversation.name;
    }

    // For private conversations, show the other participant's name
    const otherParticipantInfo = await fetchParticipantInformation(conversation._id, "private");
    return otherParticipantInfo ? otherParticipantInfo.name : 'Unknown';
  }, [fetchParticipantInformation]);

  const loadConversationNames = useCallback(async () => {
    const names: Record<string, string> = {};

    for (const conversation of conversations) {
      const name = await getConversationName(conversation);
      names[conversation._id] = name;
    }

    setConversationNames(names);
  }, [conversations, getConversationName]);

  // Function to select and open a conversation in a new tab
  const handleSelectConversation = useCallback((conversationId: string) => {
    // Find the conversation to get its data for the tab title
    const conversation = conversations.find(conv => conv._id === conversationId);
    if (!conversation) return;

    // Get a title for the tab based on conversation type
    let tabTitle = 'Chat';

    if (conversation.type === 'private') {
      // For private chats, use the other participant's name
      tabTitle = conversationNames[conversationId] || 'Chat';
    } else if (conversation.type === 'group' && conversation.name) {
      // For group chats, use the group name
      tabTitle = conversation.name;
    }

    // Add a new tab with ChatConversation component
    addTab(
      tabTitle,
      null,
      ComponentTypes.CHAT_CONVERSATION,
      {
        accountId,
        conversationId
      }
    );

    // Clear unread count from this conversation
    setConversationsWithUnread(prev => ({
      ...prev,
      [conversationId]: 0
    }));

  }, [conversations, addTab, accountId, conversationNames]);

  // Handle creating a private conversation
  const handleCreatePrivateConversation = async (contact: PersonType) => {
    if (!contact.emailAddresses) return;

    // Extract the contact ID from resourceName
    const emailAddresses = contact.emailAddresses.find(v => v.metadata?.primary)?.value;
    if (!emailAddresses) return;

    // Check if the contact is a user in the system
    const account = await searchAccounts(emailAddresses!);
    if (!account || !account.accountId) {
      console.error("Contact doesn't use fusion space application");
      return;
    }

    const conversationId = await createPrivateConversation(account.accountId);
    if (conversationId) {
      handleSelectConversation(conversationId);
      setShowContactSearch(false);
    }
  };

  // Handle creating a group conversation
  const handleCreateGroupConversation = async (groupName: string, contacts: PersonType[]) => {
    if (!groupName.trim() || contacts.length === 0) return;

    // Extract participant IDs from resourceName
    const participantPromises = contacts.map(async (contact) => {
      const emailAddresses = contact.emailAddresses?.find(v => v.metadata?.primary)?.value;
      if (!emailAddresses) return null;
      const account = await searchAccounts(emailAddresses);
      return account?.accountId || null;
    });

    const participantIds = (await Promise.all(participantPromises))
      .filter((id): id is string => id !== null);

    if (participantIds.length === 0) {
      console.error("No valid participants found");
      return;
    }

    const conversationId = await createGroupConversation(groupName, participantIds);
    if (conversationId) {
      handleSelectConversation(conversationId);
      setShowNewGroup(false);
    }
  };

  // Handle conversation search input change
  const handleConversationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConversationSearchQuery(e.target.value);
  };

  // Check if a conversation is already open in a tab
  const isConversationOpen = (conversationId: string) => {
    return tabs.some(tab =>
      tab.componentType === ComponentTypes.CHAT_CONVERSATION &&
      tab.props?.conversationId === conversationId
    );
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!conversationSearchQuery) return true;

    const name = conversationNames[conversation._id] || '';
    return name.toLowerCase().includes(conversationSearchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Messages</h1>
          <div className="flex space-x-2">
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setShowContactSearch(true)}
              title="New conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => fetchConversations()}
              title="Refresh conversation">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setShowNewGroup(true)}
              title="New group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search conversations */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={conversationSearchQuery}
            onChange={handleConversationSearchChange}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <p>{error}</p>
            <button
              className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
              onClick={fetchConversations}
            >
              Retry
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>
              {conversationSearchQuery
                ? "No conversations match your search"
                : "No conversations yet"}
            </p>
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              onClick={() => setShowContactSearch(true)}
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          <ul>
            {filteredConversations.map((conversation) => {
              const isOpen = isConversationOpen(conversation._id);
              const conversationName = conversationNames[conversation._id] || 'Loading...';
              const unreadMessagesCount = conversationsWithUnread[conversation._id] || 0;
              // const totalUnreadCount = Object.values(conversationsWithUnread).reduce((a, b) => a + b, 0);

              return (
                <li
                  key={conversation._id}
                  className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${isOpen ? 'bg-blue-50' : ''
                    } ${unreadMessagesCount > 0 ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectConversation(conversation._id)}
                >
                  <div className="relative flex justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className={`font-medium ${unreadMessagesCount > 0 ? 'font-bold text-black' : 'text-gray-700'}`}>
                          {conversationName}
                        </h3>
                        {unreadMessagesCount > 0 && (
                          <span className="ml-2 bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {unreadMessagesCount}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className={`text-sm ${unreadMessagesCount > 0 ? 'text-gray-800' : 'text-gray-500'} truncate`}>
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-500">
                      {conversation.lastMessage && (
                        <span>
                          {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Contact search modal */}
      {showContactSearch && (
        <ContactSearchComponent
          accountId={accountId}
          onClose={() => setShowContactSearch(false)}
          onSelectContact={handleCreatePrivateConversation}
        />
      )}

      {/* New group modal */}
      {showNewGroup && (
        <CreateGroupComponent
          accountId={accountId}
          onClose={() => setShowNewGroup(false)}
          onCreateGroup={handleCreateGroupConversation}
        />
      )}
    </div>
  );
};

export default ChatSummaryView;