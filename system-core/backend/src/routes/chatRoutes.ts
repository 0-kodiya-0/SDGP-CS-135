import { Router, Request, Response } from 'express';
import { ChatService } from '../services/ChatService';
import { SessionPayload } from '../types/session.types';

interface AuthenticatedRequest extends Request {
  session?: SessionPayload;
}

const router = Router();
const chatService = new ChatService();

// Get user's conversations
router.get('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.session?.accounts[0]?.accountId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversations = await chatService.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', async (req: Request<{ conversationId: string }>, res: Response) => {
  try {
    const { conversationId } = req.params;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const messages = await chatService.getMessages(conversationId, limit, before);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create private conversation
router.post('/conversations/private', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.session?.accounts[0]?.accountId;
    const { otherUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversation = await chatService.getOrCreatePrivateConversation(userId, otherUserId);
    res.json(conversation);
  } catch (error) {
    console.error('Error creating private conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Create group conversation
router.post('/conversations/group', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.session?.accounts[0]?.accountId;
    const { name, participants } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Add the creator to the participants list
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    const conversation = await chatService.createGroupConversation(name, participants);
    res.json(conversation);
  } catch (error) {
    console.error('Error creating group conversation:', error);
    res.status(500).json({ error: 'Failed to create group conversation' });
  }
});

// Add user to group
router.post('/conversations/:conversationId/participants', async (req: Request<{ conversationId: string }>, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    const conversation = await chatService.addUserToGroup(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
});

// Remove user from group
router.delete('/conversations/:conversationId/participants/:userId', async (req: Request<{ conversationId: string; userId: string }>, res: Response) => {
  try {
    const { conversationId, userId } = req.params;

    const conversation = await chatService.removeUserFromGroup(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ error: 'Failed to remove user from group' });
  }
});

// Delete a conversation
router.delete('/conversations/:conversationId', async (req: Request<{ conversationId: string }>, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.session?.accounts[0]?.accountId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = await chatService.deleteConversation(conversationId);
    if (!success) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Get unread message count
router.get('/messages/unread/count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.session?.accounts[0]?.accountId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await chatService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router; 