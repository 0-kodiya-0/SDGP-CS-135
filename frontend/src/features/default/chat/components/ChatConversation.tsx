import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useChatSocket } from '../contexts/ChatContext';
import { useChatData } from '../hooks/useChatData';

interface ChatDetailViewProps {
  accountId: string;
  conversationId: string | null;
}

export const ChatConversation: React.FC<ChatDetailViewProps> = memo(({
  accountId,
  conversationId
}) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const userTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use chat data hook for caching and data management
  const {
    chatData,
    isLoading,
    error,
    typingUsers,
    loadConversation,
  } = useChatData(accountId, conversationId);

  // Use socket hook for real-time operations
  const {
    sendMessage,
    startTyping,
    stopTyping,
    isConnected,
  } = useChatSocket(accountId);

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData?.messages]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!conversationId || !isConnected) return;

    if (!userTypingTimeoutRef.current) {
      startTyping(conversationId);

      userTypingTimeoutRef.current = setTimeout(() => {
        userTypingTimeoutRef.current = null;
      }, 2000);
    }
  }, [conversationId, isConnected, startTyping]);

  const handleStopTyping = useCallback(() => {
    if (!conversationId || !isConnected) return;

    stopTyping(conversationId);

    if (userTypingTimeoutRef.current) {
      clearTimeout(userTypingTimeoutRef.current);
      userTypingTimeoutRef.current = null;
    }
  }, [conversationId, isConnected, stopTyping]);

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!conversationId || !messageText.trim() || !isConnected) return;

    handleStopTyping();

    const success = sendMessage(conversationId, messageText.trim());
    if (success) {
      setMessageText('');
    }
  }, [conversationId, messageText, isConnected, sendMessage, handleStopTyping]);

  // Handle keypress for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (userTypingTimeoutRef.current) {
        clearTimeout(userTypingTimeoutRef.current);
      }
    };
  }, []);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  if (isLoading && !chatData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-500">Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (error && !chatData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading conversation</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadConversation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { conversation, messages, participants } = chatData || {
    conversation: null,
    messages: [],
    participants: {}
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        <p>Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Connection status (if disconnected) */}
      {!isConnected && (
        <div className="bg-red-100 border-b border-red-200 px-4 py-2">
          <p className="text-red-700 text-sm">
            ⚠️ Connection lost. Messages may not be sent until reconnected.
          </p>
        </div>
      )}

      {/* Message container */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-16 text-gray-400 text-sm">
            No messages yet
          </div>
        ) : (
          <>
            {messages.map(message => {
              const participant = participants[message.sender];
              const participantImage = participant?.imageUrl;
              const participantName = participant?.name || `User ${message.sender.slice(0, 6)}...`;

              return (
                <div
                  key={message._id}
                  className={`flex ${message.sender === accountId ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender !== accountId && (
                    <div className="flex-shrink-0 mr-2">
                      {participantImage ? (
                        <img
                          src={participantImage}
                          alt={participantName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          {participantName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 max-w-xs md:max-w-md ${message.sender === accountId
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                      }`}
                  >
                    {message.sender !== accountId && (
                      <div className="text-xs text-gray-500 mb-1">
                        {participantName}
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
                  {message.sender === accountId && (
                    <div className="flex-shrink-0 ml-2">
                      {participantImage ? (
                        <img
                          src={participantImage}
                          alt="You"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-blue-300 flex items-center justify-center text-blue-600">
                          Y
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center text-xs text-gray-500 p-2">
            <span className="italic mr-2">
              {typingUsers.length === 1
                ? `${typingUsers[0].displayName} is typing...`
                : `${typingUsers.length} people are typing...`
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
            disabled={isLoading || !isConnected}
          />
          <button
            className="px-4 py-2 text-gray-500 hover:text-blue-500 transition-colors disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isLoading || !isConnected}
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
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return prevProps.accountId === nextProps.accountId &&
    prevProps.conversationId === nextProps.conversationId;
});

export default ChatConversation;