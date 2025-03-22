import mongoose, { Schema, Document } from 'mongoose';

// Message interface
export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

// Conversation interface
export interface IConversation extends Document {
  type: 'private' | 'group';
  participants: string[];
  name?: string; // For group chats
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

// Conversation Schema
const ConversationSchema = new Schema<IConversation>({
  type: { type: String, enum: ['private', 'group'], required: true },
  participants: [{ type: String, required: true }],
  name: { type: String }, // Optional, for group chats
  lastMessage: {
    content: { type: String },
    sender: { type: String },
    timestamp: { type: Date }
  }
}, {
  timestamps: true
});

// Create indexes
MessageSchema.index({ conversationId: 1, timestamp: -1 });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Create models
export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema); 