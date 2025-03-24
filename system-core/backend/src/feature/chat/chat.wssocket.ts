import { Server, Socket } from 'socket.io';
import * as chatService from './chat.service';

interface ChatSocket extends Socket {
    userId?: string;
}

export class ChatSocketHandler {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
        this.setupSocketHandlers();
        console.log('ChatSocketHandler initialized');
    }

    private setupSocketHandlers() {
        this.io.on('connection', (socket: ChatSocket) => {
            console.log('Client connected:', socket.id);

            // Authenticate user
            socket.on('authenticate', (userId: string) => {
                socket.userId = userId;
                socket.join(`user:${userId}`);
                console.log('User authenticated:', userId);
                
                // Acknowledge authentication
                socket.emit('authenticated', { userId });
            });

            // Join conversation room
            socket.on('join_conversation', (conversationId: string) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                socket.join(`conversation:${conversationId}`);
                console.log(`User ${socket.userId} joined conversation ${conversationId}`);
                
                // Acknowledge joining
                socket.emit('joined_conversation', { conversationId });
            });

            // Leave conversation room
            socket.on('leave_conversation', (conversationId: string) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                socket.leave(`conversation:${conversationId}`);
                console.log(`User ${socket.userId} left conversation ${conversationId}`);
                
                // Acknowledge leaving
                socket.emit('left_conversation', { conversationId });
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

                    const message = await chatService.sendMessage(
                        data.conversationId,
                        socket.userId,
                        data.content
                    );

                    // Emit to all users in the conversation
                    this.io.to(`conversation:${data.conversationId}`).emit('new_message', message);

                    // Get conversation to find participants
                    const conversations = await chatService.getUserConversations(socket.userId);
                    const conversation = conversations.find(c => c._id.toString() === data.conversationId);

                    if (conversation) {
                        // Emit conversation update to all participants
                        conversation.participants.forEach(participantId => {
                            this.io.to(`user:${participantId}`).emit('conversation_updated', {
                                conversationId: data.conversationId,
                                lastMessage: {
                                    content: data.content,
                                    sender: socket.userId,
                                    timestamp: new Date().toISOString()
                                }
                            });
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
            socket.on('typing_start', (conversationId: string) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                socket.to(`conversation:${conversationId}`).emit('user_typing', {
                    conversationId,
                    userId: socket.userId
                });
            });

            socket.on('typing_stop', (conversationId: string) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
                    conversationId,
                    userId: socket.userId
                });
            });
            
            // Handle reconnection attempts
            socket.on('reconnect_attempt', () => {
                console.log('Client attempting to reconnect:', socket.id);
            });
            
            // Handle successful reconnection
            socket.on('reconnect', () => {
                console.log('Client reconnected:', socket.id);
                // Re-authenticate if userId exists
                if (socket.userId) {
                    socket.join(`user:${socket.userId}`);
                }
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`Client disconnected (${reason}):`, socket.id);
            });
            
            // Handle errors
            socket.on('error', (error) => {
                console.error('Socket error:', socket.id, error);
            });
        });
    }
}