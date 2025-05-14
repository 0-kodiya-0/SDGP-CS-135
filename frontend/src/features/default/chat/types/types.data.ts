export interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
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

export interface Participant {
  _id: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

export interface ChatData {
  conversation: Conversation;
  messages: Message[];
  participants: Record<string, Participant>;
  loading: boolean;
  error: string | null;
  lastAccessed: number;
}

export interface ConversationSummary {
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
  displayName?: string; // Cached display name
  imageUrl?: string; // Cached image for private conversations
}

export interface TypingUser {
  userId: string;
  displayName: string;
  conversationId: string;
}