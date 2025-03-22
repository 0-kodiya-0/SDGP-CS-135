import mongoose, { Document, Schema } from 'mongoose';
import dbConfig from '../../config/db.config';

// Message interface
export interface MessageData {
  conversationId: string;
  sender: string;
  content: string;
  timestamp: string;
  read: boolean;
}

// Conversation interface
export interface ConversationData {
  type: 'private' | 'group';
  participants: string[];
  name?: string; // For group chats
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Message Schema
const MessageSchema = new Schema({
  conversationId: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true, default: () => new Date().toISOString() },
  read: { type: Boolean, default: false }
}, {
  timestamps: true,
  versionKey: false
});

// Conversation Schema
const ConversationSchema = new Schema({
  type: { type: String, enum: ['private', 'group'], required: true },
  participants: [{ type: String, required: true }],
  name: { type: String }, // Optional, for group chats
  lastMessage: {
    content: { type: String },
    sender: { type: String },
    timestamp: { type: String }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create indexes
MessageSchema.index({ conversationId: 1, timestamp: -1 });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Document interfaces for MongoDB operations
export interface MessageDocument extends Document, Omit<MessageData, '_id'> {
  _id: mongoose.Types.ObjectId;
}

export interface ConversationDocument extends Document, Omit<ConversationData, '_id'> {
  _id: mongoose.Types.ObjectId;
}

// Add method to mark message as read
MessageSchema.methods.markAsRead = function (this: MessageDocument) {
  this.read = true;
  return this.save();
};

// Add method to update last message in conversation
ConversationSchema.methods.updateLastMessage = function (this: ConversationDocument, content: string, sender: string) {
  this.lastMessage = {
    content,
    sender,
    timestamp: new Date().toISOString()
  };
  return this.save();
};

// Initialize chat models with chat database connection
const initChatModels = async () => {
  const chatConnection = await dbConfig.connectChatDB();

  // Create and export the models using the chat connection
  const ChatModels = {
    Message: chatConnection.model<MessageDocument>('Message', MessageSchema),
    Conversation: chatConnection.model<ConversationDocument>('Conversation', ConversationSchema)
  };

  return ChatModels;
};

export default initChatModels;