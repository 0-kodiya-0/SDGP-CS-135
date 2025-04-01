import db from '../../config/db';
import { MessageDocument, ConversationDocument } from './chat.model';

// Create or get private conversation between two users
export async function getOrCreatePrivateConversation(user1Id: string, user2Id: string): Promise<ConversationDocument> {
  const { chat } = await db.getModels();
  const participants = [user1Id, user2Id].sort(); // Sort to ensure consistent order
  
  let conversation = await chat.Conversation.findOne({
    type: 'private',
    participants: { $all: participants, $size: 2 }
  });

  if (!conversation) {
    conversation = await chat.Conversation.create({
      type: 'private',
      participants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return conversation;
}

// Create a group conversation
export async function createGroupConversation(name: string, participants: string[]): Promise<ConversationDocument> {
  const { chat } = await db.getModels();
  
  return await chat.Conversation.create({
    type: 'group',
    name,
    participants,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

// Send a message
export async function sendMessage(conversationId: string, sender: string, content: string): Promise<MessageDocument> {
  const { chat } = await db.getModels();
  const timestamp = new Date().toISOString();
  
  const message = await chat.Message.create({
    conversationId,
    sender,
    content,
    timestamp,
    read: false
  });

  // Update conversation's last message
  await chat.Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content,
      sender,
      timestamp
    },
    updatedAt: timestamp
  });

  return message;
}

// Get messages for a conversation
export async function getMessages(conversationId: string, limit: number = 50, before?: Date): Promise<MessageDocument[]> {
  const { chat } = await db.getModels();
  const query: any = { conversationId };
  
  if (before) {
    query.timestamp = { $lt: before.toISOString() };
  }

  return await chat.Message.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
}

// Get user's conversations
export async function getUserConversations(userId: string): Promise<ConversationDocument[]> {
  const { chat } = await db.getModels();
  
  return await chat.Conversation.find({
    participants: userId
  })
  .sort({ updatedAt: -1 })
  .exec();
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  const { chat } = await db.getModels();
  
  await chat.Message.updateMany(
    {
      conversationId,
      sender: { $ne: userId },
      read: false
    },
    { read: true }
  );
}

// Add user to group
export async function addUserToGroup(conversationId: string, userId: string): Promise<ConversationDocument | null> {
  const { chat } = await db.getModels();
  
  return await chat.Conversation.findOneAndUpdate(
    { _id: conversationId, type: 'group' },
    { 
      $addToSet: { participants: userId },
      updatedAt: new Date().toISOString()
    },
    { new: true }
  );
}

// Remove user from group
export async function removeUserFromGroup(conversationId: string, userId: string): Promise<ConversationDocument | null> {
  const { chat } = await db.getModels();
  
  return await chat.Conversation.findOneAndUpdate(
    { _id: conversationId, type: 'group' },
    { 
      $pull: { participants: userId },
      updatedAt: new Date().toISOString()
    },
    { new: true }
  );
}

// Get unread message count
export async function getUnreadCount(userId: string): Promise<number> {
  const { chat } = await db.getModels();
  
  const conversations = await chat.Conversation.find({ participants: userId });
  const conversationIds = conversations.map(c => c._id.toString());
  
  return await chat.Message.countDocuments({
    conversationId: { $in: conversationIds },
    sender: { $ne: userId },
    read: false
  });
}