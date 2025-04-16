import React, { useState, useCallback, useEffect } from 'react';
import { PersonType } from '../../contacts';
import { ComponentTypes, useTabStore } from '../../../required/tab_view';
import ContactSearchComponent from './ContactSearchComponent';
import { useChat } from '../hooks/useChat';
import { searchAccounts } from '../../user_account/utils/account.utils';

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
}

export const ChatSummaryView: React.FC<ChatSummaryViewProps> = ({
  accountId
}) => {
  // State management
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<PersonType[]>([]);
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [conversationNames, setConversationNames] = useState<Record<string, string>>({});

  // Use the chat hook
  const {
    conversations,
    loading,
    error,
    unreadCount,
    fetchConversations,
    fetchUnreadCount,
    createPrivateConversation,
    createGroupConversation,
    fetchParticipantInformation
  } = useChat(accountId);

  // Get the tab store functions
  const { addTab, tabs } = useTabStore();

  // Set up polling for unread count and conversations
  // useEffect(() => {
  //   if (accountId) {
  //     const intervalId = setInterval(() => {
  //       fetchUnreadCount();
  //       fetchConversations();
  //     }, 30000); // Poll every 30 seconds

  //     return () => clearInterval(intervalId);
  //   }
  // }, [accountId]);

  useEffect(() => {
    console.log(conversationSearchQuery);
  }, [conversationSearchQuery])

  // Get participant name from conversation
  const getConversationName = useCallback(async (conversation: Conversation) => {
    if (conversation.type === 'group' && conversation.name) {
      return conversation.name;
    }

    // For private conversations, show the other participant's name
    // In a real app, you would fetch and display the actual name
    const otherParticipantInfo = await fetchParticipantInformation(conversation._id, "private");
    return otherParticipantInfo ? otherParticipantInfo.name : 'Unknown';
  }, [fetchParticipantInformation]);

  // Load conversation names
  useEffect(() => {
    const loadConversationNames = async () => {
      const names: Record<string, string> = {};

      for (const conversation of conversations) {
        const name = await getConversationName(conversation);
        names[conversation._id] = name;
      }

      setConversationNames(names);
    };

    loadConversationNames();
  }, [conversations, getConversationName]);

  // Function to select and open a conversation in a new tab
  const handleSelectConversation = useCallback((conversationId: string) => {
    // Find the conversation to get its data for the tab title
    const conversation = conversations.find(conv => conv._id === conversationId);
    if (!conversation) return;

    // Get a title for the tab
    const tabTitle = conversationNames[conversationId] || 'Chat';

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
  }, [conversations, addTab, accountId, conversationNames]);

  // Handle creating a private conversation
  const handleCreatePrivateConversation = async (contact: PersonType) => {
    if (!contact.emailAddresses) return;

    // Extract the contact ID from resourceName
    const emailAddresses = contact.emailAddresses.find(v => v.metadata?.primary)?.value;
    if (!emailAddresses) return;

    // Check if trying to chat with self
    const account = await searchAccounts(emailAddresses!);
    if (!account || !account.accountId) {
      // Show error or notification that you can't chat with yourself
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
  const handleCreateGroupConversation = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;

    // Extract participant IDs from resourceName
    let participantIds = await Promise.all(selectedContacts
      .map(async (contact) => {
        const emailAddresses = contact.emailAddresses?.find(v => v.metadata?.primary)?.value;
        if (!emailAddresses) return;
        return await searchAccounts(emailAddresses);
      }));

    participantIds = participantIds.map(account => {
      if (!account || !account.accountId) return null;
      return account.accountId;
    }).filter(account => account !== null);


    console.log(participantIds)

    const conversationId = await createGroupConversation(groupName, participantIds);
    if (conversationId) {
      handleSelectConversation(conversationId);
      setShowNewGroup(false);
      setGroupName('');
      setSelectedContacts([]);
    }
  };

  // Handle conversation search input change
  const handleConversationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConversationSearchQuery(e.target.value);
  };

  // Toggle contact selection for group creation
  const toggleContactSelection = (contact: PersonType) => {
    if (selectedContacts.some(c => c.resourceName === contact.resourceName)) {
      setSelectedContacts(selectedContacts.filter(c => c.resourceName !== contact.resourceName));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
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

              return (
                <li
                  key={conversation._id}
                  className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${isOpen ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => handleSelectConversation(conversation._id)}
                >
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{conversationName}</h3>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
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
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New Group
                  </h3>
                  <div className="mt-4">
                    <label htmlFor="group-name" className="block text-sm font-medium text-gray-700">
                      Group Name
                    </label>
                    <input
                      type="text"
                      id="group-name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Add Participants
                    </label>

                    {/* Selected contacts display */}
                    {selectedContacts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedContacts.map(contact => {
                          const name = contact.names && contact.names[0]?.displayName || 'Unnamed Contact';

                          return (
                            <div
                              key={contact.resourceName}
                              className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded flex items-center"
                            >
                              <span>{name}</span>
                              <button
                                type="button"
                                className="ml-1.5 text-blue-400 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleContactSelection(contact);
                                }}
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Contact search component (embedded) */}
                    <div className="mt-3">
                      <ContactSearchComponent
                        accountId={accountId}
                        isEmbedded={true}
                        selectedContacts={selectedContacts}
                        onSelectContact={toggleContactSelection}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:col-start-2 sm:text-sm ${!groupName.trim() || selectedContacts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  onClick={handleCreateGroupConversation}
                  disabled={!groupName.trim() || selectedContacts.length === 0}
                >
                  Create Group
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setShowNewGroup(false);
                    setGroupName('');
                    setSelectedContacts([]);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unread message indicator */}
      {unreadCount > 0 && (
        <div className="fixed bottom-8 right-8 z-10">
          <div className="bg-blue-600 text-white rounded-full px-4 py-2 shadow-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>{unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSummaryView;