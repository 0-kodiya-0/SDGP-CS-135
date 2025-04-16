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

interface Participant {
  _id: string;
  email: string;
  name?: string;
  imageUrl: string;
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
  const [participants, setParticipants] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState<UserTyping[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const userTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch participant names directly from the API
  const fetchParticipants = useCallback(async (conversationType: string | undefined) => {
    if (!accountId || !conversationId || !conversationType) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/${accountId}/conversations/${conversationId}/participants?conversationType=${conversationType}`,
        { withCredentials: true }
      );

      const participantsData = response.data.data;
      const participantsMap: Record<string, string> = {};

      if (conversationType === "private") {
        participantsMap[participantsData._id] = participantsData.name || participantsData.email || `User ${participantsData._id.slice(0, 6)}...`;
      } else {
        participantsData.forEach((participant: Participant) => {
          if (participant._id === accountId) {
            participantsMap[participant._id] = 'You';
          } else {
            participantsMap[participant._id] = participant.name || participant.email || `User ${participant._id.slice(0, 6)}...`;
          }
        });
      }

      setParticipants(participantsMap);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participant information');
    }
  }, [accountId, conversationId]);

  // Fetch conversation data
  const fetchConversationData = useCallback(async () => {
    if (!accountId || !conversationId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/${accountId}/conversations/${conversationId}`,
        { withCredentials: true }
      );

      setConversation(response.data.data);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation details');
    } finally {
      setLoading(false);
    }
  }, [accountId, conversationId]);

  // Fetch messages for current conversation
  const fetchMessages = useCallback(async () => {
    if (!accountId || !conversationId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/${accountId}/conversations/${conversationId}/messages`,
        { withCredentials: true }
      );

      setMessages(response.data.data);

      // Mark messages as read
      if (response.data.data.length > 0 && socketRef.current?.connected) {
        socketRef.current.emit('mark_read', conversationId);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [accountId, conversationId]);

  // Initialize socket connection
  useEffect(() => {
    if (!accountId) return;

    const socket = io(`http://localhost:8080`, {
      withCredentials: true,
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      socket.emit('authenticate', accountId);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setError(`Connection error: ${error.message}`);
    });

    socket.on('authenticated', () => {
      console.log('Socket authenticated');
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

      const displayName = participants[data.userId] || `User ${data.userId.slice(0, 6)}...`;

      setTyping(prev => {
        if (prev.some(user => user.userId === data.userId)) {
          return prev;
        }
        return [...prev, { userId: data.userId, displayName }];
      });

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
      if (conversationId && socket.connected) {
        socket.emit('leave_conversation', conversationId);
      }
      socket.disconnect();
    };
  }, [accountId]);

  // Load conversation data and messages when conversationId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !accountId || !conversationId) return;

    // Clean up previous conversation
    if (socket.connected) {
      socket.emit('leave_conversation', conversationId);
    }

    // Reset states for new conversation
    setMessages([]);
    setTyping([]);
    setConversation(null);
    setError(null);

    // Join new conversation
    if (socket.connected) {
      socket.emit('join_conversation', conversationId);
    }

    // Load conversation data and messages
    fetchConversationData().catch(err => {
      console.error('Error initializing conversation:', err);
    });

  }, [conversationId, accountId]);

  useEffect(() => {
    if (!conversation?.type) return;
    fetchParticipants(conversation.type).then(() => {
      fetchMessages()
    })
  }, [conversation]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!accountId || !conversationId || !socketRef.current?.connected) return;

    if (!userTypingTimeoutRef.current) {
      socketRef.current.emit('typing_start', conversationId);

      userTypingTimeoutRef.current = setTimeout(() => {
        userTypingTimeoutRef.current = null;
      }, 2000);
    }
  }, [accountId, conversationId]);

  const handleStopTyping = useCallback(() => {
    if (!accountId || !conversationId || !socketRef.current?.connected) return;

    socketRef.current.emit('typing_stop', conversationId);

    if (userTypingTimeoutRef.current) {
      clearTimeout(userTypingTimeoutRef.current);
      userTypingTimeoutRef.current = null;
    }
  }, [accountId, conversationId]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!accountId || !conversationId || !messageText.trim() || !socketRef.current?.connected) return;

    handleStopTyping();

    socketRef.current.emit('send_message', {
      conversationId,
      content: messageText.trim()
    });

    setMessageText('');
  }, [accountId, conversationId, handleStopTyping, messageText]);

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
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Conversation header */}
      <div className="px-4 py-3 bg-white shadow-sm flex items-center">
        {loading && !conversation ? (
          <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <h2 className="font-medium text-gray-800">
            {conversation?.type === 'group'
              ? conversation.name
              : participants[conversation?.participants?.find(id => id !== accountId) || ''] || 'Loading...'}
          </h2>
        )}
      </div>

      {/* Message container */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-16">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-16 text-gray-400 text-sm">
            No messages yet
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div
                key={message._id}
                className={`flex ${message.sender === accountId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-xs md:max-w-md ${message.sender === accountId
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                    }`}
                >
                  {message.sender !== accountId && participants[message.sender] && (
                    <div className="text-xs text-gray-500 mb-1">
                      {participants[message.sender]}
                    </div>
                  )}
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs mt-1 flex justify-end items-center opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.sender === accountId && (
                      <span className="ml-1">
                        {message.read ? (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
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
          <div className="flex items-center text-xs text-gray-500 p-2">
            <span className="italic mr-2">
              {typing.length === 1
                ? `${typing[0].displayName} is typing...`
                : `${typing.length} people are typing...`
              }
            </span>
            <span className="flex space-x-1">
              <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            </span>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-3 bg-white border-t">
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded mb-2 text-xs">
            {error}
            <button
              className="ml-2 text-red-800"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden border">
          <textarea
            className="flex-1 p-2 bg-transparent text-sm focus:outline-none resize-none"
            rows={1}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            onKeyUp={handleTyping}
            onBlur={handleStopTyping}
            disabled={loading}
          />
          <button
            className="px-4 py-2 text-gray-500 hover:text-blue-500 transition-colors"
            onClick={sendMessage}
            disabled={!messageText.trim() || loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"

              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;