import React, { useState, useCallback, memo } from 'react';
import { ComponentTypes, useTabStore } from '../../../required/tab_view';
import { useChatManagement } from '../hooks/useChatManagement';
import { useChatStore } from '../store/useChatStore';
import ContactSearchComponent from './ContactSearchComponent';
import CreateGroupComponent from './CreateGroupComponent';
import { RefreshCw } from 'lucide-react';

interface ChatSummaryViewProps {
  accountId: string;
}

const ChatSummaryView: React.FC<ChatSummaryViewProps> = memo(({ accountId }) => {
  // State management
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');

  // Use chat management hook
  const {
    conversations,
    loading,
    error,
    unreadCounts,
    refreshAll,
    createConversationWithContact,
    createGroupWithContacts,
  } = useChatManagement(accountId);

  // Get the tab store functions
  const { addTab } = useTabStore();

  // Get conversation display utilities
  const { setConversationUnreadCount } = useChatStore();

  // Handle conversation search input change
  const handleConversationSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConversationSearchQuery(e.target.value);
  }, []);

  // Function to select and open a conversation in a new tab
  const handleSelectConversation = useCallback((conversationId: string) => {
    // Find the conversation to get its data for the tab title
    const conversation = conversations.find(conv => conv._id === conversationId);
    if (!conversation) return;

    // Get a title for the tab
    const tabTitle = conversation.displayName || conversation.name || 'Chat';

    // Add a new tab with ChatConversation component
    addTab(
      accountId,
      tabTitle,
      ComponentTypes.CHAT_CONVERSATION,
      {
        accountId,
        conversationId
      }
    );

    // Clear unread count from this conversation
    setConversationUnreadCount(accountId, conversationId, 0);
  }, [conversations, addTab, accountId, setConversationUnreadCount]);

  // Handle creating a private conversation
  const handleCreatePrivateConversation = useCallback(async (contact: any) => {
    try {
      const conversationId = await createConversationWithContact(contact);
      if (conversationId) {
        // Open the new conversation
        handleSelectConversation(conversationId);
        setShowContactSearch(false);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  }, [createConversationWithContact, handleSelectConversation]);

  // Handle creating a group conversation
  const handleCreateGroupConversation = useCallback(async (groupName: string, contacts: any[]) => {
    try {
      const conversationId = await createGroupWithContacts(groupName, contacts);
      if (conversationId) {
        // Open the new conversation
        handleSelectConversation(conversationId);
        setShowNewGroup(false);
      }
    } catch (error) {
      console.error("Error creating group conversation:", error);
    }
  }, [createGroupWithContacts, handleSelectConversation]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!conversationSearchQuery) return true;

    const name = conversation.displayName || conversation.name || '';
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
                onClick={refreshAll}
                disabled={loading}
                title="Refresh conversations">
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
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
              <button
                className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
                onClick={refreshAll}
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
                const conversationName = conversation.displayName || conversation.name || 'Unknown';
                const unreadMessagesCount = unreadCounts[conversation._id] || 0;
                const conversationImage = conversation.imageUrl;

                return (
                  <li
                    key={conversation._id}
                    className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${unreadMessagesCount > 0 ? 'bg-blue-50' : ''
                      }`}
                    onClick={() => handleSelectConversation(conversation._id)}
                  >
                    <div className="relative flex justify-between">
                      <div className="flex items-center flex-1">
                        {/* Avatar */}
                        <div className="flex-shrink-0 mr-3">
                          {conversationImage ? (
                            <img
                              src={conversationImage}
                              alt={conversationName}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                              {conversationName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className={`font-medium ${unreadMessagesCount > 0 ? 'font-bold text-black' : 'text-gray-700'}`}>
                              {conversationName}
                            </h3>
                            {unreadMessagesCount > 0 && (
                              <span className="ml-2 bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className={`text-sm ${unreadMessagesCount > 0 ? 'text-gray-800' : 'text-gray-500'} truncate`}>
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
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
}, (prevProps, nextProps) => {
  return prevProps.accountId === nextProps.accountId;
});

export default ChatSummaryView;