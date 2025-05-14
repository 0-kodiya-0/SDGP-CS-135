import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Socket } from 'socket.io-client';
import { ConversationSummary, ChatData, TypingUser, Message } from '../types/types.data';

interface ChatState {
  // Account-specific state
  accountData: Record<string, {
    // Conversation list management
    conversations: ConversationSummary[];
    conversationsLoading: boolean;
    conversationsError: string | null;
    
    // Cached chat data (limited by MAX_CACHED_CHATS)
    cachedChats: Record<string, ChatData>;
    
    // Unread counts
    unreadCounts: Record<string, number>;
    totalUnreadCount: number;
    
    // Typing indicators (global for account)
    typingUsers: TypingUser[];
  }>;
  
  // Socket management (shared across accounts but tracked per account)
  sockets: Record<string, Socket | null>;
  
  // Actions
  initializeAccount: (accountId: string) => void;
  
  // Conversation list actions
  setConversations: (accountId: string, conversations: ConversationSummary[]) => void;
  setConversationsLoading: (accountId: string, loading: boolean) => void;
  setConversationsError: (accountId: string, error: string | null) => void;
  updateConversation: (accountId: string, conversation: ConversationSummary) => void;
  
  // Chat cache actions
  setCachedChat: (accountId: string, conversationId: string, chatData: Partial<ChatData>) => void;
  getCachedChat: (accountId: string, conversationId: string) => ChatData | null;
  removeCachedChat: (accountId: string, conversationId: string) => void;
  clearOldCache: (accountId: string) => void;
  markChatAsAccessed: (accountId: string, conversationId: string) => void;
  
  // Message actions
  addMessage: (accountId: string, conversationId: string, message: Message) => void;
  updateMessageReadStatus: (accountId: string, conversationId: string, messageId: string, read: boolean) => void;
  markAllMessagesAsRead: (accountId: string, conversationId: string, userId: string) => void;
  
  // Unread count actions
  setUnreadCounts: (accountId: string, counts: Record<string, number>) => void;
  setConversationUnreadCount: (accountId: string, conversationId: string, count: number) => void;
  
  // Typing actions
  addTypingUser: (accountId: string, userId: string, displayName: string, conversationId: string) => void;
  removeTypingUser: (accountId: string, userId: string, conversationId: string) => void;
  clearTypingForConversation: (accountId: string, conversationId: string) => void;
  
  // Socket actions
  setSocket: (accountId: string, socket: Socket | null) => void;
  getSocket: (accountId: string) => Socket | null;
  
  // Utilities
  getConversationName: (accountId: string, conversationId: string) => string;
  getConversationImage: (accountId: string, conversationId: string) => string | null;
}

// Constants
const MAX_CACHED_CHATS = 10; // Limit cached chats per account
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      accountData: {},
      sockets: {},
      
      initializeAccount: (accountId) => {
        const state = get();
        if (!state.accountData[accountId]) {
          set({
            accountData: {
              ...state.accountData,
              [accountId]: {
                conversations: [],
                conversationsLoading: false,
                conversationsError: null,
                cachedChats: {},
                unreadCounts: {},
                totalUnreadCount: 0,
                typingUsers: [],
              }
            }
          });
        }
      },
      
      // Conversation list actions
      setConversations: (accountId, conversations) => {
        get().initializeAccount(accountId);
        set(state => ({
          accountData: {
            ...state.accountData,
            [accountId]: {
              ...state.accountData[accountId],
              conversations,
              conversationsError: null,
            }
          }
        }));
      },
      
      setConversationsLoading: (accountId, loading) => {
        get().initializeAccount(accountId);
        set(state => ({
          accountData: {
            ...state.accountData,
            [accountId]: {
              ...state.accountData[accountId],
              conversationsLoading: loading,
            }
          }
        }));
      },
      
      setConversationsError: (accountId, error) => {
        get().initializeAccount(accountId);
        set(state => ({
          accountData: {
            ...state.accountData,
            [accountId]: {
              ...state.accountData[accountId],
              conversationsError: error,
              conversationsLoading: false,
            }
          }
        }));
      },
      
      updateConversation: (accountId, conversation) => {
        get().initializeAccount(accountId);
        set(state => {
          const accountData = state.accountData[accountId];
          const conversations = accountData.conversations.map(conv =>
            conv._id === conversation._id ? { ...conv, ...conversation } : conv
          );
          
          // If conversation not found, add it
          if (!conversations.find(conv => conv._id === conversation._id)) {
            conversations.unshift(conversation);
          }
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                conversations,
              }
            }
          };
        });
      },
      
      // Chat cache actions
      setCachedChat: (accountId, conversationId, chatData) => {
        get().initializeAccount(accountId);
        set(state => {
          const accountData = state.accountData[accountId];
          const currentChat = accountData.cachedChats[conversationId];
          
          const updatedChat: ChatData = {
            ...currentChat,
            ...chatData,
            lastAccessed: Date.now(),
          } as ChatData;
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                cachedChats: {
                  ...accountData.cachedChats,
                  [conversationId]: updatedChat,
                }
              }
            }
          };
        });
        
        // Clean up old cache after setting new data
        get().clearOldCache(accountId);
      },
      
      getCachedChat: (accountId, conversationId) => {
        const state = get();
        return state.accountData[accountId]?.cachedChats[conversationId] || null;
      },
      
      removeCachedChat: (accountId, conversationId) => {
        set(state => {
          const accountData = state.accountData[accountId];
          if (!accountData) return state;
          
          const { [conversationId]: removed, ...remainingChats } = accountData.cachedChats;
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                cachedChats: remainingChats,
              }
            }
          };
        });
      },
      
      clearOldCache: (accountId) => {
        set(state => {
          const accountData = state.accountData[accountId];
          if (!accountData) return state;
          
          const cachedChats = Object.entries(accountData.cachedChats);
          
          // Sort by last accessed (newest first)
          cachedChats.sort(([, a], [, b]) => b.lastAccessed - a.lastAccessed);
          
          // Keep only the most recent chats within limit and expiry time
          const now = Date.now();
          const validChats = cachedChats
            .slice(0, MAX_CACHED_CHATS)
            .filter(([, chat]) => now - chat.lastAccessed < CACHE_EXPIRY_TIME);
          
          const cleanedCache = Object.fromEntries(validChats);
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                cachedChats: cleanedCache,
              }
            }
          };
        });
      },
      
      markChatAsAccessed: (accountId, conversationId) => {
        const cachedChat = get().getCachedChat(accountId, conversationId);
        if (cachedChat) {
          get().setCachedChat(accountId, conversationId, { lastAccessed: Date.now() });
        }
      },
      
      // Message actions
      addMessage: (accountId, conversationId, message) => {
        const cachedChat = get().getCachedChat(accountId, conversationId);
        if (cachedChat) {
          // Check if message already exists to prevent duplicates
          const messageExists = cachedChat.messages.some(msg => msg._id === message._id);
          if (!messageExists) {
            const updatedMessages = [...cachedChat.messages, message];
            get().setCachedChat(accountId, conversationId, { messages: updatedMessages });
          }
        }
        
        // Update conversation list with last message
        set(state => {
          const accountData = state.accountData[accountId];
          if (!accountData) return state;
          
          const conversations = accountData.conversations.map(conv =>
            conv._id === conversationId
              ? {
                  ...conv,
                  lastMessage: {
                    content: message.content,
                    sender: message.sender,
                    timestamp: message.timestamp,
                  }
                }
              : conv
          );
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                conversations,
              }
            }
          };
        });
      },
      
      updateMessageReadStatus: (accountId, conversationId, messageId, read) => {
        const cachedChat = get().getCachedChat(accountId, conversationId);
        if (cachedChat) {
          const updatedMessages = cachedChat.messages.map(msg =>
            msg._id === messageId ? { ...msg, read } : msg
          );
          get().setCachedChat(accountId, conversationId, { messages: updatedMessages });
        }
      },
      
      markAllMessagesAsRead: (accountId, conversationId, userId) => {
        const cachedChat = get().getCachedChat(accountId, conversationId);
        if (cachedChat) {
          const updatedMessages = cachedChat.messages.map(msg =>
            msg.sender === userId && !msg.read ? { ...msg, read: true } : msg
          );
          get().setCachedChat(accountId, conversationId, { messages: updatedMessages });
        }
      },
      
      // Unread count actions
      setUnreadCounts: (accountId, counts) => {
        get().initializeAccount(accountId);
        const totalUnreadCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
        
        set(state => ({
          accountData: {
            ...state.accountData,
            [accountId]: {
              ...state.accountData[accountId],
              unreadCounts: counts,
              totalUnreadCount,
            }
          }
        }));
      },
      
      setConversationUnreadCount: (accountId, conversationId, count) => {
        get().initializeAccount(accountId);
        set(state => {
          const accountData = state.accountData[accountId];
          const newUnreadCounts = {
            ...accountData.unreadCounts,
            [conversationId]: count,
          };
          const totalUnreadCount = Object.values(newUnreadCounts).reduce((sum, c) => sum + c, 0);
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                unreadCounts: newUnreadCounts,
                totalUnreadCount,
              }
            }
          };
        });
      },
      
      // Typing actions
      addTypingUser: (accountId, userId, displayName, conversationId) => {
        get().initializeAccount(accountId);
        set(state => {
          const accountData = state.accountData[accountId];
          const typingUsers = accountData.typingUsers.filter(
            user => !(user.userId === userId && user.conversationId === conversationId)
          );
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                typingUsers: [...typingUsers, { userId, displayName, conversationId }],
              }
            }
          };
        });
      },
      
      removeTypingUser: (accountId, userId, conversationId) => {
        set(state => {
          const accountData = state.accountData[accountId];
          if (!accountData) return state;
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                typingUsers: accountData.typingUsers.filter(
                  user => !(user.userId === userId && user.conversationId === conversationId)
                ),
              }
            }
          };
        });
      },
      
      clearTypingForConversation: (accountId, conversationId) => {
        set(state => {
          const accountData = state.accountData[accountId];
          if (!accountData) return state;
          
          return {
            accountData: {
              ...state.accountData,
              [accountId]: {
                ...accountData,
                typingUsers: accountData.typingUsers.filter(
                  user => user.conversationId !== conversationId
                ),
              }
            }
          };
        });
      },
      
      // Socket actions
      setSocket: (accountId, socket) => {
        set(state => ({
          sockets: {
            ...state.sockets,
            [accountId]: socket,
          }
        }));
      },
      
      getSocket: (accountId) => {
        return get().sockets[accountId] || null;
      },
      
      // Utilities
      getConversationName: (accountId, conversationId) => {
        const state = get();
        const conversation = state.accountData[accountId]?.conversations.find(c => c._id === conversationId);
        return conversation?.displayName || conversation?.name || 'Unknown';
      },
      
      getConversationImage: (accountId, conversationId) => {
        const state = get();
        const conversation = state.accountData[accountId]?.conversations.find(c => c._id === conversationId);
        return conversation?.imageUrl || null;
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist conversation lists and unread counts, not cache or sockets
        accountData: Object.fromEntries(
          Object.entries(state.accountData).map(([accountId, data]) => [
            accountId,
            {
              conversations: data.conversations,
              unreadCounts: data.unreadCounts,
              totalUnreadCount: data.totalUnreadCount,
              // Don't persist cache, loading states, or typing users
              cachedChats: {},
              conversationsLoading: false,
              conversationsError: null,
              typingUsers: [],
            }
          ])
        ),
      }),
    }
  )
);

// Auto cleanup old cache periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useChatStore.getState();
    Object.keys(state.accountData).forEach(accountId => {
      state.clearOldCache(accountId);
    });
  }, CACHE_CLEANUP_INTERVAL);
}