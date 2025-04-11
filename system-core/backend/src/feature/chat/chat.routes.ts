import { Router, Request, Response } from 'express';
import * as chatService from './chat.service';
import { validateAccountAccess } from '../../services/session';
import mongoose from 'mongoose';

const router = Router();

// Middleware for input validation
const validateObjectId = (id: string): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
};

const validateTimestamp = (timestamp: string): boolean => {
    return !isNaN(Date.parse(timestamp));
};

// Apply account access validation to all routes
router.use("/:accountId", validateAccountAccess);

// Get user's conversations
router.get('/:accountId/conversations', async (req: Request, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;

        // if (!validateObjectId(userId)) {
        //     res.status(400).json({ error: 'Invalid user ID format' });
        //     return;
        // }

        const conversations = await chatService.getUserConversations(userId);
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get messages for a conversation
router.get('/:accountId/conversations/:conversationId/messages', async (req: Request<{ accountId: string, conversationId: string }>, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;
        const { conversationId } = req.params;

        // if (!validateObjectId(conversationId)) {
        //     res.status(400).json({ error: 'Invalid conversation ID format' });
        //     return;
        // }

        // Validate that user is a participant in the conversation
        const hasAccess = await chatService.verifyConversationAccess(conversationId, userId);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied to this conversation' });
            return;
        }

        const beforeStr = req.query.before as string | undefined;
        const before = beforeStr && validateTimestamp(beforeStr) ? new Date(beforeStr) : undefined;

        if (beforeStr && !before) {
            res.status(400).json({ error: 'Invalid timestamp format' });
            return;
        }

        const limitStr = req.query.limit as string | undefined;
        const limit = limitStr ? parseInt(limitStr) : 50;

        if (isNaN(limit) || limit < 1 || limit > 100) {
            res.status(400).json({ error: 'Limit must be between 1 and 100' });
            return;
        }

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

        // if (!validateObjectId(userId) || !validateObjectId(otherUserId)) {
        //     res.status(400).json({ error: 'Invalid user ID format' });
        //     return;
        // }

        if (userId === otherUserId) {
            res.status(400).json({ error: 'Cannot create a conversation with yourself' });
            return;
        }

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
        const userId = req.oauthAccount?.id as string;
        const { name, participants } = req.body;

        if (!name || typeof name !== 'string' || name.length > 100) {
            res.status(400).json({ error: 'Invalid group name. Must be string and under 100 characters' });
            return;
        }

        if (!Array.isArray(participants) || participants.length < 1) {
            res.status(400).json({ error: 'Participants must be an array with at least one member' });
            return;
        }

        // Validate all participant IDs
        for (const participantId of participants) {
            if (!validateObjectId(participantId)) {
                res.status(400).json({ error: `Invalid participant ID format: ${participantId}` });
                return;
            }
        }

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

router.get('/:accountId/conversations/:conversationId/participants', async (req: Request<{ accountId: string, conversationId: string, conversationType: string }>, res: Response) => {
    try {
        const currentUserId = req.oauthAccount?.id as string;
        const { conversationId } = req.params;
        const { conversationType } = req.query;

        // if (!validateObjectId(conversationId) || !validateObjectId(userId)) {
        //     res.status(400).json({ error: 'Invalid ID format' });
        //     return;
        // }

        if (!conversationId || !conversationType) {
            res.status(400).json({ error: 'Invalid or missing parameters' });
            return;
        }

        // Verify the current user is a participant
        if (conversationType === "private") {
            const participantInfo = await chatService.getParticipantInformation(conversationId, currentUserId);
            res.json(participantInfo);
        } else {
            res.status(400).json({ error: 'Invalid conversation type' });
        }
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ error: 'Failed to add user to group' });
    }
});

// Add user to group
router.post('/:accountId/conversations/:conversationId/participants', async (req: Request<{ accountId: string, conversationId: string }>, res: Response) => {
    try {
        const currentUserId = req.oauthAccount?.id as string;
        const { conversationId } = req.params;
        const { userId } = req.body;

        // if (!validateObjectId(conversationId) || !validateObjectId(userId)) {
        //     res.status(400).json({ error: 'Invalid ID format' });
        //     return;
        // }

        // Verify the current user is a participant
        const hasAccess = await chatService.verifyConversationAccess(conversationId, currentUserId);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied to this conversation' });
            return;
        }

        const conversation = await chatService.addUserToGroup(conversationId, userId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found or is not a group' });
            return;
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ error: 'Failed to add user to group' });
    }
});

// Remove user from group
router.delete('/:accountId/conversations/:conversationId/participants/:userId', async (req: Request<{ accountId: string, conversationId: string, userId: string }>, res: Response) => {
    try {
        const currentUserId = req.oauthAccount?.id as string;
        const { conversationId, userId } = req.params;

        // if (!validateObjectId(conversationId) || !validateObjectId(userId)) {
        //     res.status(400).json({ error: 'Invalid ID format' });
        //     return;
        // }

        // Verify the current user is a participant
        const hasAccess = await chatService.verifyConversationAccess(conversationId, currentUserId);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied to this conversation' });
            return;
        }

        const conversation = await chatService.removeUserFromGroup(conversationId, userId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found or is not a group' });
            return;
        }

        res.json(conversation);
    } catch (error) {
        if (error instanceof Error && error.message === 'Cannot remove user from a group with only 2 participants') {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error('Error removing user from group:', error);
        res.status(500).json({ error: 'Failed to remove user from group' });
    }
});

// Get unread message count
router.get('/:accountId/messages/unread/count', async (req: Request, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;

        // if (!validateObjectId(userId)) {
        //     res.status(400).json({ error: 'Invalid user ID format' });
        //     return;
        // }

        const count = await chatService.getUnreadCount(userId);
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark messages as read in a conversation
router.post('/:accountId/conversations/:conversationId/read', async (req: Request<{ accountId: string, conversationId: string }>, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;
        const { conversationId } = req.params;

        // if (!validateObjectId(conversationId) || !validateObjectId(userId)) {
        //     res.status(400).json({ error: 'Invalid ID format' });
        //     return;
        // }

        // Verify the user is a participant
        const hasAccess = await chatService.verifyConversationAccess(conversationId, userId);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied to this conversation' });
            return;
        }

        await chatService.markMessagesAsRead(conversationId, userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Delete conversation
router.delete('/:accountId/conversations/:conversationId', async (req: Request<{ accountId: string, conversationId: string }>, res: Response) => {
    try {
        const userId = req.oauthAccount?.id as string;
        const { conversationId } = req.params;

        // if (!validateObjectId(conversationId) || !validateObjectId(userId)) {
        //     res.status(400).json({ error: 'Invalid ID format' });
        //     return;
        // }

        const result = await chatService.deleteConversation(conversationId, userId);
        if (!result) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'User is not a participant in this conversation') {
            res.status(403).json({ error: error.message });
            return;
        }
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

export default router;