import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub || payload.id;
      
      if (client.userId) {
        this.connectedUsers.set(client.userId, client.id);
        client.join(`user:${client.userId}`);
      }
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
    }
  }

  /**
   * Emit new message to conversation participants
   */
  emitNewMessage(conversation: Conversation, message: Message) {
    // Emit to both customer and supplier
    this.server.to(`user:${conversation.customerId}`).emit('newMessage', {
      conversationId: conversation.id,
      message,
    });
    this.server.to(`user:${conversation.supplierId}`).emit('newMessage', {
      conversationId: conversation.id,
      message,
    });
  }

  /**
   * Emit conversation update (e.g., unread count change)
   */
  emitConversationUpdate(userId: string, conversation: Conversation) {
    this.server.to(`user:${userId}`).emit('conversationUpdate', conversation);
  }

  /**
   * Join a conversation room
   */
  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (client.userId) {
      client.join(`conversation:${data.conversationId}`);
    }
  }

  /**
   * Leave a conversation room
   */
  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  /**
   * Mark messages as read
   */
  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    // This will be handled by the service, but we can emit an update
    if (client.userId) {
      this.server.to(`conversation:${data.conversationId}`).emit('messagesRead', {
        conversationId: data.conversationId,
        userId: client.userId,
      });
    }
  }
}

