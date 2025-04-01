import { Router, Request, Response } from 'express';
import * as chatService from './chat.service';
import { validateAccountAccess } from '../../services/session';

const router = Router();

router.use("/:accountId", validateAccountAccess);

// Get user's conversations
router.get('/:accountId/conversations', async (req: Request, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;

        const conversations = await chatService.getUserConversations(userId);
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get messages for a conversation
router.get('/:accountId/conversations/:conversationId/messages', async (req: Request<{ conversationId: string }>, res: Response) => {
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
router.post('/:accountId/conversations/private', async (req: Request, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;
        const { otherUserId } = req.body;

        const conversation = await chatService.getOrCreatePrivateConversation(userId, otherUserId);
        res.json(conversation);
    } catch (error) {
        console.error('Error creating private conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Create group conversation
router.post('/:accountId/conversations/group', async (req: Request, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;;
        const { name, participants } = req.body;

        // Add the creator to the participants list if not already included
        const allParticipants = participants.includes(userId)
            ? participants
            : [...participants, userId];

        const conversation = await chatService.createGroupConversation(name, allParticipants);
        res.json(conversation);
    } catch (error) {
        console.error('Error creating group conversation:', error);
        res.status(500).json({ error: 'Failed to create group conversation' });
    }
});

// Add user to group
router.post('/:accountId/conversations/:conversationId/participants', async (req: Request<{ conversationId: string }>, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;

        const conversation = await chatService.addUserToGroup(conversationId, userId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ error: 'Failed to add user to group' });
    }
});

// Remove user from group
router.delete('/:accountId/conversations/:conversationId/participants/:userId', async (req: Request<{ conversationId: string; userId: string }>, res: Response) => {
    try {
        const { conversationId, userId } = req.params;

        const conversation = await chatService.removeUserFromGroup(conversationId, userId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error removing user from group:', error);
        res.status(500).json({ error: 'Failed to remove user from group' });
    }
});

// Get unread message count
router.get('/:accountId/messages/unread/count', async (req: Request, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;

        const count = await chatService.getUnreadCount(userId);
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

export default router;