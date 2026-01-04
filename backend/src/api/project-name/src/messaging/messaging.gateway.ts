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
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { MessagingService } from './messaging.service';
import { CacheService } from '../common/services/cache.service';

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
  private userLastSeen: Map<string, Date> = new Map(); // userId -> lastSeenAt
  private conversationCache: Map<string, { conversations: Conversation[]; timestamp: number }> = new Map();
  private readonly CONVERSATION_CACHE_TTL = 300000; // 5 minutes in milliseconds

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => MessagingService))
    private messagingService: MessagingService,
    private cacheService: CacheService,
  ) {}

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
        this.userLastSeen.set(client.userId, new Date());
        client.join(`user:${client.userId}`);
        
        // Emit online status to user's contacts
        this.emitUserOnlineStatus(client.userId, true).catch((err) => {
          console.error('Error emitting online status on connect:', err);
        });
      }
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      const lastSeen = new Date();
      this.userLastSeen.set(client.userId, lastSeen);
      
      // Emit offline status
      this.emitUserOnlineStatus(client.userId, false).catch((err) => {
        console.error('Error emitting offline status on disconnect:', err);
      });
    }
  }

  /**
   * Emit new message to conversation participants
   */
  async emitNewMessage(conversation: Conversation, message: Message) {
    const messageData = {
      conversationId: conversation.id,
      message,
    };
    
    // Invalidate conversation cache for both users when new message arrives
    await Promise.all([
      this.invalidateConversationCache(conversation.customerId),
      this.invalidateConversationCache(conversation.supplierId),
    ]);
    
    // Emit to both customer and supplier user rooms
    this.server.to(`user:${conversation.customerId}`).emit('newMessage', messageData);
    this.server.to(`user:${conversation.supplierId}`).emit('newMessage', messageData);
    
    // Also emit to conversation room for redundancy (in case users are in conversation room)
    this.server.to(`conversation:${conversation.id}`).emit('newMessage', messageData);
  }

  /**
   * Emit conversation update (e.g., unread count change)
   */
  async emitConversationUpdate(userId: string, conversation: Conversation) {
    // Invalidate cache when conversation is updated
    await this.invalidateConversationCache(userId);
    
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

  /**
   * Handle typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (client.userId) {
      // Emit to other participants in the conversation
      client.to(`conversation:${data.conversationId}`).emit('typing', {
        conversationId: data.conversationId,
        userId: client.userId,
        isTyping: data.isTyping,
      });
    }
  }

  /**
   * Emit message delivered event
   */
  emitMessageDelivered(conversationId: string, messageId: string) {
    this.server.to(`conversation:${conversationId}`).emit('messageDelivered', {
      conversationId,
      messageId,
    });
  }

  /**
   * Emit message read event
   */
  emitMessageRead(conversationId: string, messageId: string, userId: string) {
    this.server.to(`conversation:${conversationId}`).emit('messageRead', {
      conversationId,
      messageId,
      userId,
    });
  }

  /**
   * Get cached conversations for a user
   */
  private async getCachedConversations(userId: string): Promise<Conversation[]> {
    const cacheKey = `user:conversations:${userId}`;
    
    // Check in-memory cache first
    const cached = this.conversationCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CONVERSATION_CACHE_TTL) {
      return cached.conversations;
    }

    // Check Redis cache
    const redisCached = await this.cacheService.get<Conversation[]>(cacheKey);
    if (redisCached) {
      this.conversationCache.set(userId, {
        conversations: redisCached,
        timestamp: Date.now(),
      });
      return redisCached;
    }

    // Fetch from database if not cached
    if (!this.messagingService) {
      return [];
    }

    try {
      const conversations = await this.messagingService.getConversationsForUser(userId);
      
      // Cache in both Redis and memory
      await this.cacheService.set(cacheKey, conversations, 300); // 5 minutes
      this.conversationCache.set(userId, {
        conversations,
        timestamp: Date.now(),
      });
      
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations for user:', error);
      return [];
    }
  }

  /**
   * Invalidate conversation cache for a user
   */
  private async invalidateConversationCache(userId: string): Promise<void> {
    const cacheKey = `user:conversations:${userId}`;
    await this.cacheService.delete(cacheKey);
    this.conversationCache.delete(userId);
  }

  /**
   * Emit user online status to users who have conversations with this user
   * Optimized with caching to reduce database queries
   */
  async emitUserOnlineStatus(userId: string, isOnline: boolean) {
    const lastSeen = this.userLastSeen.get(userId) || new Date();
    const statusData = {
      userId,
      isOnline,
      lastSeenAt: lastSeen,
    };

    try {
      // Get cached conversations instead of querying database every time
      const conversations = await this.getCachedConversations(userId);
      
      // Collect all user IDs who should be notified
      const userIdsToNotify = new Set<string>();
      conversations.forEach((conv) => {
        if (conv.customerId !== userId) {
          userIdsToNotify.add(conv.customerId);
        }
        if (conv.supplierId !== userId) {
          userIdsToNotify.add(conv.supplierId);
        }
      });

      // Emit to each relevant user's room
      userIdsToNotify.forEach((targetUserId) => {
        this.server.to(`user:${targetUserId}`).emit('userOnlineStatus', statusData);
      });
    } catch (error) {
      // If there's an error, fall back to namespace-wide emit
      console.error('Error emitting user online status to specific users:', error);
      this.server.emit('userOnlineStatus', statusData);
    }
  }

  /**
   * Get user online status
   */
  getUserOnlineStatus(userId: string): { isOnline: boolean; lastSeenAt: Date | null } {
    const isOnline = this.connectedUsers.has(userId);
    const lastSeen = this.userLastSeen.get(userId) || null;
    return { isOnline, lastSeenAt: lastSeen };
  }
}

