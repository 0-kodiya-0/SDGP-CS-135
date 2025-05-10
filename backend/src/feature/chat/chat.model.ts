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

// Message Schema with validation
const MessageSchema = new Schema({
  conversationId: { 
    type: String, 
    required: true, 
    validate: {
      validator: (value: string) => mongoose.Types.ObjectId.isValid(value),
      message: 'Invalid conversationId format'
    }
  },
  sender: { 
    type: String, 
    required: true,
    validate: {
      validator: (value: string) => mongoose.Types.ObjectId.isValid(value),
      message: 'Invalid sender format'
    }
  },
  content: { 
    type: String, 
    required: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  timestamp: { 
    type: String, 
    required: true, 
    default: () => new Date().toISOString(),
    validate: {
      validator: (value: string) => !isNaN(Date.parse(value)),
      message: 'Invalid timestamp format'
    }
  },
  read: { type: Boolean, default: false }
}, {
  timestamps: true,
  versionKey: false
});

// Conversation Schema with validation
const ConversationSchema = new Schema({
  type: { type: String, enum: ['private', 'group'], required: true },
  participants: [{ 
    type: String, 
    required: true,
    validate: {
      validator: (value: string) => mongoose.Types.ObjectId.isValid(value),
      message: 'Invalid participant ID format'
    }
  }],
  name: { 
    type: String,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  }, // Optional, for group chats
  lastMessage: {
    content: { type: String },
    sender: { type: String },
    timestamp: { 
      type: String,
      validate: {
        validator: (value: string) => !isNaN(Date.parse(value)),
        message: 'Invalid timestamp format in lastMessage'
      }
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create indexes
MessageSchema.index({ conversationId: 1 });
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
  this.updatedAt = new Date().toISOString();
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