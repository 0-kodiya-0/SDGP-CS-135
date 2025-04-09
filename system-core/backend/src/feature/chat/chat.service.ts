import db from '../../config/db';
import { MessageDocument, ConversationDocument } from './chat.model';
import mongoose from 'mongoose';

// Verify if a user has access to a conversation
export async function verifyConversationAccess(conversationId: string, userId: string): Promise<boolean> {
  const { chat } = await db.getModels();
  
  // Use projection to only return the _id field, optimizing the query
  const conversation = await chat.Conversation.findOne(
    { _id: conversationId, participants: userId },
    { _id: 1 }
  );
  
  return conversation !== null;
}

// Create or get private conversation between two users
export async function getOrCreatePrivateConversation(user1Id: string, user2Id: string): Promise<ConversationDocument> {
  const { chat } = await db.getModels();
  
  // Prevent creating conversations with self
  if (user1Id === user2Id) {
    throw new Error('Cannot create a conversation with yourself');
  }
  
  const participants = [user1Id, user2Id].sort(); // Sort to ensure consistent order
  
  // Check if conversation already exists
  let conversation = await chat.Conversation.findOne({
    type: 'private',
    participants: { $all: participants, $size: 2 }
  });

  if (!conversation) {
    const timestamp = new Date().toISOString();
    conversation = await chat.Conversation.create({
      type: 'private',
      participants,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  return conversation;
}

// Create a group conversation
export async function createGroupConversation(name: string, participants: string[]): Promise<ConversationDocument> {
  const { chat } = await db.getModels();
  
  // Validate participants (ensure no duplicates)
  const uniqueParticipants = [...new Set(participants)];
  
  // Ensure at least 2 participants for a group
  if (uniqueParticipants.length < 2) {
    throw new Error('Group conversations require at least 2 participants');
  }
  
  const timestamp = new Date().toISOString();
  return await chat.Conversation.create({
    type: 'group',
    name,
    participants: uniqueParticipants,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

// Send a message with transaction support
export async function sendMessage(conversationId: string, sender: string, content: string): Promise<MessageDocument> {
  const { chat } = await db.getModels();
  const timestamp = new Date().toISOString();
  
  // Start a session for transaction
  const session = await mongoose.startSession();
  let message;
  
  try {
    session.startTransaction();
    
    // Verify sender is part of the conversation with optimized query
    const conversation = await chat.Conversation.findOne(
      { _id: conversationId, participants: sender },
      { _id: 1, participants: 1 }
    ).session(session);
    
    if (!conversation) {
      throw new Error('Conversation not found or user is not a participant');
    }
    
    // Create message
    message = await chat.Message.create([{
      conversationId,
      sender,
      content,
      timestamp,
      read: false
    }], { session });
    
    // Update conversation's last message
    await chat.Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content,
        sender,
        timestamp
      },
      updatedAt: timestamp
    }).session(session);
    
    await session.commitTransaction();
    return message[0];
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Get messages for a conversation with proper pagination
export async function getMessages(conversationId: string, limit: number = 50, before?: Date): Promise<MessageDocument[]> {
  const { chat } = await db.getModels();
  const query: any = { conversationId };
  
  if (before) {
    query.timestamp = { $lt: before.toISOString() };
  }

  // Fetch messages in reverse chronological order for efficient pagination
  const messages = await chat.Message.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
    
  // Return in chronological order for client convenience
  return messages.reverse();
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
  
  // Ensure conversation is a group type with optimized query
  const conversation = await chat.Conversation.findOne(
    { _id: conversationId, type: 'group' },
    { participants: 1 }
  );
  
  if (!conversation) {
    return null;
  }
  
  // Don't add user if already a participant
  if (conversation.participants.includes(userId)) {
    return conversation;
  }
  
  const timestamp = new Date().toISOString();
  return await chat.Conversation.findOneAndUpdate(
    { _id: conversationId, type: 'group' },
    { 
      $addToSet: { participants: userId },
      updatedAt: timestamp
    },
    { new: true }
  );
}

// Remove user from group
export async function removeUserFromGroup(conversationId: string, userId: string): Promise<ConversationDocument | null> {
  const { chat } = await db.getModels();
  
  // Ensure conversation is a group type with optimized query
  const conversation = await chat.Conversation.findOne(
    { _id: conversationId, type: 'group' },
    { participants: 1 }
  );
  
  if (!conversation) {
    return null;
  }
  
  // Prevent removing the last participant
  if (conversation.participants.length <= 2) {
    throw new Error('Cannot remove user from a group with only 2 participants');
  }
  
  const timestamp = new Date().toISOString();
  return await chat.Conversation.findOneAndUpdate(
    { _id: conversationId, type: 'group' },
    { 
      $pull: { participants: userId },
      updatedAt: timestamp
    },
    { new: true }
  );
}

// Delete conversation and all its messages with transaction support
export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  const { chat } = await db.getModels();
  
  // Start a session for transaction
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Verify user is part of the conversation with optimized query
    const conversation = await chat.Conversation.findOne(
      { _id: conversationId, participants: userId },
      { _id: 1 }
    ).session(session);
    
    if (!conversation) {
      throw new Error('Conversation not found or user is not a participant');
    }
    
    // Delete all messages in the conversation
    await chat.Message.deleteMany({ conversationId }).session(session);
    
    // Delete the conversation itself
    await chat.Conversation.findByIdAndDelete(conversationId).session(session);
    
    await session.commitTransaction();
    return true;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Get unread message count
export async function getUnreadCount(userId: string): Promise<number> {
  const { chat } = await db.getModels();
  
  // Get conversation IDs where user is a participant
  const conversations = await chat.Conversation.find(
    { participants: userId },
    { _id: 1 }
  );
  
  const conversationIds = conversations.map(c => c._id.toString());
  
  // Count unread messages
  return await chat.Message.countDocuments({
    conversationId: { $in: conversationIds },
    sender: { $ne: userId },
    read: false
  });
}