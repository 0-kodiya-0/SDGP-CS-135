import { Router } from 'express';
import * as ChatController from './chat.controller';

const router = Router({ mergeParams: true });

// Conversations endpoints
router.get('/conversations', ChatController.getConversations);

router.get('/conversations/:conversationId', ChatController.getConversation);

// Messages endpoints
router.get('/conversations/:conversationId/messages', ChatController.getMessages);

// Create conversation endpoints
router.post('/conversations/private', ChatController.createPrivateConversation);

router.post('/conversations/group', ChatController.createGroupConversation);

// Participants endpoints
router.get('/conversations/:conversationId/participants', ChatController.getConversationParticipants);

router.post('/conversations/:conversationId/participants', ChatController.addUserToGroup);

router.delete('/conversations/:conversationId/participants/:participantId', ChatController.removeUserFromGroup);

// Unread message endpoints
router.get('/messages/unread/count', ChatController.getUnreadCount);

router.get('/messages/unread/count/byConversation', ChatController.getUnreadCountByConversation);

// Mark messages as read
router.post('/conversations/:conversationId/read', ChatController.markMessagesAsRead);

// Delete conversation
router.delete('/conversations/:conversationId', ChatController.deleteConversation);

export default router;