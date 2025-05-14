import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/useChatStore';
import { SOCKET_URL } from '../../../../conf/axios';
import { Message } from '../types/types.data';

interface ChatContextType {
  // The store is accessible via the hook, context just manages socket lifecycle
  isConnected: boolean;
  connectionError: string | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  accountId: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, accountId }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const userTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    setSocket,
    getSocket,
    addMessage,
    markAllMessagesAsRead,
    addTypingUser,
    removeTypingUser,
  } = useChatStore();
  
  // Initialize account data
  // useEffect(() => {
  //   initializeAccount(accountId);
  // }, [accountId]);
  
  // Socket management
  useEffect(() => {
    if (!accountId) return;
    
    // Check if socket already exists for this account
    const existingSocket = getSocket(accountId);
    if (existingSocket && existingSocket.connected) {
      socketRef.current = existingSocket;
      setIsConnected(true);
      setConnectionError(null);
      return;
    }
    
    // Create new socket connection
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    
    socketRef.current = socket;
    setSocket(accountId, socket);
    
    // Socket event handlers
    socket.on('connect', () => {
      console.log(`[ChatProvider] Socket connected for account ${accountId}`);
      setIsConnected(true);
      setConnectionError(null);
      socket.emit('authenticate', accountId);
    });
    
    socket.on('connect_error', (error) => {
      console.error(`[ChatProvider] Socket connection error for account ${accountId}:`, error.message);
      setConnectionError(`Connection error: ${error.message}`);
      setIsConnected(false);
    });
    
    socket.on('authenticated', () => {
      console.log(`[ChatProvider] Socket authenticated for account ${accountId}`);
    });
    
    socket.on('error', (data) => {
      console.error(`[ChatProvider] Socket error for account ${accountId}:`, data.message);
      setConnectionError(data.message);
    });
    
    socket.on('new_message', (message: Message) => {
      console.log(`[ChatProvider] New message received:`, message);
      addMessage(accountId, message.conversationId, message);
      
      // Auto-mark as read if message is from current user
      if (message.sender === accountId) {
        socket.emit('mark_read', message.conversationId);
      } else {
        // Update unread count for the conversation
        // This will be refined when we have proper unread count tracking
      }
    });
    
    socket.on('user_typing', (data: { userId: string; conversationId: string }) => {
      if (data.userId === accountId) return;
      
      // Get display name from cached participants or use fallback
      const displayName = `User ${data.userId.slice(0, 6)}...`;
      addTypingUser(accountId, data.userId, displayName, data.conversationId);
      
      // Clear typing after timeout
      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
      }
      
      typingTimeoutRef.current[data.userId] = setTimeout(() => {
        removeTypingUser(accountId, data.userId, data.conversationId);
        delete typingTimeoutRef.current[data.userId];
      }, 3000);
    });
    
    socket.on('user_stopped_typing', (data: { userId: string; conversationId: string }) => {
      removeTypingUser(accountId, data.userId, data.conversationId);
      
      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
        delete typingTimeoutRef.current[data.userId];
      }
    });
    
    socket.on('messages_read', (data: { userId: string; conversationId: string }) => {
      if (data.userId !== accountId) {
        markAllMessagesAsRead(accountId, data.conversationId, accountId);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`[ChatProvider] Socket disconnected for account ${accountId}`);
      setIsConnected(false);
    });
    
    return () => {
      // Don't disconnect socket on unmount - keep it running in background
      // Just clean up timeouts
      Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current = {};
      
      if (userTypingTimeoutRef.current) {
        clearTimeout(userTypingTimeoutRef.current);
        userTypingTimeoutRef.current = null;
      }
    };
  }, [accountId]);
  
  const contextValue: ChatContextType = {
    isConnected,
    connectionError,
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

// Hook for socket operations within chat components
export const useChatSocket = (accountId: string) => {
  const { getSocket } = useChatStore();
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    socketRef.current = getSocket(accountId);
  }, [accountId]);
  
  const sendMessage = (conversationId: string, content: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.error('Socket not connected');
      return false;
    }
    
    socket.emit('send_message', {
      conversationId,
      content: content.trim()
    });
    return true;
  };
  
  const joinConversation = (conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('join_conversation', conversationId);
    }
  };
  
  const leaveConversation = (conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('leave_conversation', conversationId);
    }
  };
  
  const markAsRead = (conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('mark_read', conversationId);
    }
  };
  
  const startTyping = (conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('typing_start', conversationId);
    }
  };
  
  const stopTyping = (conversationId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('typing_stop', conversationId);
    }
  };
  
  return {
    sendMessage,
    joinConversation,
    leaveConversation,
    markAsRead,
    startTyping,
    stopTyping,
    isConnected: socketRef.current?.connected || false,
  };
};