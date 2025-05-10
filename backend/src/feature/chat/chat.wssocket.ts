import { Server, Socket } from 'socket.io';
import * as chatService from './chat.service';

interface ChatSocket extends Socket {
    userId?: string;
    activeConversations?: Set<string>;
}

interface UserSocketMap {
    [userId: string]: Set<string>; // Maps userId to set of socket IDs
}

export class ChatSocketHandler {
    private io: Server;
    private userSocketMap: UserSocketMap = {};

    constructor(io: Server) {
        this.io = io;
        this.setupSocketHandlers();
        console.log('ChatSocketHandler initialized');
    }

    private setupSocketHandlers() {
        this.io.on('connection', (socket: ChatSocket) => {
            console.log('Client connected:', socket.id);
            socket.activeConversations = new Set();

            // Authenticate user
            socket.on('authenticate', (userId: string) => {
                try {
                    // Validate userId format (assuming MongoDB ObjectId)
                    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
                        socket.emit('error', { message: 'Invalid user ID format' });
                        return;
                    }

                    // Add socket to user's socket collection
                    if (!this.userSocketMap[userId]) {
                        this.userSocketMap[userId] = new Set();
                    }
                    this.userSocketMap[userId].add(socket.id);

                    socket.userId = userId;
                    socket.join(`user:${userId}`);
                    console.log('User authenticated:', userId);
                    
                    // Acknowledge authentication
                    socket.emit('authenticated', { userId });
                } catch (error) {
                    console.error('Authentication error:', error);
                    socket.emit('error', { message: 'Authentication failed' });
                }
            });

            // Join conversation room
            socket.on('join_conversation', async (conversationId: string) => {
                try {
                    if (!socket.userId) {
                        socket.emit('error', { message: 'Not authenticated' });
                        return;
                    }

                    // Validate conversationId format
                    if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
                        socket.emit('error', { message: 'Invalid conversation ID format' });
                        return;
                    }

                    // Verify user has access to this conversation
                    const hasAccess = await chatService.verifyConversationAccess(conversationId, socket.userId);
                    if (!hasAccess) {
                        socket.emit('error', { message: 'Access denied to this conversation' });
                        return;
                    }

                    socket.join(`conversation:${conversationId}`);
                    socket.activeConversations?.add(conversationId);
                    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
                    
                    // Acknowledge joining
                    socket.emit('joined_conversation', { conversationId });
                } catch (error) {
                    console.error('Error joining conversation:', error);
                    socket.emit('error', { message: 'Failed to join conversation' });
                }
            });

            // Leave conversation room
            socket.on('leave_conversation', (conversationId: string) => {
                try {
                    if (!socket.userId) {
                        socket.emit('error', { message: 'Not authenticated' });
                        return;
                    }

                    // Validate conversationId format
                    if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
                        socket.emit('error', { message: 'Invalid conversation ID format' });
                        return;
                    }

                    socket.leave(`conversation:${conversationId}`);
                    socket.activeConversations?.delete(conversationId);
                    console.log(`User ${socket.userId} left conversation ${conversationId}`);
                    
                    // Acknowledge leaving
                    socket.emit('left_conversation', { conversationId });
                } catch (error) {
                    console.error('Error leaving conversation:', error);
                    socket.emit('error', { message: 'Failed to leave conversation' });
                }
            });

            // Send message
            socket.on('send_message', async (data: {
                conversationId: string;
                content: string;
            }) => {
                try {
                    if (!socket.userId) {
                        throw new Error('User not authenticated');
                    }

                    // Validate input
                    if (!/^[0-9a-fA-F]{24}$/.test(data.conversationId)) {
                        socket.emit('error', { message: 'Invalid conversation ID format' });
                        return;
                    }

                    if (!data.content || data.content.trim() === '') {
                        socket.emit('error', { message: 'Message content cannot be empty' });
                        return;
                    }

                    if (data.content.length > 5000) {
                        socket.emit('error', { message: 'Message content exceeds maximum length (5000 characters)' });
                        return;
                    }

                    const message = await chatService.sendMessage(
                        data.conversationId,
                        socket.userId,
                        data.content
                    );

                    // Emit to all users in the conversation room
                    this.io.to(`conversation:${data.conversationId}`).emit('new_message', message);

                    // Get conversation to find participants
                    const conversations = await chatService.getUserConversations(socket.userId);
                    const conversation = conversations.find(c => c._id.toString() === data.conversationId);

                    if (conversation) {
                        // Create conversation update notification
                        const conversationUpdate = {
                            conversationId: data.conversationId,
                            lastMessage: {
                                content: data.content,
                                sender: socket.userId,
                                timestamp: new Date().toISOString()
                            }
                        };

                        // Emit conversation update to all participants
                        // This ensures offline users or those not in the conversation room still get updates
                        conversation.participants.forEach(participantId => {
                            // Check if this participant has any active sockets
                            if (this.userSocketMap[participantId] && this.userSocketMap[participantId].size > 0) {
                                this.io.to(`user:${participantId}`).emit('conversation_updated', conversationUpdate);
                            }
                        });
                    }
                    
                    // Acknowledge message sent
                    socket.emit('message_sent', { messageId: message._id.toString() });
                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Mark messages as read
            socket.on('mark_read', async (conversationId: string) => {
                try {
                    if (!socket.userId) {
                        throw new Error('User not authenticated');
                    }

                    // Validate conversationId format
                    if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
                        socket.emit('error', { message: 'Invalid conversation ID format' });
                        return;
                    }

                    // Verify user has access to this conversation
                    const hasAccess = await chatService.verifyConversationAccess(conversationId, socket.userId);
                    if (!hasAccess) {
                        socket.emit('error', { message: 'Access denied to this conversation' });
                        return;
                    }

                    await chatService.markMessagesAsRead(conversationId, socket.userId);

                    // Notify other participants that messages were read
                    this.io.to(`conversation:${conversationId}`).emit('messages_read', {
                        conversationId,
                        userId: socket.userId
                    });
                    
                    // Acknowledge messages marked as read
                    socket.emit('messages_marked_read', { conversationId });
                } catch (error) {
                    console.error('Error marking messages as read:', error);
                    socket.emit('error', { message: 'Failed to mark messages as read' });
                }
            });

            // Typing indicator
            socket.on('typing_start', async (conversationId: string) => {
                try {
                    if (!socket.userId) {
                        socket.emit('error', { message: 'Not authenticated' });
                        return;
                    }

                    // Validate conversationId format
                    if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
                        socket.emit('error', { message: 'Invalid conversation ID format' });
                        return;
                    }

                    // Verify user has access to this conversation
                    const hasAccess = await chatService.verifyConversationAccess(conversationId, socket.userId);
                    if (!hasAccess) {
                        socket.emit('error', { message: 'Access denied to this conversation' });
                        return;
                    }

                    socket.to(`conversation:${conversationId}`).emit('user_typing', {
                        conversationId,
                        userId: socket.userId
                    });
                } catch (error) {
                    console.error('Error with typing indicator:', error);
                    socket.emit('error', { message: 'Failed to send typing indicator' });
                }
            });

            socket.on('typing_stop', async (conversationId: string) => {
                try {
                    if (!socket.userId) {
                        socket.emit('error', { message: 'Not authenticated' });
                        return;
                    }

                    // Validate conversationId format
                    if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
                        socket.emit('error', { message: 'Invalid conversation ID format' });
                        return;
                    }

                    // Verify user has access to this conversation
                    const hasAccess = await chatService.verifyConversationAccess(conversationId, socket.userId);
                    if (!hasAccess) {
                        socket.emit('error', { message: 'Access denied to this conversation' });
                        return;
                    }

                    socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
                        conversationId,
                        userId: socket.userId
                    });
                } catch (error) {
                    console.error('Error with typing indicator:', error);
                    socket.emit('error', { message: 'Failed to send typing indicator' });
                }
            });
            
            // Handle reconnection attempts
            socket.on('reconnect_attempt', () => {
                console.log('Client attempting to reconnect:', socket.id);
            });
            
            // Handle successful reconnection
            socket.on('reconnect', () => {
                console.log('Client reconnected:', socket.id);
                
                // Clean up any previous socket references for this user
                if (socket.userId) {
                    this.cleanupUserSockets(socket.userId, socket.id);
                    
                    // Re-authenticate if userId exists
                    socket.join(`user:${socket.userId}`);
                    
                    // Re-join active conversation rooms
                    socket.activeConversations?.forEach(conversationId => {
                        socket.join(`conversation:${conversationId}`);
                    });
                }
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`Client disconnected (${reason}):`, socket.id);
                
                // Clean up socket references
                if (socket.userId) {
                    this.cleanupUserSockets(socket.userId, socket.id);
                }
            });
            
            // Handle errors
            socket.on('error', (error) => {
                console.error('Socket error:', socket.id, error);
            });
        });
    }
    
    // Clean up socket references on disconnect/reconnect
    private cleanupUserSockets(userId: string, socketId: string): void {
        if (this.userSocketMap[userId]) {
            this.userSocketMap[userId].delete(socketId);
            
            // Remove the user entry if no active sockets remain
            if (this.userSocketMap[userId].size === 0) {
                delete this.userSocketMap[userId];
            }
        }
    }
}