import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/ChatService';

interface ChatSocket extends Socket {
  userId?: string;
}

export class ChatSocketHandler {
  private io: Server;
  private chatService: ChatService;

  constructor(io: Server) {
    this.io = io;
    this.chatService = new ChatService();
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: ChatSocket) => {
      console.log('Client connected:', socket.id);

      // Authenticate user
      socket.on('authenticate', (userId: string) => {
        socket.userId = userId;
        socket.join(`user:${userId}`);
        console.log('User authenticated:', userId);
      });

      // Join conversation room
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      });

      // Leave conversation room
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
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

          const message = await this.chatService.sendMessage(
            data.conversationId,
            socket.userId,
            data.content
          );

          // Emit to all users in the conversation
          this.io.to(`conversation:${data.conversationId}`).emit('new_message', message);

          // Get conversation to find participants
          const conversation = await this.chatService.getUserConversations(socket.userId);
          
          // Emit conversation update to all participants
          conversation[0].participants.forEach(participantId => {
            this.io.to(`user:${participantId}`).emit('conversation_updated', {
              conversationId: data.conversationId,
              lastMessage: {
                content: data.content,
                sender: socket.userId,
                timestamp: new Date()
              }
            });
          });
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

          await this.chatService.markMessagesAsRead(conversationId, socket.userId);
          
          // Notify other participants that messages were read
          this.io.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            userId: socket.userId
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
          socket.emit('error', { message: 'Failed to mark messages as read' });
        }
      });

      // Typing indicator
      socket.on('typing_start', (conversationId: string) => {
        if (!socket.userId) return;
        
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.userId
        });
      });

      socket.on('typing_stop', (conversationId: string) => {
        if (!socket.userId) return;
        
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          conversationId,
          userId: socket.userId
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
} 