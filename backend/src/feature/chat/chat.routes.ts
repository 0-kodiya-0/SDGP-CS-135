import { Router, Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service';
import { BadRequestError, NotFoundError, AuthError, JsonSuccess } from '../../types/response.types';
import { asyncHandler } from '../../utils/response';
import { ValidationUtils } from '../../utils/validation';

const router = Router({ mergeParams: true });

router.get('/conversations', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    const conversations = await chatService.getUserConversations(accountId);
    next(new JsonSuccess(conversations));
}));

router.get('/conversations/:conversationId', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const { conversationId } = req.params;

    // Use centralized validation
    ValidationUtils.validateObjectId(conversationId, 'Conversation ID');

    // Verify that user is a participant in the conversation
    const hasAccess = await chatService.verifyConversationAccess(conversationId, accountId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const conversations = await chatService.getUserConversation(conversationId);
    next(new JsonSuccess(conversations));
}));

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const { conversationId } = req.params;

    ValidationUtils.validateObjectId(conversationId, 'Conversation ID');

    // Validate that user is a participant in the conversation
    const hasAccess = await chatService.verifyConversationAccess(conversationId, accountId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const beforeStr = req.query.before as string | undefined;
    let before: Date | undefined;
    
    if (beforeStr) {
        before = ValidationUtils.validateTimestamp(beforeStr, 'before');
    }

    const paginationParams = ValidationUtils.validatePaginationParams({
        limit: req.query.limit as string,
        offset: undefined // Messages use 'before' instead of offset
    });

    const messages = await chatService.getMessages(conversationId, paginationParams.limit, before);
    next(new JsonSuccess(messages));
}));

// Create private conversation
router.post('/conversations/private', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const { otherUserId } = req.body;

    if (accountId === otherUserId) {
        throw new BadRequestError('Cannot create a conversation with yourself');
    }

    const conversation = await chatService.getOrCreatePrivateConversation(accountId, otherUserId);
    next(new JsonSuccess(conversation));
}));

// Create group conversation
router.post('/conversations/group', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const { name, participants } = req.body;

    ValidationUtils.validateRequiredFields(req.body, ['name', 'participants']);
    ValidationUtils.validateStringLength(name, 'Group name', 1, 100);
    
    ValidationUtils.validateArray(
        participants, 
        'Participants', 
        1, 
        undefined, 
        (participantId: string) => ValidationUtils.validateObjectId(participantId, 'Participant ID')
    );

    // Add the creator to the participants list if not already included
    const allParticipants = participants.includes(accountId)
        ? participants
        : [...participants, accountId];

    const conversation = await chatService.createGroupConversation(name, allParticipants);
    next(new JsonSuccess(conversation));
}));

router.get('/conversations/:conversationId/participants', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const currentUserId = req.params.accountId;
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
router.post('/conversations/:conversationId/participants', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const currentUserId = req.params.accountId;
    const { conversationId } = req.params;
    const { accountId } = req.body;

    // Verify the current user is a participant
    const hasAccess = await chatService.verifyConversationAccess(conversationId, currentUserId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const conversation = await chatService.addUserToGroup(conversationId, accountId);
    if (!conversation) {
        throw new NotFoundError('Conversation not found or is not a group');
    }

    next(new JsonSuccess(conversation));
}));

// Remove user from group
router.delete('/conversations/:conversationId/participants/:participantId', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const currentUserId = req.params.accountId;
    const { conversationId, participantId } = req.params;

    // Verify the current user is a participant
    const hasAccess = await chatService.verifyConversationAccess(conversationId, currentUserId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    const conversation = await chatService.removeUserFromGroup(conversationId, participantId);
    if (!conversation) {
        throw new NotFoundError('Conversation not found or is not a group');
    }

    next(new JsonSuccess(conversation));
}));

// Get unread message count
router.get('/messages/unread/count', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    const count = await chatService.getUnreadCount(accountId);
    next(new JsonSuccess({ count }));
}));

// Add this route to chat.routes.ts
router.get('/messages/unread/count/byConversation', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;

    const countByConversation = await chatService.getUnreadCountByConversation(accountId);
    next(new JsonSuccess(countByConversation));
}));

// Mark messages as read in a conversation
router.post('/conversations/:conversationId/read', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const { conversationId } = req.params;

    // Verify the user is a participant
    const hasAccess = await chatService.verifyConversationAccess(conversationId, accountId);
    if (!hasAccess) {
        throw new AuthError('Access denied to this conversation', 403);
    }

    await chatService.markMessagesAsRead(conversationId, accountId);
    next(new JsonSuccess({ success: true }));
}));

// Delete conversation
router.delete('/conversations/:conversationId', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const { conversationId } = req.params;

    const result = await chatService.deleteConversation(conversationId, accountId);
    if (!result) {
        throw new NotFoundError('Conversation not found');
    }

    next(new JsonSuccess({ success: true }));
}));

export default router;