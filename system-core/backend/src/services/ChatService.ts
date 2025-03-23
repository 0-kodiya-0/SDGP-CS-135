import { Message, Conversation, IMessage, IConversation } from '../models/Chat';
import mongoose from 'mongoose';

export class ChatService {
  // Create or get private conversation between two users
  async getOrCreatePrivateConversation(user1Id: string, user2Id: string): Promise<IConversation> {
    const participants = [user1Id, user2Id].sort(); // Sort to ensure consistent order
    
    let conversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'private',
        participants
      });
    }

    return conversation;
  }

  // Create a group conversation
  async createGroupConversation(name: string, participants: string[]): Promise<IConversation> {
    return await Conversation.create({
      type: 'group',
      name,
      participants
    });
  }

  // Send a message
  async sendMessage(conversationId: string, sender: string, content: string): Promise<IMessage> {
    const message = await Message.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      sender,
      content,
      timestamp: new Date(),
      read: false
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content,
        sender,
        timestamp: message.timestamp
      }
    });

    return message;
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50, before?: Date): Promise<IMessage[]> {
    const query: any = { conversationId: new mongoose.Types.ObjectId(conversationId) };
    if (before) {
      query.timestamp = { $lt: before };
    }

    return await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  // Get user's conversations
  async getUserConversations(userId: string): Promise<IConversation[]> {
    return await Conversation.find({
      participants: userId
    })
    .sort({ updatedAt: -1 })
    .exec();
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await Message.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        sender: { $ne: userId },
        read: false
      },
      { read: true }
    );
  }

  // Add user to group
  async addUserToGroup(conversationId: string, userId: string): Promise<IConversation | null> {
    return await Conversation.findOneAndUpdate(
      { _id: conversationId, type: 'group' },
      { $addToSet: { participants: userId } },
      { new: true }
    );
  }

  // Remove user from group
  async removeUserFromGroup(conversationId: string, userId: string): Promise<IConversation | null> {
    return await Conversation.findOneAndUpdate(
      { _id: conversationId, type: 'group' },
      { $pull: { participants: userId } },
      { new: true }
    );
  }

  // Get unread message count
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await Conversation.find({ participants: userId });
    const conversationIds = conversations.map(c => c._id);
    
    return await Message.countDocuments({
      conversationId: { $in: conversationIds },
      sender: { $ne: userId },
      read: false
    });
  }

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // Delete all messages in the conversation
      await Message.deleteMany({ conversationId: new mongoose.Types.ObjectId(conversationId) });
      
      // Delete the conversation
      const result = await Conversation.findByIdAndDelete(conversationId);
      return !!result;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }
} 