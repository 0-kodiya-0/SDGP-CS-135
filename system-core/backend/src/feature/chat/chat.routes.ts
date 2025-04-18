import { Router, Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service';
import mongoose from 'mongoose';
import { BadRequestError, NotFoundError, AuthError, JsonSuccess } from '../../types/response.types';
import { asyncHandler } from '../../utils/response';

const router = Router({ mergeParams: true });

// Middleware for input validation
const validateObjectId = (id: string): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
};

const validateTimestamp = (timestamp: string): boolean => {
    return !isNaN(Date.parse(timestamp));
};

router.get('/conversations', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;

    const conversations = await chatService.getUserConversations(userId);
    next(new JsonSuccess(conversations));
}));

router.get('/conversations/:conversationId', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;
    const { conversationId } = req.params;

    // Validate that user is a participant in the conversation
    const hasAccess = await chatService.verifyConversationAccess(conversationId, userId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const conversations = await chatService.getUserConversation(conversationId);
    next(new JsonSuccess(conversations));
}));

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', asyncHandler(async (req: Request<{ accountId: string, conversationId: string }>, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;
    const { conversationId } = req.params;

    // Validate that user is a participant in the conversation
    const hasAccess = await chatService.verifyConversationAccess(conversationId, userId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const beforeStr = req.query.before as string | undefined;
    const before = beforeStr && validateTimestamp(beforeStr) ? new Date(beforeStr) : undefined;

    if (beforeStr && !before) {
        throw new BadRequestError('Invalid timestamp format');
    }

    const limitStr = req.query.limit as string | undefined;
    const limit = limitStr ? parseInt(limitStr) : 50;

    if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new BadRequestError('Limit must be between 1 and 100');
    }

    const messages = await chatService.getMessages(conversationId, limit, before);
    next(new JsonSuccess(messages));
}));

// Create private conversation
router.post('/conversations/private', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;
    const { otherUserId } = req.body;

    if (userId === otherUserId) {
        throw new BadRequestError('Cannot create a conversation with yourself');
    }

    const conversation = await chatService.getOrCreatePrivateConversation(userId, otherUserId);
    next(new JsonSuccess(conversation));
}));

// Create group conversation
router.post('/conversations/group', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;
    const { name, participants } = req.body;

    if (!name || typeof name !== 'string' || name.length > 100) {
        throw new BadRequestError('Invalid group name. Must be string and under 100 characters');
    }

    if (!Array.isArray(participants) || participants.length < 1) {
        throw new BadRequestError('Participants must be an array with at least one member');
    }

    // Validate all participant IDs
    for (const participantId of participants) {
        if (!validateObjectId(participantId)) {
            throw new BadRequestError(`Invalid participant ID format: ${participantId}`);
        }
    }

    // Add the creator to the participants list if not already included
    const allParticipants = participants.includes(userId)
        ? participants
        : [...participants, userId];

    const conversation = await chatService.createGroupConversation(name, allParticipants);
    next(new JsonSuccess(conversation));
}));

router.get('/conversations/:conversationId/participants', asyncHandler(async (req: Request<{ accountId: string, conversationId: string }>, res: Response, next: NextFunction) => {
    const currentUserId = req.oauthAccount?.id as string;
    const { conversationId } = req.params;
    const { conversationType } = req.query;

    if (!conversationId || !conversationType) {
        throw new BadRequestError('Invalid or missing parameters');
    }

    // Verify the current user is a participant
    if (conversationType === "private") {
        const participantInfo = await chatService.getPrivateParticipantInformation(conversationId, currentUserId);
        next(new JsonSuccess(participantInfo));
    } else if (conversationType === "group") {
        const participantsInfo = await chatService.getGroupParticipantsInformation(conversationId, currentUserId);
        next(new JsonSuccess(participantsInfo));
    } else {
        throw new BadRequestError('Invalid conversation type');
    }
}));

// Add user to group
router.post('/conversations/:conversationId/participants', asyncHandler(async (req: Request<{ accountId: string, conversationId: string }>, res: Response, next: NextFunction) => {
    const currentUserId = req.oauthAccount?.id as string;
    const { conversationId } = req.params;
    const { userId } = req.body;

    // Verify the current user is a participant
    const hasAccess = await chatService.verifyConversationAccess(conversationId, currentUserId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const conversation = await chatService.addUserToGroup(conversationId, userId);
    if (!conversation) {
        throw new NotFoundError('Conversation not found or is not a group');
    }

    next(new JsonSuccess(conversation));
}));

// Remove user from group
router.delete('/conversations/:conversationId/participants/:userId', asyncHandler(async (req: Request<{ accountId: string, conversationId: string, userId: string }>, res: Response, next: NextFunction) => {
    const currentUserId = req.oauthAccount?.id as string;
    const { conversationId, userId } = req.params;

    // Verify the current user is a participant
    const hasAccess = await chatService.verifyConversationAccess(conversationId, currentUserId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const conversation = await chatService.removeUserFromGroup(conversationId, userId);
    if (!conversation) {
        throw new NotFoundError('Conversation not found or is not a group');
    }

    next(new JsonSuccess(conversation));
}));

// Get unread message count
router.get('/messages/unread/count', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;

    const count = await chatService.getUnreadCount(userId);
    next(new JsonSuccess({ count }));
}));

// Add this route to chat.routes.ts
router.get('/messages/unread/count/byConversation', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;

    const countByConversation = await chatService.getUnreadCountByConversation(userId);
    next(new JsonSuccess(countByConversation));
}));

// Mark messages as read in a conversation
router.post('/conversations/:conversationId/read', asyncHandler(async (req: Request<{ accountId: string, conversationId: string }>, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;
    const { conversationId } = req.params;

    // Verify the user is a participant
    const hasAccess = await chatService.verifyConversationAccess(conversationId, userId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    await chatService.markMessagesAsRead(conversationId, userId);
    next(new JsonSuccess({ success: true }));
}));

// Delete conversation
router.delete('/conversations/:conversationId', asyncHandler(async (req: Request<{ accountId: string, conversationId: string }>, res: Response, next: NextFunction) => {
    const userId = req.oauthAccount?.id as string;
    const { conversationId } = req.params;

    const result = await chatService.deleteConversation(conversationId, userId);
    if (!result) {
        throw new NotFoundError('Conversation not found');
    }

    next(new JsonSuccess({ success: true }));
}));

export default router;