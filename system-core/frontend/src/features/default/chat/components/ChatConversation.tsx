import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../../conf/axios';

interface ChatDetailViewProps {
  accountId: string;
  conversationId: string | null;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: string;
  read: boolean;
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

interface UserTyping {
  userId: string;
  displayName: string;
}

export const ChatConversation: React.FC<ChatDetailViewProps> = ({ accountId, conversationId }) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState<UserTyping[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const userTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!accountId) return;

    const socket = io(`${API_BASE_URL}/chat`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      // Authenticate with the server
      socket.emit('authenticate', accountId);
    });

    socket.on('authenticated', () => {
      console.log('Socket authenticated');
      // Join conversation room if available
      if (conversationId) {
        socket.emit('join_conversation', conversationId);
      }
    });

    socket.on('error', (data) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });

    socket.on('new_message', (data) => {
      setMessages(prevMessages => {
        // Avoid duplicates
        if (prevMessages.some(msg => msg._id === data._id)) {
          return prevMessages;
        }
        return [...prevMessages, data];
      });
      // Mark messages as read if they're not from current user
      if (data.sender !== accountId) {
        socket.emit('mark_read', data.conversationId);
      }
    });

    socket.on('user_typing', (data) => {
      if (data.userId === accountId) return;
      
      const displayName = participantNames[data.userId] || `User ${data.userId.slice(0, 6)}...`;
      
      setTyping(prev => {
        if (prev.some(user => user.userId === data.userId)) {
          return prev;
        }
        return [...prev, { userId: data.userId, displayName }];
      });

      // Clear typing indicator after 3 seconds
      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
      }
      
      typingTimeoutRef.current[data.userId] = setTimeout(() => {
        setTyping(prev => prev.filter(user => user.userId !== data.userId));
      }, 3000);
    });

    socket.on('user_stopped_typing', (data) => {
      setTyping(prev => prev.filter(user => user.userId !== data.userId));
      
      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
        delete typingTimeoutRef.current[data.userId];
      }
    });

    socket.on('messages_read', (data) => {
      // Update read status for messages when they're read by other users
      if (data.userId !== accountId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.sender === accountId && !msg.read ? { ...msg, read: true } : msg
          )
        );
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      // Clean up socket connection and leave conversation room
      if (conversationId && socket.connected) {
        socket.emit('leave_conversation', conversationId);
      }
      socket.disconnect();
    };
  }, [accountId]);

  // Join/leave conversation room when conversationId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    // Clean up previous conversation
    if (conversation && conversation._id) {
      socket.emit('leave_conversation', conversation._id);
    }

    // Reset states for new conversation
    setMessages([]);
    setTyping([]);
    setConversation(null);
    setError(null);

    // Join new conversation if available
    if (conversationId) {
      socket.emit('join_conversation', conversationId);
      fetchConversationData();
      fetchMessages();
    }
  }, [conversationId]);

  // Fetch conversation data
  const fetchConversationData = useCallback(async () => {
    if (!accountId || !conversationId) return;

    setLoading(true);
    try {
      // Get conversations to find the current one
      const response = await axios.get(`${API_BASE_URL}/chat/${accountId}/conversations`, {
        withCredentials: true
      });
      
      const currentConversation = response.data.find((conv: Conversation) => 
        conv._id === conversationId
      );
      
      if (currentConversation) {
        setConversation(currentConversation);
        // Fetch participant names
        fetchParticipantNames(currentConversation.participants);
      } else {
        setError('Conversation not found');
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation details');
    } finally {
      setLoading(false);
    }
  }, [accountId, conversationId]);

  // Fetch participant names using the useContacts approach
  const fetchParticipantNames = async (participantIds: string[]) => {
    if (!accountId) return;
    
    const participants: Record<string, string> = {};
    
    // Hypothetical implementation - in a real app you would use the useContacts hook
    // This is a simplified version for demo purposes
    for (const participantId of participantIds) {
      if (participantId === accountId) {
        participants[participantId] = 'You';
        continue;
      }
      
      try {
        // Mock implementation - in real app you'd use the contacts/user data API
        const response = await axios.get(
          `${API_BASE_URL}/account/${participantId}/email`,
          { withCredentials: true }
        );
        
        participants[participantId] = response.data.email || `User ${participantId.slice(0, 6)}...`;
      } catch (err) {
        console.error(`Error fetching user ${participantId} info:`, err);
        participants[participantId] = `User ${participantId.slice(0, 6)}...`;
      }
    }
    
    setParticipantNames(participants);
  };

  // Fetch messages for current conversation
  const fetchMessages = useCallback(async () => {
    if (!accountId || !conversationId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/${accountId}/conversations/${conversationId}/messages`,
        { withCredentials: true }
      );
      
      setMessages(response.data);
      
      // Mark messages as read
      if (response.data.length > 0) {
        markMessagesAsRead();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [accountId, conversationId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(() => {
    if (!accountId || !conversationId || !socketRef.current) return;
    
    socketRef.current.emit('mark_read', conversationId);
    
    // Also update local state
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.sender !== accountId && !msg.read ? { ...msg, read: true } : msg
      )
    );
  }, [accountId, conversationId]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!accountId || !conversationId || !messageText.trim() || !socketRef.current) return;
    
    // Stop typing indicator
    handleStopTyping();
    
    // Emit message to server
    socketRef.current.emit('send_message', {
      conversationId,
      content: messageText.trim()
    });
    
    // Clear message input
    setMessageText('');
  }, [accountId, conversationId, messageText]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!accountId || !conversationId || !socketRef.current) return;
    
    // Don't send typing events too frequently
    if (!userTypingTimeoutRef.current) {
      socketRef.current.emit('typing_start', conversationId);
      
      userTypingTimeoutRef.current = setTimeout(() => {
        userTypingTimeoutRef.current = null;
      }, 2000);
    }
  }, [accountId, conversationId]);

  const handleStopTyping = useCallback(() => {
    if (!accountId || !conversationId || !socketRef.current) return;
    
    socketRef.current.emit('typing_stop', conversationId);
    
    if (userTypingTimeoutRef.current) {
      clearTimeout(userTypingTimeoutRef.current);
      userTypingTimeoutRef.current = null;
    }
  }, [accountId, conversationId]);

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keypress for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 text-gray-600">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No conversation selected</h2>
          <p>Select a conversation from the list or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between shadow-sm">
        {loading ? (
          <div className="animate-pulse h-6 w-40 bg-gray-200 rounded"></div>
        ) : (
          <div>
            <h2 className="font-semibold text-lg">
              {conversation?.type === 'group' 
                ? conversation.name 
                : participantNames[conversation?.participants?.find(id => id !== accountId) || ''] || 'Loading...'}
            </h2>
            <div className="text-sm text-gray-500">
              {conversation?.type === 'group' && `${conversation.participants.length} participants`}
            </div>
          </div>
        )}
      </div>

      {/* Message container */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div 
                key={message._id} 
                className={`flex ${message.sender === accountId ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`rounded-lg px-4 py-2 max-w-xs md:max-w-md ${
                    message.sender === accountId 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border text-gray-800'
                  }`}
                >
                  {message.sender !== accountId && (
                    <div className="text-xs text-gray-600 mb-1">
                      {participantNames[message.sender] || `User ${message.sender.slice(0, 6)}...`}
                    </div>
                  )}
                  <div>{message.content}</div>
                  <div className="text-xs mt-1 flex justify-end items-center">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.sender === accountId && (
                      <span className="ml-1">
                        {message.read ? (
                          <svg className="h-3 w-3 text-blue-200" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm1.41 1.41L15 12.81l-2.59-2.59-1.41 1.41L15 15.41l6.41-6.41-1.41-1.41z"/>
                          </svg>
                        ) : (
                          <svg className="h-3 w-3 text-blue-200" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing indicator */}
        {typing.length > 0 && (
          <div className="flex items-center text-sm text-gray-500 italic">
            {typing.length === 1 
              ? `${typing[0].displayName} is typing...` 
              : `${typing.length} people are typing...`
            }
            <div className="flex ml-2">
              <div className="dot-typing"></div>
            </div>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-3 bg-white border-t">
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center">
          <textarea
            className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            onKeyUp={handleTyping}
            onBlur={handleStopTyping}
            disabled={loading}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg"
            onClick={sendMessage}
            disabled={!messageText.trim() || loading}
          >
            Send
          </button>
        </div>
      </div>

      {/* CSS for typing animation */}
      <style jsx>{`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: #9ca3af;
          color: #9ca3af;
          box-shadow: 9984px 0 0 0 #9ca3af, 9994px 0 0 0 #9ca3af, 10004px 0 0 0 #9ca3af;
          animation: dotTyping 1.5s infinite linear;
        }

        @keyframes dotTyping {
          0% {
            box-shadow: 9984px 0 0 0 #9ca3af, 9994px 0 0 0 #9ca3af, 10004px 0 0 0 #9ca3af;
          }
          16.667% {
            box-shadow: 9984px -5px 0 0 #9ca3af, 9994px 0 0 0 #9ca3af, 10004px 0 0 0 #9ca3af;
          }
          33.333% {
            box-shadow: 9984px 0 0 0 #9ca3af, 9994px -5px 0 0 #9ca3af, 10004px 0 0 0 #9ca3af;
          }
          50% {
            box-shadow: 9984px 0 0 0 #9ca3af, 9994px 0 0 0 #9ca3af, 10004px -5px 0 0 #9ca3af;
          }
          66.667% {
            box-shadow: 9984px 0 0 0 #9ca3af, 9994px 0 0 0 #9ca3af, 10004px 0 0 0 #9ca3af;
          }
          83.333% {
            box-shadow: 9984px 0 0 0 #9ca3af, 9994px 0 0 0 #9ca3af, 10004px 0 0 0 #9ca3af;
          }
          100% {
            box-shadow: 9984px 0 0 0 #9ca3af, 9994px 0 0 0 #9ca3af, 10004px 0 0 0 #9ca3af;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatConversation;