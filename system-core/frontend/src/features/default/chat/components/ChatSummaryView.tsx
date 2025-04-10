import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../../../conf/axios';
import { PersonType, useContacts } from '../../contacts';
import { useServicePermissions } from '../../user_account/hooks/useServicePermissions.google';
import { ComponentTypes, useTabStore } from '../../../required/tab_view';

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

interface AccountInfo {
  email: string;
  name?: string;
  id: string;
}

export const ChatSummaryView: React.FC<ChatSummaryViewProps> = ({
  accountId
}) => {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<PersonType[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Get the tab store functions
  const { addTab, tabs } = useTabStore();

  // Permissions checking
  const {
    permissions,
    permissionsLoading,
    permissionError,
    checkAllServicePermissions: checkAllPeoplePermissions,
  } = useServicePermissions(accountId, 'people');

  // Initialize contacts hook when permissions are available
  const {
    contacts,
    loading: contactsLoading,
    searchContacts,
  } = useContacts(accountId);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/chat/${accountId}/conversations`,
        { withCredentials: true }
      );
      
      if (response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
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
      
      if (response.data && response.data.count !== undefined) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [accountId]);

  // Fetch account details
  const fetchAccountDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/account/${accountId}`,
        { withCredentials: true }
      );
      
      const emailResponse = await axios.get(
        `${API_BASE_URL}/api/v1/account/${accountId}/email`,
        { withCredentials: true }
      );
      
      if (response.data && emailResponse.data) {
        setAccountInfo({
          id: accountId,
          email: emailResponse.data.email,
          name: response.data.name || emailResponse.data.email.split('@')[0]
        });
      }
    } catch (error) {
      console.error('Failed to fetch account details:', error);
    }
  }, [accountId]);

  // Function to select and open a conversation in a new tab
  const handleSelectConversation = useCallback((conversationId: string) => {
    // Find the conversation to get its data for the tab title
    const conversation = conversations.find(conv => conv._id === conversationId);
    if (!conversation) return;
    
    // Get a title for the tab
    let tabTitle = '';
    if (conversation.type === 'group' && conversation.name) {
      tabTitle = conversation.name;
    } else {
      const otherParticipantId = conversation.participants.find(id => id !== accountId);
      tabTitle = otherParticipantId ? `Chat with ${getConversationName(conversation)}` : 'Chat';
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
  }, [accountId, conversations]);

  // Effect to check permissions and load initial data
  useEffect(() => {
    if (accountId) {
      checkAllPeoplePermissions(false);
      fetchAccountDetails();
      fetchConversations();
      fetchUnreadCount();
      
      // Set up polling for unread count and conversations
      const intervalId = setInterval(() => {
        fetchUnreadCount();
        fetchConversations();
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [accountId]);

  // Handle contact search
  const handleSearchContacts = async (query: string) => {
    if (!query.trim() || !permissions?.readonly?.hasAccess) return;
    
    const result = await searchContacts(query, {
      pageSize: 10,
      readMask: 'names,emailAddresses,phoneNumbers,photos'
    });
    
    if (result) {
      console.log(result)
    }
  };

  // Handle creating a private conversation
  const handleCreatePrivateConversation = async (otherUserId: string) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/chat/${accountId}/conversations/private`,
        { otherUserId },
        { withCredentials: true }
      );
      
      if (response.data) {
        fetchConversations();
        handleSelectConversation(response.data._id);
        setShowContactSearch(false);
      }
    } catch (error) {
      console.error('Failed to create private conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a group conversation
  const handleCreateGroupConversation = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;
    
    try {
      setLoading(true);
      const participantIds = selectedContacts.map(contact => 
        contact.resourceName.split('/').pop() || ''
      );
      
      const response = await axios.post(
        `${API_BASE_URL}/chat/${accountId}/conversations/group`,
        { 
          name: groupName, 
          participants: participantIds 
        },
        { withCredentials: true }
      );
      
      if (response.data) {
        fetchConversations();
        handleSelectConversation(response.data._id);
        setShowNewGroup(false);
        setGroupName('');
        setSelectedContacts([]);
      }
    } catch (error) {
      console.error('Failed to create group conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      handleSearchContacts(query);
    }
  };

  // Select/deselect a contact
  const toggleContactSelection = (contact: PersonType) => {
    if (selectedContacts.some(c => c.resourceName === contact.resourceName)) {
      setSelectedContacts(selectedContacts.filter(c => c.resourceName !== contact.resourceName));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  // Get participant name from conversation
  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group' && conversation.name) {
      return conversation.name;
    }
    
    // For private conversations, show the other participant's name
    // In a real app, you would fetch and display the actual name
    const otherParticipantId = conversation.participants.find(id => id !== accountId);
    return otherParticipantId ? `User ${otherParticipantId.slice(0, 6)}...` : 'Unknown';
  };

  // Check if a conversation is already open in a tab
  const isConversationOpen = (conversationId: string) => {
    return tabs.some(tab => 
      tab.componentType === ComponentTypes.CHAT_CONVERSATION && 
      tab.props?.conversationId === conversationId
    );
  };

  // Handle permission error
  if (permissionError && !permissionsLoading) {
    return (
      <div className="p-4">
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-red-800 font-medium">Permission Error</h3>
          <p className="text-red-700 mt-2">{permissionError}</p>
          <button 
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded"
            onClick={() => checkAllPeoplePermissions(true)}
          >
            Retry Permissions Check
          </button>
        </div>
      </div>
    );
  }

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
            onChange={(e) => console.log('Search conversations:', e.target.value)}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No conversations yet</p>
            <button 
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              onClick={() => setShowContactSearch(true)}
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          <ul>
            {conversations.map((conversation) => {
              const isOpen = isConversationOpen(conversation._id);
              
              return (
                <li 
                  key={conversation._id}
                  className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                    isOpen ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation._id)}
                >
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{getConversationName(conversation)}</h3>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.sender === accountId ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <div className="text-xs text-gray-500">
                        {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* New Conversation Modal */}
      {showContactSearch && (
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
                    New Conversation
                  </h3>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Search contacts by name or email..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>

                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {contactsLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    ) : contacts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        {searchQuery ? 'No contacts found' : 'Search for contacts to start a conversation'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {contacts.map((contact) => {
                          const name = contact.names && contact.names[0]?.displayName || 'Unnamed Contact';
                          const email = contact.emailAddresses && contact.emailAddresses[0]?.value || '';
                          const resourceId = contact.resourceName.split('/').pop() || '';
                          
                          return (
                            <li 
                              key={contact.resourceName}
                              className="py-3 flex items-center hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleCreatePrivateConversation(resourceId)}
                            >
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {contact.photos && contact.photos[0]?.url ? (
                                  <img src={contact.photos[0].url} alt={name} className="h-10 w-10 rounded-full" />
                                ) : (
                                  <span className="text-lg font-medium text-gray-500">
                                    {name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{name}</p>
                                {email && <p className="text-sm text-gray-500">{email}</p>}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-200 text-base font-medium text-gray-700 hover:bg-gray-300 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowContactSearch(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
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
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Group name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>

                  {/* Selected contacts */}
                  {selectedContacts.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 mb-2">Selected contacts ({selectedContacts.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedContacts.map((contact) => {
                          const name = contact.names && contact.names[0]?.displayName || 'Unnamed Contact';
                          return (
                            <div 
                              key={contact.resourceName}
                              className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center"
                            >
                              <span>{name}</span>
                              <button 
                                className="ml-2 focus:outline-none"
                                onClick={() => toggleContactSelection(contact)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Search contacts to add..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>

                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {contactsLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    ) : contacts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        {searchQuery ? 'No contacts found' : 'Search for contacts to add to the group'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {contacts.map((contact) => {
                          const name = contact.names && contact.names[0]?.displayName || 'Unnamed Contact';
                          const email = contact.emailAddresses && contact.emailAddresses[0]?.value || '';
                          const isSelected = selectedContacts.some(c => c.resourceName === contact.resourceName);
                          
                          return (
                            <li 
                              key={contact.resourceName}
                              className={`py-3 flex items-center hover:bg-gray-50 cursor-pointer ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => toggleContactSelection(contact)}
                            >
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {contact.photos && contact.photos[0]?.url ? (
                                  <img src={contact.photos[0].url} alt={name} className="h-10 w-10 rounded-full" />
                                ) : (
                                  <span className="text-lg font-medium text-gray-500">
                                    {name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">{name}</p>
                                {email && <p className="text-sm text-gray-500">{email}</p>}
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0 text-blue-500">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none disabled:bg-blue-300 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCreateGroupConversation}
                  disabled={!groupName.trim() || selectedContacts.length === 0}
                >
                  Create Group
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowNewGroup(false);
                    setGroupName('');
                    setSelectedContacts([]);
                    setSearchQuery('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSummaryView;